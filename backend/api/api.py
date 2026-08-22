"""
api/api.py — Django Ninja Router for TruthDNA
Includes Media Forensics, Social Video & Reel URL Stream Analysis, and Fact-Checking Claims.
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
from pydantic import BaseModel

import google.genai as genai
from django.conf import settings
from ninja import NinjaAPI, Router, File, Form
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
from link_analyzer import (
    is_social_video_url,
    extract_social_video_and_metadata,
    extract_article_content,
)
from claim_verifier import verify_claim_grounding
from agent import (
    build_analysis_prompt,
    build_claim_analysis_prompt,
    build_link_analysis_prompt,
    synthesize_report,
)
from .models import AnalysisLog

# Global server start time
_server_start_time = time.time()

# Gemini Client Initialization
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Ninja API Instance
api = NinjaAPI(
    title="TruthDNA Forensic Media & Claim Verification API (Django)",
    version="0.2.0",
    description="Django Ninja backend for TruthDNA. Delivers Evidence, Confidence & Uncertainty diagnostics across Media, Social Reels, URLs and Claims.",
    urls_namespace="truthdna_api",
)

router = Router(tags=["Admin"])

# Limits
MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB limit
SUPPORTED_IMAGE_TYPES: set = {"image/jpeg", "image/png", "image/webp", "image/gif"}
SUPPORTED_VIDEO_TYPES: set = {"video/mp4", "video/webm", "video/quicktime", "video/mpeg"}
SUPPORTED_TYPES: set = SUPPORTED_IMAGE_TYPES | SUPPORTED_VIDEO_TYPES


class LinkAnalysisRequest(BaseModel):
    url: str


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


@api.get("/api/setup-admin", tags=["System"])
def setup_admin_credentials(request):
    """One-click admin superuser provisioner."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user, created = User.objects.get_or_create(username="admin", defaults={"email": "admin@truthdna.local"})
    user.set_password("adminpassword")
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return {
        "status": "success",
        "message": "Superuser active and ready",
        "username": "admin",
        "password": "adminpassword",
        "action": "created" if created else "password_reset",
        "login_url": "/admin/",
    }


# ─── 1. Media Forensics Analysis Endpoint ────────────────────────────────────

