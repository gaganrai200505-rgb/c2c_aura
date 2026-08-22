"""
api/api.py — Django Ninja Router for TruthDNA
"""

from __future__ import annotations

import io
import os
import sys
import tempfile
import time
import platform
from pathlib import Path
from typing import Any, Dict, List, Optional

import google.genai as genai
from django.conf import settings
from ninja import NinjaAPI, Router, File
from ninja.files import UploadedFile
from ninja.errors import HttpError

from schema import MediaDNAReport
from forensics import (
    compute_ela_score_for_image_file,
    compute_ela_score_for_video_frames,
    extract_frames,
)
from dna_extractor import (
    compute_phash,
    extract_clip_embedding,
    CLIP_MODEL_NAME,
    _clip_load_attempted,
    _clip_load_failed,
)
from ledger import (
    get_collection_info,
    search_similar,
    get_client,
    COLLECTION_NAME,
    SIMILARITY_THRESHOLD,
    TOP_K,
    VECTOR_DIM,
)
from search import build_search_query, web_search
from agent import build_analysis_prompt, synthesize_report
from .models import AnalysisLog

# Global server start time
_server_start_time = time.time()

# Gemini Client Initialization
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Ninja API Instance
api = NinjaAPI(
    title="TruthDNA Forensic Media Analysis API (Django)",
    version="0.1.0",
    description="Django Ninja backend for TruthDNA. Delivers Evidence, Confidence & Uncertainty diagnostics.",
    urls_namespace="truthdna_api",
)

router = Router(tags=["Admin"])

# Limits
MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB limit
SUPPORTED_IMAGE_TYPES: set = {"image/jpeg", "image/png", "image/webp", "image/gif"}
SUPPORTED_VIDEO_TYPES: set = {"video/mp4", "video/webm", "video/quicktime", "video/mpeg"}
SUPPORTED_TYPES: set = SUPPORTED_IMAGE_TYPES | SUPPORTED_VIDEO_TYPES


@api.get("/health", tags=["System"])
def health_check(request):
    """Liveness check."""
    try:
        ledger_info = get_collection_info()
    except Exception:
        ledger_info = {"status": "unavailable"}

    return {
        "status": "ok",
        "service": "TruthDNA (Django Ninja)",
        "gemini_api_key_present": bool(GEMINI_API_KEY),
        "ledger": ledger_info,
    }


@api.post(
    "/api/analyze",
    response=MediaDNAReport,
    tags=["Forensics"],
    summary="Analyze media for forensic signals (3-pillar diagnostic)",
)
def analyze_media(request, file: UploadedFile = File(...)):
    """
    Full TruthDNA forensic pipeline executed inside Django Ninja.
    """
    start_time = time.monotonic()
    fallback_notes: List[str] = []

    # File size validation
    raw_bytes = file.read()
    file_size = len(raw_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HttpError(
            413,
            f"File too large: {file_size / 1024 / 1024:.1f}MB exceeds 20MB limit.",
        )

    content_type = file.content_type or ""
    if content_type not in SUPPORTED_TYPES:
        raise HttpError(
            415,
            f"Unsupported media type: '{content_type}'. Supported types: {sorted(SUPPORTED_TYPES)}",
        )

    is_video = content_type in SUPPORTED_VIDEO_TYPES
    media_type = "video" if is_video else "image"

    # Step 1: ELA Micro-Forensics
    ela_score: float = 0.0
    ela_finding: str = ""
    frame_extraction_summary: Optional[str] = None
    key_frame_bytes: bytes = raw_bytes

    if is_video:
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.name or "upload").suffix or ".mp4",
            delete=False,
        ) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name

        try:
            frames, frame_extraction_summary = extract_frames(tmp_path)
            ela_score, ela_finding = compute_ela_score_for_video_frames(frames)
            if frames:
                import cv2
                from PIL import Image
                first_rgb = cv2.cvtColor(frames[0], cv2.COLOR_BGR2RGB)
                pil_first = Image.fromarray(first_rgb)
                buf = io.BytesIO()
                pil_first.save(buf, format="JPEG", quality=95)
                key_frame_bytes = buf.getvalue()
        except Exception as exc:
            ela_score = 0.0
            ela_finding = f"Video ELA failed ({exc}). Score is uninformative."
            fallback_notes.append(f"Video frame extraction/ELA failed: {exc}")
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    else:
        ela_score, ela_finding = compute_ela_score_for_image_file(raw_bytes)

    # Step 2: DNA Extraction
    phash_str, _ = compute_phash(key_frame_bytes)
    embedding, embedding_valid, embedding_note = extract_clip_embedding(key_frame_bytes)

    if not embedding_valid:
        fallback_notes.append(embedding_note)

    semantic_vector_for_report = embedding if embedding_valid else None

    # Step 3: Ledger Search
    _, lineage_match_found, lineage_finding = search_similar(embedding, embedding_valid)

    if not embedding_valid:
        fallback_notes.append(
            "Vector lineage search hard-skipped (embedding_valid=False). "
            "lineage_match_found=False is UNINFORMATIVE in this case."
        )

    # Step 4: Web Search Grounding
    search_query = build_search_query(
        description=f"{media_type} forensic analysis {file.name or ''}",
        location_hint=None,
        date_hint=None,
    )
    search_results, search_failed, search_note = web_search(search_query)

    if search_failed:
        fallback_notes.append(search_note)

    # Step 5: LLM Synthesis
    prompt = build_analysis_prompt(
        media_type=media_type,
        filename=file.name or "unknown",
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
        "acoustic_vector": None,
    }

    report: MediaDNAReport = synthesize_report(
        prompt=prompt,
        digital_genome_data=digital_genome_data,
        client=gemini_client,
    )

    elapsed = time.monotonic() - start_time

    # Record in persistent Django database
    AnalysisLog.objects.create(
        filename=file.name or "unknown",
        media_type=media_type,
        ela_score=round(ela_score, 4),
        lineage_match=lineage_match_found,
        embedding_valid=embedding_valid,
        search_failed=search_failed,
        duration_sec=round(elapsed, 2),
    )

    return report


