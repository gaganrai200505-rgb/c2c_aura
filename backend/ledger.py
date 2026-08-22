"""
ledger.py — TruthDNA Vector Memory Ledger

Responsibilities:
  1. Initialize a Qdrant vector database in :memory: mode.
  2. Provide an upsert function for seeding historical records.
  3. Provide a similarity search function for lineage matching.

CRITICAL SAFETY CONTRACT:
  If embedding_valid=False is passed by the caller (indicating a zero-vector
  sentinel from dna_extractor.py), this module MUST hard-skip the vector search
  and return an empty result. This prevents false positive lineage matches
  that would arise from comparing zero-vectors against real embeddings.

MEMORY MODE WARNING:
  The Qdrant collection lives entirely in process memory.
  It is destroyed when the FastAPI process exits.
  seed_ledger.py MUST be re-run on every backend restart.

SIGNAL INTERPRETATION WARNING:
  Vector similarity matches are weak, non-dispositive signals.
  A high cosine similarity score indicates visual/semantic resemblance
  but does NOT establish shared provenance or confirm manipulation.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    PointStruct,
    ScoredPoint,
    VectorParams,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

COLLECTION_NAME: str = "truthdna_lineage"
VECTOR_DIM: int = 512                  # Must match CLIP output dimension
SIMILARITY_THRESHOLD: float = 0.80    # Minimum cosine similarity to flag a match
TOP_K: int = 3                         # Max results to return per search

# ---------------------------------------------------------------------------
# Singleton Client
# ---------------------------------------------------------------------------

# Module-level singleton — shared across all requests in the same process.
_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    """
    Return the module-level Qdrant in-memory client, initializing it if needed.

    The collection is created on first access. Subsequent calls return the
    existing client without re-creating the collection.
    """
    global _client

    if _client is None:
        logger.info("Initializing Qdrant in-memory client and collection...")
        _client = QdrantClient(":memory:")

        # Create collection only if it doesn't already exist
        existing = [c.name for c in _client.get_collections().collections]
        if COLLECTION_NAME not in existing:
            _client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            )
            logger.info(f"Collection '{COLLECTION_NAME}' created (dim={VECTOR_DIM}, metric=COSINE).")
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' already exists.")

    return _client


# ---------------------------------------------------------------------------
# Upsert (for seeding and future ingestion)
# ---------------------------------------------------------------------------

def upsert_record(
    embedding: List[float],
    payload: Dict[str, Any],
    record_id: Optional[str] = None,
) -> str:
    """
    Insert or update a record in the vector ledger.

    Args:
        embedding: 512-dimensional CLIP vector (must be valid, NOT zero-vector).
        payload:   Metadata dict (e.g., event_id, description, source_url, date).
        record_id: Optional UUID string. Auto-generated if None.

    Returns:
        The UUID string of the upserted point.

    Raises:
        ValueError: If the embedding dimension does not match VECTOR_DIM.
    """
    if len(embedding) != VECTOR_DIM:
        raise ValueError(
            f"Embedding dimension mismatch: expected {VECTOR_DIM}, got {len(embedding)}. "
            f"Ensure CLIP model output is 512-dimensional."
        )

    client = get_client()
    point_id = record_id or str(uuid.uuid4())

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=embedding,
                payload=payload,
            )
        ],
    )
    logger.info(f"Upserted record '{point_id}' — payload keys: {list(payload.keys())}")
    return point_id


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

def search_similar(
    embedding: List[float],
    embedding_valid: bool,
) -> tuple[list[ScoredPoint], bool, str]:
    """
    Search the ledger for semantically similar historical records.

    CRITICAL SAFETY CHECK:
      If embedding_valid=False, this function HARD-SKIPS the search and returns
      an empty list. This prevents zero-vector sentinel values from generating
      spurious high-similarity matches.

    Args:
        embedding:       512-dimensional query vector from dna_extractor.py.
        embedding_valid: Flag from dna_extractor. MUST be False for zero-vectors.

    Returns:
        A tuple of:
          - List[ScoredPoint]: Matching records above SIMILARITY_THRESHOLD.
            Empty list if embedding_valid=False or no matches found.
          - bool: lineage_match_found (True if at least one result above threshold).
          - str: Human-readable finding for the ForensicSignal.
    """
    # ── CRITICAL SAFETY CHECK ──────────────────────────────────────────────
    if not embedding_valid:
        msg = (
            "Vector lineage search HARD-SKIPPED: embedding_valid=False. "
            "Zero-vector sentinel detected from DNA extractor; searching against it "
            "would produce meaningless false-positive matches."
        )
        logger.warning(msg)
        return [], False, msg
    # ──────────────────────────────────────────────────────────────────────

    client = get_client()

    try:
        results: List[ScoredPoint] = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=embedding,
            limit=TOP_K,
            score_threshold=SIMILARITY_THRESHOLD,
        )
    except Exception as exc:
        logger.error(f"Qdrant search error: {exc}")
        error_msg = (
            f"Vector lineage search failed due to an internal error ({exc}). "
            f"Treat lineage_match_found=False as uninformative."
        )
        return [], False, error_msg

    match_found = len(results) > 0

    if match_found:
        top = results[0]
        finding = (
            f"Lineage match detected: top hit '{top.payload.get('event_id', 'unknown')}' "
            f"with cosine similarity {top.score:.4f} (threshold={SIMILARITY_THRESHOLD}). "
            f"Description: {top.payload.get('description', 'N/A')}. "
            f"NOTE: Vector similarity indicates semantic resemblance, NOT confirmed provenance."
        )
    else:
        finding = (
            f"No lineage match found above threshold {SIMILARITY_THRESHOLD}. "
            f"The media does not closely resemble any record in the historical ledger. "
            f"NOTE: The ledger is seeded with a small baseline dataset; absence of a match "
            f"does NOT confirm the media is novel or authentic."
        )

    logger.info(f"Lineage search complete. Match found: {match_found}. Results: {len(results)}")
    return results, match_found, finding


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------

def get_collection_info() -> Dict[str, Any]:
    """Return basic stats about the ledger collection (for health checks)."""
    client = get_client()
    info = client.get_collection(COLLECTION_NAME)
    return {
        "collection_name": COLLECTION_NAME,
        "vector_count": info.points_count,
        "vector_dim": VECTOR_DIM,
        "distance_metric": "COSINE",
        "similarity_threshold": SIMILARITY_THRESHOLD,
    }