@api.post(
    "/api/analyze",
    response=MediaDNAReport,
    tags=["Forensics"],
    summary="Analyze media for forensic signals (3-pillar diagnostic)",
)
def analyze_media(
    request,
    file: UploadedFile = File(...),
    claim: Optional[str] = Form(None),
):
    """
    Full TruthDNA forensic pipeline executed inside Django Ninja.
    Supports optional claim caption to test cross-modal discrepancy.
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
    search_desc = f"{media_type} forensic analysis {claim or file.name or ''}"
    search_query = build_search_query(
        description=search_desc,
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

    if claim:
        prompt += f"\n\nCLAIMED CONTEXT: '{claim}'\nVerify whether visual and forensic evidence supports or contradicts this claim."

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


# ─── 2. Social Video & Web Link Analysis Endpoint ─────────────────────────────

@api.post(
    "/api/analyze-link",
    response=MediaDNAReport,
    tags=["Link & Reel Verification"],
    summary="Analyze Instagram Reels, Facebook Videos, YouTube Shorts, or News URLs",
)
def analyze_link(request, payload: LinkAnalysisRequest):
    """
    Directly streams and analyzes Instagram Reels, FB Videos, YouTube Shorts, or web article URLs.
    """
    url = payload.url.strip()
    if not url:
        raise HttpError(400, "URL cannot be empty.")

    start_time = time.monotonic()
    fallback_notes: List[str] = []
    is_video_link = is_social_video_url(url)

    phash_str: Optional[str] = None
    embedding_valid: bool = False
    semantic_vector_for_report: Optional[List[float]] = None
    lineage_match_found: bool = False
    video_summary: Optional[str] = None

    if is_video_link:
        video_path, meta, stream_fallback, note = extract_social_video_and_metadata(url, max_duration_seconds=15)
        if stream_fallback:
            fallback_notes.append(note)

        article_data = {
            "title": meta.get("title") or url,
            "domain": "social_video_stream",
            "is_satire": False,
            "description": meta.get("description") or "",
            "uploader": meta.get("uploader") or "",
            "body": meta.get("description") or meta.get("title") or "",
        }

        if video_path and os.path.exists(video_path):
            try:
                frames, frame_summary = extract_frames(video_path)
                ela_score, ela_finding = compute_ela_score_for_video_frames(frames)
                video_summary = f"Frames sampled: {len(frames)} (15s budget). ELA score: {ela_score:.4f}. {ela_finding}"

                if frames:
                    import cv2
                    from PIL import Image
                    first_rgb = cv2.cvtColor(frames[0], cv2.COLOR_BGR2RGB)
                    pil_first = Image.fromarray(first_rgb)
                    buf = io.BytesIO()
                    pil_first.save(buf, format="JPEG", quality=90)
                    key_bytes = buf.getvalue()

                    phash_str, _ = compute_phash(key_bytes)
                    embedding, embedding_valid, emb_note = extract_clip_embedding(key_bytes)
                    if embedding_valid:
                        semantic_vector_for_report = embedding
                        _, lineage_match_found, lineage_finding = search_similar(embedding, True)
                        video_summary += f" | Ledger match: {lineage_match_found} ({lineage_finding})"
                    else:
                        fallback_notes.append(emb_note)
            except Exception as exc:
                fallback_notes.append(f"Video stream frame analysis error: {exc}")
            finally:
                try:
                    os.unlink(video_path)
                except Exception:
                    pass
    else:
        # Standard web article
        article_data, scrape_fallback, note = extract_article_content(url)
        if scrape_fallback:
            fallback_notes.append(note)

    # Search grounding across fact-check registries
    query_text = article_data.get("title") or article_data.get("description") or url
    search_results, all_failed, search_notes = verify_claim_grounding(query_text)
    if all_failed:
        fallback_notes.append("Web fact-check search returned no external records.")

    prompt = build_link_analysis_prompt(
        url=url,
        article_data=article_data,
        search_results=search_results,
        video_forensics_summary=video_summary,
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

    AnalysisLog.objects.create(
        filename=url[:100],
        media_type="social_reel" if is_video_link else "web_link",
        ela_score=0.0,
        lineage_match=lineage_match_found,
        embedding_valid=embedding_valid,
        search_failed=all_failed,
        duration_sec=round(elapsed, 2),
    )

    return report


# ─── 3. Text Claim & Social Post Verification Endpoint ─────────────────────────

@api.post(
    "/api/analyze-claim",
    response=MediaDNAReport,
    tags=["Fact-Checking"],
    summary="Verify viral text claims, rumors, headlines, or screenshot posts",
)
def analyze_claim(
    request,
    claim: str = Form(...),
    file: Optional[UploadedFile] = File(None),
):
    """
    Verify text claims or social media screenshots against global fact-checking registries.
    """
    clean_claim = claim.strip()
    if not clean_claim:
        raise HttpError(400, "Claim text cannot be empty.")

    start_time = time.monotonic()
    fallback_notes: List[str] = []
    media_context: Optional[str] = None
    phash_str: Optional[str] = None
    embedding_valid: bool = False
    semantic_vector_for_report: Optional[List[float]] = None
    lineage_match_found: bool = False

    if file:
        try:
            raw_bytes = file.read()
            ela_score, ela_finding = compute_ela_score_for_image_file(raw_bytes)
            phash_str, _ = compute_phash(raw_bytes)
            embedding, embedding_valid, emb_note = extract_clip_embedding(raw_bytes)
            if embedding_valid:
                semantic_vector_for_report = embedding
                _, lineage_match_found, lineage_finding = search_similar(embedding, True)
            else:
                fallback_notes.append(emb_note)
                lineage_finding = "Lineage search skipped (embedding invalid)."

            media_context = (
                f"Screenshot/Image attached: '{file.name}'. "
                f"ELA anomaly: {ela_score:.4f} ({ela_finding}). "
                f"Lineage: {lineage_finding}"
            )
        except Exception as exc:
            fallback_notes.append(f"Attached media processing failed: {exc}")

    # Grounding with fact-checking sources
    search_results, all_failed, search_notes = verify_claim_grounding(clean_claim)

    prompt = build_claim_analysis_prompt(
        claim_text=clean_claim,
        search_results=search_results,
        search_failed=all_failed,
        search_notes=search_notes,
        media_context=media_context,
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

    AnalysisLog.objects.create(
        filename=clean_claim[:100],
        media_type="claim_post" if file else "text_claim",
        ela_score=0.0,
        lineage_match=lineage_match_found,
        embedding_valid=embedding_valid,
        search_failed=all_failed,
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
    total_analyses = len(logs)
    lineage_matches = sum(1 for log in logs if log.lineage_match)
    fallbacks = sum(1 for log in logs if log.search_failed or not log.embedding_valid)
    avg_ela = (
        sum(log.ela_score for log in logs) / total_analyses
        if total_analyses > 0 else 0.0
    )
    avg_duration = (
        sum(log.duration_sec for log in logs) / total_analyses
        if total_analyses > 0 else 0.0
    )

    hours = uptime_sec // 3600
    minutes = (uptime_sec % 3600) // 60
    seconds = uptime_sec % 60
    uptime_human = f"{hours}h {minutes}m {seconds}s"

    return {
        "system": {
            "uptime_seconds": uptime_sec,
            "uptime_human": uptime_human,
            "python_version": platform.python_version(),
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
            "total_analyses": total_analyses,
            "lineage_matches": lineage_matches,
            "fallbacks_triggered": fallbacks,
            "avg_ela_score": round(avg_ela, 4),
            "avg_duration_sec": round(avg_duration, 2),
        },
    }


@router.get("/ledger/records")
def get_ledger_records(request) -> Dict[str, Any]:
    """Retrieve seeded records in Qdrant ledger."""
    try:
        client = get_client()
        points, _ = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=20,
            with_payload=True,
            with_vectors=False,
        )
        records = [
            {
                "id": str(pt.id),
                "payload": pt.payload or {},
            }
            for pt in points
        ]
        return {
            "collection": COLLECTION_NAME,
            "count": len(records),
            "records": records,
        }
    except Exception as exc:
        return {
            "collection": COLLECTION_NAME,
            "count": 0,
            "records": [],
            "error": str(exc),
        }


@router.get("/log")
def get_audit_log(request) -> Dict[str, Any]:
    """Fetch persistent analysis history from SQLite database."""
    logs = AnalysisLog.objects.all().order_by("-created_at")[:50]
    entries = [
        {
            "filename": l.filename,
            "media_type": l.media_type,
            "ela_score": l.ela_score,
            "lineage_match": l.lineage_match,
            "embedding_valid": l.embedding_valid,
            "search_failed": l.search_failed,
            "duration_sec": l.duration_sec,
            "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for l in logs
    ]
    return {
        "count": len(entries),
        "entries": entries,
    }
