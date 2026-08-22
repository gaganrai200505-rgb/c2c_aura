"""
schema.py — TruthDNA Immovable Data Contracts

This file defines the Pydantic V2 models that act as the strict API
contract between the backend forensic pipeline and the LLM synthesis layer.

THE GOLDEN RULE: No model here may ever produce a binary TRUE/FALSE verdict.
All outputs MUST encode Evidence, Confidence, and Uncertainty.
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Tier 1: Atomic Forensic Signal
# ---------------------------------------------------------------------------

class ForensicSignal(BaseModel):
    """
    Represents a single forensic observation on one analytical dimension.

    A signal is NEVER a verdict — it is a raw observation with a categorical
    status, a natural-language finding, and optional provenance metadata.
    """

    dimension: str = Field(
        ...,
        description=(
            "The analytical dimension being reported, e.g. 'ELA Compression Anomaly', "
            "'Perceptual Hash Lineage', 'Metadata Consistency', 'Semantic Grounding'."
        ),
        examples=["ELA Compression Anomaly", "Perceptual Hash Lineage", "EXIF Timestamp"],
    )

    status: Literal["Clean", "Suspicious", "Altered"] = Field(
        ...,
        description=(
            "Categorical signal status. 'Clean' = signal within expected bounds. "
            "'Suspicious' = signal deviates but alternative explanations exist. "
            "'Altered' = strong evidence of deliberate manipulation on this dimension."
        ),
    )

    finding: str = Field(
        ...,
        description=(
            "A concrete, evidence-backed natural-language statement describing WHAT was "
            "observed. Must NOT be a verdict. E.g.: 'ELA residual variance of 0.73 detected "
            "in upper-left quadrant, consistent with JPEG re-compression at quality < 60.'"
        ),
        min_length=10,
    )

    source_url: Optional[str] = Field(
        default=None,
        description="Optional URL of a reverse-search result or archived source that informed this signal.",
    )

    media_timestamp: Optional[str] = Field(
        default=None,
        description=(
            "Optional timestamp within the media (e.g., '00:03:12') to which this signal applies. "
            "Null for whole-image signals."
        ),
    )


# ---------------------------------------------------------------------------
# Tier 2: Digital Genome — Cryptographic & Semantic Fingerprint
# ---------------------------------------------------------------------------

class DigitalGenome(BaseModel):
    """
    The multi-modal fingerprint of the analyzed media.

    All fields are optional to handle missing modalities gracefully.
    A missing field MUST be treated as 'unavailable', not as 'clean'.
    """

    visual_phash: str | None = Field(
        default=None,
        description=(
            "Perceptual hash (pHash) of the key frame or image. "
            "Used for near-duplicate lineage matching. Null if extraction failed."
        ),
        examples=["a1b2c3d4e5f6a7b8"],
    )

    semantic_vector: List[float] | None = Field(
        default=None,
        description=(
            "512-dimensional CLIP semantic embedding vector. "
            "Null if CLIP model load failed (embedding_valid=False). "
            "A zero-vector is stored internally but MUST NOT be passed to the LLM as meaningful."
        ),
    )

    acoustic_vector: List[float] | None = Field(
        default=None,
        description=(
            "Acoustic embedding vector for video/audio content. "
            "Null for image-only inputs or if audio extraction failed."
        ),
    )


# ---------------------------------------------------------------------------
# Tier 3: Master Diagnostic Report — The Golden Rule Enforcer
# ---------------------------------------------------------------------------

class MediaDNAReport(BaseModel):
    """
    The master TruthDNA diagnostic report returned by the API.

    CRITICAL CONTRACT:
    - This model MUST NEVER contain a 'verdict', 'is_fake', 'is_real', or
      'is_manipulated' boolean field.
    - All judgments are distributed across forensic_evidence, confidence_breakdown,
      and explicit_uncertainties.
    - The LLM MUST fill weighting_rationale before any score is accepted.
    """

    digital_genome: DigitalGenome = Field(
        ...,
        description="The multi-modal cryptographic and semantic fingerprint of the analyzed media.",
    )

    lineage_match_found: bool = Field(
        ...,
        description=(
            "True if a vector similarity match was found in the historical ledger "
            "above the configured threshold. False if no match or if embedding was invalid "
            "(in which case the LLM must note this in explicit_uncertainties)."
        ),
    )

    forensic_evidence: List[ForensicSignal] = Field(
        ...,
        description=(
            "An ordered list of forensic signals, one per analytical dimension. "
            "Must contain at least one entry. Each signal is a concrete observation, NOT a verdict."
        ),
        min_length=1,
    )

    weighting_rationale: str = Field(
        ...,
        description=(
            "MANDATORY chain-of-thought field. The LLM MUST articulate HERE, in natural language, "
            "WHY each forensic signal is weighted as it is, acknowledging the known limitations "
            "of ELA scores and vector matches as weak, non-dispositive signals. "
            "This field prevents silent score fabrication."
        ),
        min_length=50,
    )

    confidence_breakdown: Dict[str, float] = Field(
        ...,
        description=(
            "A dictionary of named confidence dimensions, each scored 0.0 to 1.0. "
            "Keys should include (but are not limited to): 'visual_integrity', "
            "'metadata_coherence', 'semantic_grounding', 'lineage_confidence'. "
            "NO single 'overall' score is permitted as the sole entry."
        ),
        examples=[
            {
                "visual_integrity": 0.42,
                "metadata_coherence": 0.85,
                "semantic_grounding": 0.60,
                "lineage_confidence": 0.30,
            }
        ],
    )

    explicit_uncertainties: List[str] = Field(
        ...,
        description=(
            "MANDATORY list of known unknowns, blind spots, and triggered fallbacks. "
            "Must include at least one entry. The LLM MUST list: "
            "(a) Any fallbacks triggered (e.g., 'CLIP embedding failed — semantic_vector is null'), "
            "(b) Any analytical dimensions not evaluated (e.g., 'Audio track not analyzed'), "
            "(c) Any reasons a signal may be a false positive."
        ),
        min_length=1,
    )

    shareable_context_card: str = Field(
        ...,
        description=(
            "A compact, human-readable summary card (max ~280 characters) suitable for sharing. "
            "Must describe WHAT was found and WHAT remains uncertain. "
            "Must NOT use the words 'fake', 'real', 'true', or 'false' as verdict terms."
        ),
        min_length=20,
        max_length=560,
    )