# ─── Admin Telemetry Endpoints ────────────────────────────────────────────────

@router.get("/stats")
def get_stats(request) -> Dict[str, Any]:
    """System diagnostics for the Django Admin Dashboard."""
    uptime_sec = int(time.time() - _server_start_time)

    try:
        ledger_info = get_collection_info()
    except Exception as exc:
        ledger_info = {"error": str(exc)}

    clip_status = (
        "loaded" if (_clip_load_attempted and not _clip_load_failed)
        else "failed" if _clip_load_failed
        else "not_loaded_yet"
    )

    logs = list(AnalysisLog.objects.all()[:50])
    total = AnalysisLog.objects.count()
    with_lineage = sum(1 for r in logs if r.lineage_match)
    with_fallback = sum(1 for r in logs if not r.embedding_valid or r.search_failed)
    avg_ela = round(sum(r.ela_score for r in logs) / len(logs), 4) if logs else 0.0
    avg_dur = round(sum(r.duration_sec for r in logs) / len(logs), 2) if logs else 0.0

    return {
        "system": {
            "uptime_seconds": uptime_sec,
            "uptime_human": f"{uptime_sec // 3600}h {(uptime_sec % 3600) // 60}m {uptime_sec % 60}s",
            "python_version": sys.version.split()[0],
            "platform": platform.system(),
        },
        "clip_model": {
            "status": clip_status,
            "model_name": CLIP_MODEL_NAME,
            "load_attempted": _clip_load_attempted,
            "load_failed": _clip_load_failed,
        },
        "ledger": ledger_info,
        "ledger_config": {
            "collection": COLLECTION_NAME,
            "vector_dim": VECTOR_DIM,
            "similarity_threshold": SIMILARITY_THRESHOLD,
            "top_k": TOP_K,
        },
        "analysis_stats": {
            "total_analyses": total,
            "lineage_matches": with_lineage,
            "fallbacks_triggered": with_fallback,
            "avg_ela_score": avg_ela,
            "avg_duration_sec": avg_dur,
        },
    }


@router.get("/ledger/records")
def get_ledger_records(request) -> Dict[str, Any]:
    """Return records in the vector ledger."""
    try:
        client = get_client()
        results, _ = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=100,
            with_payload=True,
            with_vectors=False,
        )
        records = [{"id": str(pt.id), "payload": pt.payload} for pt in results]
        return {"count": len(records), "records": records}
    except Exception as exc:
        return {"count": 0, "records": [], "error": str(exc)}


@router.get("/log")
def get_analysis_log(request) -> Dict[str, Any]:
    """Return recent analysis entries from Django SQLite DB."""
    logs = AnalysisLog.objects.all()[:50]
    entries = [
        {
            "filename": l.filename,
            "media_type": l.media_type,
            "ela_score": l.ela_score,
            "lineage_match": l.lineage_match,
            "embedding_valid": l.embedding_valid,
            "search_failed": l.search_failed,
            "duration_sec": l.duration_sec,
            "timestamp": l.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        for l in logs
    ]
    return {"count": len(entries), "entries": entries}
