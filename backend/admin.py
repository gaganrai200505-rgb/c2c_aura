"""
admin.py — TruthDNA Admin API Router

Exposes internal diagnostics and system metrics for the admin dashboard.
Endpoints are read-only and do not modify any pipeline state.
"""

from __future__ import annotations

import platform
import sys
import time
from typing import Any, Dict, List

from fastapi import APIRouter

from dna_extractor import CLIP_MODEL_NAME, _clip_load_attempted, _clip_load_failed
from ledger import COLLECTION_NAME, SIMILARITY_THRESHOLD, TOP_K, VECTOR_DIM, get_client, get_collection_info

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Module-level start time
_server_start_time = time.time()

# Simple in-memory analysis log (resets on restart)
_analysis_log: List[Dict[str, Any]] = []


def log_analysis(filename: str, media_type: str, ela_score: float,
                 lineage_match: bool, embedding_valid: bool,
                 search_failed: bool, duration_sec: float) -> None:
    """Called by main.py to record each completed analysis."""
    _analysis_log.append({
        "filename": filename,
        "media_type": media_type,
        "ela_score": round(ela_score, 4),
        "lineage_match": lineage_match,
        "embedding_valid": embedding_valid,
        "search_failed": search_failed,
        "duration_sec": round(duration_sec, 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    })
    # Keep last 50 entries
    if len(_analysis_log) > 50:
        _analysis_log.pop(0)


@router.get("/stats")
async def get_stats() -> Dict[str, Any]:
    """Full system diagnostics for the admin dashboard."""
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

    total = len(_analysis_log)
    with_lineage = sum(1 for r in _analysis_log if r["lineage_match"])
    with_fallback = sum(1 for r in _analysis_log if not r["embedding_valid"] or r["search_failed"])
    avg_ela = round(sum(r["ela_score"] for r in _analysis_log) / total, 4) if total else 0.0
    avg_dur = round(sum(r["duration_sec"] for r in _analysis_log) / total, 2) if total else 0.0

    return {
        "system": {
            "uptime_seconds": uptime_sec,
            "uptime_human": _format_uptime(uptime_sec),
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
async def get_ledger_records() -> Dict[str, Any]:
    """Return all records in the Qdrant ledger."""
    try:
        client = get_client()
        results, _ = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=100,
            with_payload=True,
            with_vectors=False,
        )
        records = [
            {"id": str(pt.id), "payload": pt.payload}
            for pt in results
        ]
        return {"count": len(records), "records": records}
    except Exception as exc:
        return {"count": 0, "records": [], "error": str(exc)}


@router.get("/log")
async def get_analysis_log() -> Dict[str, Any]:
    """Return the last 50 analysis entries (resets on restart)."""
    return {
        "count": len(_analysis_log),
        "entries": list(reversed(_analysis_log)),  # newest first
    }


def _format_uptime(sec: int) -> str:
    h, r = divmod(sec, 3600)
    m, s = divmod(r, 60)
    return f"{h}h {m}m {s}s"
