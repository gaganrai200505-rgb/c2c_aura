"""
main.py — TruthDNA FastAPI Application

Entry point for the TruthDNA backend. This module:
  1. Validates the environment (GEMINI_API_KEY must be present at startup).
  2. Seeds the in-memory Qdrant ledger on every startup.
  3. Exposes POST /api/analyze — the full forensic pipeline endpoint.
  4. Enforces a 20MB file size limit on uploads.
  5. Wires together: forensics → dna_extractor → ledger → search → agent.

CORS:
  Configured to allow all origins for local development.
  Restrict origins before deploying to production.

STARTUP BEHAVIOR:
  - Missing GEMINI_API_KEY → sys.exit(1) immediately. No partial startup.
  - Qdrant ledger is auto-seeded on startup (in-memory mode, seeds lost on restart).
"""

from __future__ import annotations

import io
import logging
import os
import sys
import tempfile
import time
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load .env before any other imports that might need env vars
load_dotenv()

import google.genai as genai
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agent import build_analysis_prompt, synthesize_report
from dna_extractor import compute_phash, extract_clip_embedding
from forensics import (
    compute_ela_score_for_image_file,
    compute_ela_score_for_video_frames,
    extract_frames,
)
from ledger import get_collection_info, search_similar
from schema import MediaDNAReport
from search import build_search_query, web_search
from seed_ledger import seed as seed_ledger

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("truthdna.main")

# ---------------------------------------------------------------------------
# Environment Validation — MUST be first
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.critical(
        "FATAL: GEMINI_API_KEY environment variable is not set. "
        "Copy backend/.env.example to backend/.env and add your key. "
        "Exiting."
    )
    sys.exit(1)

logger.info("✓ GEMINI_API_KEY detected.")

