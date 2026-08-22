"""
seed_ledger.py — TruthDNA Ledger Seeding Script

Purpose:
  Populate the in-memory Qdrant ledger with baseline historical event records.
  These serve as reference points for lineage matching during media analysis.

⚠️  CRITICAL OPERATIONAL NOTE:
  Qdrant is running in :memory: mode. All records are LOST when the backend
  process exits. This script MUST be re-run on every backend restart.

Usage:
  python seed_ledger.py

  Or integrate into the FastAPI startup sequence (see main.py lifespan hook).

Seed Records:
  The embeddings here are synthetic unit vectors constructed to approximate
  directional diversity in the 512-dimensional CLIP space. They are NOT
  real CLIP embeddings of actual media — they serve as structural placeholders
  for demonstrating lineage matching functionality.

  To replace with real embeddings: run dna_extractor.extract_clip_embedding()
  on genuine reference images and paste the returned vectors here.
"""

from __future__ import annotations

import logging
import math
import sys
from typing import Any, Dict, List

# Ensure the backend package root is on the path when run as a standalone script
sys.path.insert(0, ".")

from ledger import get_collection_info, upsert_record

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("seed_ledger")

# ---------------------------------------------------------------------------
# Seed Record Definitions
# ---------------------------------------------------------------------------

VECTOR_DIM = 512


def _unit_vector(direction_index: int, dim: int = VECTOR_DIM) -> List[float]:
    """
    Generate a normalized unit vector with a distinct directional bias.

    Each seed record gets a vector that points in a different, reproducible
    direction in the embedding space. This ensures meaningful cosine distance
    separations between seed entries.

    Args:
        direction_index: Integer controlling the vector's primary orientation.
        dim: Total vector dimensionality.

    Returns:
        L2-normalized list of floats.
    """
    vec = [0.0] * dim
    # Create a smooth cosine-based pattern with a direction bias
    for i in range(dim):
        phase = (2 * math.pi * i / dim) + (direction_index * math.pi / 4)
        vec[i] = math.cos(phase) + (0.1 * math.sin(direction_index * i * 0.01))

    # L2 normalize
    norm = math.sqrt(sum(x**2 for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


SEED_RECORDS: List[Dict[str, Any]] = [
    {
        "record_id": "00000000-0000-0000-0000-000000000001",
        "payload": {
            "event_id": "2022_gujarat_floods",
            "description": (
                "Aerial footage of the 2022 Gujarat flood disaster. "
                "Reference record for water-inundation imagery circulated during the event."
            ),
            "source_url": "https://archive.example.org/gujarat-floods-2022",
            "capture_date": "2022-08-01",
            "region": "Gujarat, India",
            "media_type": "image",
            "tags": ["flood", "disaster", "india", "2022"],
            "is_seed": True,
        },
        "embedding_direction": 1,
    },
    {
        "record_id": "00000000-0000-0000-0000-000000000002",
        "payload": {
            "event_id": "2023_turkey_earthquake_rescue",
            "description": (
                "Ground-level imagery from Kahramanmaraş rescue operations following "
                "the February 2023 Turkey–Syria earthquakes. Reference for rubble/rescue scenes."
            ),
            "source_url": "https://archive.example.org/turkey-earthquake-2023",
            "capture_date": "2023-02-08",
            "region": "Kahramanmaraş, Turkey",
            "media_type": "image",
            "tags": ["earthquake", "rescue", "turkey", "2023", "disaster"],
            "is_seed": True,
        },
        "embedding_direction": 5,
    },
]


# ---------------------------------------------------------------------------
# Seeding Logic
# ---------------------------------------------------------------------------

def seed() -> int:
    """
    Insert all SEED_RECORDS into the in-memory Qdrant ledger.

    Returns:
        Number of records successfully inserted.
    """
    logger.info("=" * 60)
    logger.info("TruthDNA Ledger Seeding — START")
    logger.info("=" * 60)
    logger.warning(
        "⚠️  MEMORY MODE: Qdrant is running in-memory. "
        "These records will be LOST when the backend process exits. "
        "Re-run this script after every backend restart."
    )

    inserted = 0
    for record in SEED_RECORDS:
        try:
            embedding = _unit_vector(record["embedding_direction"])
            record_id = upsert_record(
                embedding=embedding,
                payload=record["payload"],
                record_id=record["record_id"],
            )
            logger.info(
                f"  ✓ Seeded: [{record['payload']['event_id']}] "
                f"(id={record_id})"
            )
            inserted += 1
        except Exception as exc:
            logger.error(
                f"  ✗ Failed to seed [{record['payload']['event_id']}]: {exc}"
            )

    # Print collection stats
    try:
        info = get_collection_info()
        logger.info(f"Ledger status after seeding: {info}")
    except Exception as exc:
        logger.warning(f"Could not fetch collection info: {exc}")

    logger.info("=" * 60)
    logger.info(f"Seeding complete. {inserted}/{len(SEED_RECORDS)} records inserted.")
    logger.info("=" * 60)
    return inserted


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    count = seed()
    sys.exit(0 if count > 0 else 1)
