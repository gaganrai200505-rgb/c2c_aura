"""
dna_extractor.py — TruthDNA Digital DNA Extractor

Responsibilities:
  1. Compute a perceptual hash (pHash) from an image for near-duplicate detection.
  2. Extract a 512-dimensional CLIP semantic embedding for vector-similarity search.

CRITICAL FALLBACK CONTRACT:
  CLIP loading and inference are wrapped in try/except blocks.
  On ANY failure (model load, timeout, CUDA OOM, import error):
    - semantic_vector = [0.0] * 512   (zero-vector sentinel, NOT random noise)
    - embedding_valid = False
  The caller MUST propagate embedding_valid to the ledger search function,
  which will hard-skip the vector search to prevent false matches from zero-vectors.

DESIGN NOTE:
  CLIP embeddings are loaded lazily and cached at module level.
  Subsequent requests reuse the cached model to reduce latency.
"""

from __future__ import annotations

import io
import logging
import time
from functools import lru_cache
from typing import List, Tuple

import imagehash
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ZERO_VECTOR: List[float] = [0.0] * 512        # Sentinel for failed embeddings
CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"
CLIP_LOAD_TIMEOUT_SECS: float = 60.0          # Max time to wait for model load


# ---------------------------------------------------------------------------
# Perceptual Hash
# ---------------------------------------------------------------------------

def compute_phash(image_bytes: bytes) -> Tuple[str | None, str]:
    """
    Compute the perceptual hash (pHash) of an image.

    pHash is robust to minor resizing, compression, and color adjustments.
    It is used for near-duplicate lineage matching in the vector ledger.

    Args:
        image_bytes: Raw bytes of the image file.

    Returns:
        A tuple of:
          - str | None: Hex string of the pHash, or None if computation failed.
          - str: Human-readable finding for the ForensicSignal.

    Signal Interpretation:
        A pHash match (Hamming distance ≤ 10) indicates near-duplicate content.
        This is a lineage signal, NOT an authenticity verdict.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        phash_value = imagehash.phash(image)
        phash_str = str(phash_value)

        finding = (
            f"Perceptual hash computed: {phash_str}. "
            f"This fingerprint enables near-duplicate detection against the historical ledger. "
            f"A match indicates visual similarity, not necessarily shared provenance."
        )
        logger.info(f"pHash: {phash_str}")
        return phash_str, finding

    except Exception as exc:
        logger.exception(f"pHash computation failed: {exc}")
        finding = f"Perceptual hash could not be computed (error: {exc}). Lineage matching via pHash is unavailable."
        return None, finding


# ---------------------------------------------------------------------------
# CLIP Embedding — Lazy-loaded with safe fallback
# ---------------------------------------------------------------------------

# Module-level cache for the CLIP model and processor.
# None means "not yet attempted". False means "load failed permanently."
_clip_model = None
_clip_processor = None
_clip_load_attempted: bool = False
_clip_load_failed: bool = False


def _load_clip_model() -> bool:
    """
    Attempt to load the CLIP model and processor into module-level cache.

    Returns:
        True if model is ready, False if loading failed.
    """
    global _clip_model, _clip_processor, _clip_load_attempted, _clip_load_failed

    if _clip_load_attempted:
        return not _clip_load_failed

    _clip_load_attempted = True
    logger.info(f"Loading CLIP model '{CLIP_MODEL_NAME}'...")

    try:
        # Deferred imports — only pull in transformers if called
        from transformers import CLIPModel, CLIPProcessor  # noqa: PLC0415

        start = time.monotonic()
        _clip_processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME)
        _clip_model = CLIPModel.from_pretrained(CLIP_MODEL_NAME)
        elapsed = time.monotonic() - start

        logger.info(f"CLIP model loaded successfully in {elapsed:.2f}s.")
        return True

    except Exception as exc:
        _clip_load_failed = True
        logger.error(f"CLIP model load FAILED: {exc}. Zero-vector fallback is active.")
        return False


def extract_clip_embedding(image_bytes: bytes) -> Tuple[List[float], bool, str]:
    """
    Extract a 512-dimensional CLIP semantic embedding from an image.

    CRITICAL FALLBACK:
      On ANY failure (model unavailable, OOM, inference error, import error),
      this function returns the zero-vector sentinel and embedding_valid=False.
      It NEVER returns random noise.

    Args:
        image_bytes: Raw bytes of the image file.

    Returns:
        A tuple of:
          - List[float]: 512-dimensional embedding vector.
            If embedding_valid=False, this is [0.0]*512 (zero sentinel).
          - bool: embedding_valid flag.
            True  = embedding is meaningful.
            False = embedding is invalid zero-vector; ledger search MUST be skipped.
          - str: Human-readable uncertainty note for explicit_uncertainties.

    Caller Contract:
        Always pass the returned embedding_valid flag to ledger.search_similar().
        The ledger will hard-skip the search if embedding_valid=False.
    """
    # Step 1: Attempt to load the model (uses cached instance if available)
    model_ready = _load_clip_model()

    if not model_ready:
        uncertainty_note = (
            "FALLBACK TRIGGERED: CLIP model failed to load. "
            "semantic_vector is a zero-vector sentinel and is NOT meaningful. "
            "Vector lineage search was hard-skipped to prevent false matches."
        )
        logger.warning(uncertainty_note)
        return ZERO_VECTOR.copy(), False, uncertainty_note

    # Step 2: Run inference with a full try/except guard
    try:
        import torch  # noqa: PLC0415

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        inputs = _clip_processor(images=image, return_tensors="pt")

        with torch.no_grad():
            image_features = _clip_model.get_image_features(**inputs)

        # L2-normalize the vector (standard for cosine similarity search)
        features_np = image_features.cpu().numpy().flatten()
        norm = np.linalg.norm(features_np)
        if norm > 0:
            features_np = features_np / norm

        embedding: List[float] = features_np.tolist()

        # Verify dimension — CLIP base outputs 512
        if len(embedding) != 512:
            raise ValueError(f"Unexpected CLIP embedding dimension: {len(embedding)} (expected 512)")

        logger.info(f"CLIP embedding extracted successfully (dim=512, L2-normed).")
        return embedding, True, "CLIP semantic embedding extracted successfully (dim=512, L2-normalized)."

    except Exception as exc:
        uncertainty_note = (
            f"FALLBACK TRIGGERED: CLIP inference failed ({exc}). "
            f"semantic_vector is a zero-vector sentinel and is NOT meaningful. "
            f"Vector lineage search was hard-skipped to prevent false matches."
        )
        logger.error(uncertainty_note)
        return ZERO_VECTOR.copy(), False, uncertainty_note


# ---------------------------------------------------------------------------
# Convenience: Extract from image key frame (used in video pipeline)
# ---------------------------------------------------------------------------

def extract_from_frame(bgr_frame: "np.ndarray") -> Tuple[str | None, List[float], bool]:
    """
    Compute pHash and CLIP embedding from a single OpenCV BGR frame.

    Args:
        bgr_frame: NumPy array in BGR format from OpenCV.

    Returns:
        Tuple of (phash_str | None, embedding_vector, embedding_valid).
    """
    try:
        import cv2  # noqa: PLC0415
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)

        buffer = io.BytesIO()
        pil_image.save(buffer, format="JPEG", quality=95)
        frame_bytes = buffer.getvalue()

        phash_str, _ = compute_phash(frame_bytes)
        embedding, valid, _ = extract_clip_embedding(frame_bytes)
        return phash_str, embedding, valid

    except Exception as exc:
        logger.error(f"extract_from_frame failed: {exc}")
        return None, ZERO_VECTOR.copy(), False