# ---------------------------------------------------------------------------
# Gemini Client — initialized once at module level
# ---------------------------------------------------------------------------

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
logger.info("✓ Gemini client initialized.")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024   # 20 MB hard limit
SUPPORTED_IMAGE_TYPES: set = {"image/jpeg", "image/png", "image/webp", "image/gif"}
SUPPORTED_VIDEO_TYPES: set = {"video/mp4", "video/webm", "video/quicktime", "video/mpeg"}
SUPPORTED_TYPES: set = SUPPORTED_IMAGE_TYPES | SUPPORTED_VIDEO_TYPES

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TruthDNA Forensic Media Analysis API",
    description=(
        "Forensic media analysis API. Never returns binary verdicts. "
        "All responses enforce the 3-pillar diagnostic: Evidence, Confidence, Uncertainty."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — open for local development; restrict before production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup Event — Seed the Ledger
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    """
    Auto-seed the in-memory Qdrant ledger on every startup.

    Because Qdrant runs in :memory: mode, records are lost when the process
    exits. This hook ensures the ledger is always populated at startup.
    """
    logger.info("Running startup ledger seeding...")
    try:
        count = seed_ledger()
        info = get_collection_info()
        logger.info(f"✓ Ledger seeded: {count} records. Collection info: {info}")
    except Exception as exc:
        logger.error(f"Ledger seeding failed at startup: {exc}. Lineage matching will be degraded.")


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health_check():
    """Quick liveness check."""
    try:
        ledger_info = get_collection_info()
    except Exception:
        ledger_info = {"status": "unavailable"}

    return {
        "status": "ok",
        "service": "TruthDNA",
        "gemini_api_key_present": bool(GEMINI_API_KEY),
        "ledger": ledger_info,
    }


# ---------------------------------------------------------------------------
# Core Analysis Endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/api/analyze",
    response_model=MediaDNAReport,
    tags=["Forensics"],
    summary="Analyze media for forensic signals (3-pillar diagnostic)",
    description=(
        "Upload an image or video file. "
        "Returns a MediaDNAReport with Evidence, Confidence, and Uncertainty pillars. "
        "Maximum file size: 20MB. "
        "NEVER returns a binary TRUE/FALSE verdict."
    ),
)
async def analyze_media(file: UploadFile = File(...)):
    """
    Full TruthDNA forensic pipeline:
      1. Validate file size and type.
      2. Run ELA micro-forensics.
      3. Compute pHash + CLIP embedding (with fallback).
      4. Search vector ledger (hard-skipped if embedding invalid).
      5. Run DuckDuckGo web search (with fallback).
      6. Synthesize MediaDNAReport via Gemini 2.5 Flash.
      7. Return validated report.
    """
    start_time = time.monotonic()
    fallback_notes: List[str] = []

    # ── Step 0: Read and Validate File ────────────────────────────────────
    logger.info(f"Received upload: '{file.filename}' (content_type={file.content_type})")

    raw_bytes = await file.read()
    file_size = len(raw_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large: {file_size / 1024 / 1024:.1f}MB exceeds the 20MB limit. "
                f"Please upload a smaller file."
            ),
        )
    logger.info(f"File size: {file_size / 1024:.1f}KB — within limit.")

    content_type = file.content_type or ""
    if content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported media type: '{content_type}'. "
                f"Supported types: {sorted(SUPPORTED_TYPES)}"
            ),
        )

    is_video = content_type in SUPPORTED_VIDEO_TYPES
    media_type = "video" if is_video else "image"
    logger.info(f"Media type detected: {media_type}")

    # ── Step 1: ELA Micro-Forensics ────────────────────────────────────────
    ela_score: float = 0.0
    ela_finding: str = ""
    frame_extraction_summary: Optional[str] = None
    key_frame_bytes: bytes = raw_bytes   # Default: full image bytes for DNA extraction

    if is_video:
        logger.info("Extracting video frames (capped at 15s/1fps)...")
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.filename or "upload").suffix or ".mp4",
            delete=False,
        ) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name

        try:
            frames, frame_extraction_summary = extract_frames(tmp_path)
            ela_score, ela_finding = compute_ela_score_for_video_frames(frames)

            # Use the first frame for DNA extraction
            if frames:
                import cv2  # noqa: PLC0415
                from PIL import Image  # noqa: PLC0415
                first_rgb = cv2.cvtColor(frames[0], cv2.COLOR_BGR2RGB)
                pil_first = Image.fromarray(first_rgb)
                buf = io.BytesIO()
                pil_first.save(buf, format="JPEG", quality=95)
                key_frame_bytes = buf.getvalue()
        except Exception as exc:
            ela_score = 0.0
            ela_finding = f"Video ELA failed ({exc}). Score is uninformative."
            fallback_notes.append(f"Video frame extraction/ELA failed: {exc}")
            logger.error(f"Video forensics error: {exc}")
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    else:
        logger.info("Running ELA on image...")
        ela_score, ela_finding = compute_ela_score_for_image_file(raw_bytes)

    logger.info(f"ELA complete — score={ela_score:.4f}")

    # ── Step 2: DNA Extraction ─────────────────────────────────────────────
    logger.info("Computing pHash...")
    phash_str, phash_finding = compute_phash(key_frame_bytes)

    logger.info("Extracting CLIP embedding (with fallback)...")
    embedding, embedding_valid, embedding_note = extract_clip_embedding(key_frame_bytes)

    if not embedding_valid:
        fallback_notes.append(embedding_note)

    semantic_vector_for_report = embedding if embedding_valid else None

    # ── Step 3: Ledger Search ──────────────────────────────────────────────
    logger.info(f"Searching vector ledger (embedding_valid={embedding_valid})...")
    _, lineage_match_found, lineage_finding = search_similar(embedding, embedding_valid)

    if not embedding_valid:
        fallback_notes.append(
            "Vector lineage search hard-skipped (embedding_valid=False). "
            "lineage_match_found=False is UNINFORMATIVE in this case."
        )

    # ── Step 4: Web Search ─────────────────────────────────────────────────
    logger.info("Running web search grounding...")
    search_query = build_search_query(
        description=f"{media_type} forensic analysis {file.filename or ''}",
        location_hint=None,
        date_hint=None,
    )
    search_results, search_failed, search_note = web_search(search_query)

    if search_failed:
        fallback_notes.append(search_note)

    # ── Step 5: LLM Synthesis ──────────────────────────────────────────────
    logger.info("Assembling forensic prompt for Gemini...")
    prompt = build_analysis_prompt(
        media_type=media_type,
        filename=file.filename or "unknown",
        ela_score=ela_score,
        ela_finding=ela_finding,
        phash=phash_str,
        embedding_valid=embedding_valid,
        lineage_match_found=lineage_match_found,
        lineage_finding=lineage_finding,
        search_results=search_results,
        search_failed=search_failed,
        search_note=search_note,
        frame_extraction_summary=frame_extraction_summary,
        fallback_notes=fallback_notes,
    )

    digital_genome_data = {
        "visual_phash": phash_str,
        "semantic_vector": semantic_vector_for_report,
        "acoustic_vector": None,  # Audio analysis not yet implemented
    }

    logger.info("Calling Gemini synthesis engine...")
    report: MediaDNAReport = synthesize_report(
        prompt=prompt,
        digital_genome_data=digital_genome_data,
        client=gemini_client,
    )

    elapsed = time.monotonic() - start_time
    logger.info(f"Analysis complete in {elapsed:.2f}s — lineage_match={lineage_match_found}")

    return report


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
