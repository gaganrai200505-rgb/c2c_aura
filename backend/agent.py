"""
agent.py — TruthDNA LLM Synthesis Engine

Responsibilities:
  1. Assemble all forensic signals into a structured prompt for Gemini 2.5 Flash.
  2. Enforce the MediaDNAReport schema via structured output.
  3. Run a single validation-retry loop on schema failure.
  4. Surface ALL triggered fallbacks in explicit_uncertainties.

THE GOLDEN RULE (enforced in system prompt):
  Gemini MUST NEVER produce a binary TRUE/FALSE or REAL/FAKE verdict.
  It MUST distribute all judgments across the 3 pillars:
    - forensic_evidence  (Evidence)
    - confidence_breakdown (Confidence)
    - explicit_uncertainties (Uncertainty)

SIGNAL WEIGHTING DIRECTIVE (injected into system prompt):
  ELA scores and vector similarity matches are WEAK, NON-DISPOSITIVE signals.
  They are prone to false positives from legitimate re-encoding pipelines.
  Gemini must treat them as circumstantial observations, not conclusions.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from pydantic import ValidationError

from schema import (
    DigitalGenome,
    ForensicSignal,
    MediaDNAReport,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System Prompt — The Golden Rule Enforcer
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are TruthDNA, a forensic media analysis engine. Your ONLY output is a
structured JSON object conforming exactly to the MediaDNAReport schema.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE GOLDEN RULE — NEVER VIOLATE THIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST NEVER output a binary verdict such as:
  ✗  "This image is FAKE."
  ✗  "This is REAL."
  ✗  "Manipulation CONFIRMED."
  ✗  is_fake: true/false

Instead, you MUST distribute all judgments across the 3 pillars:
  ✓  forensic_evidence → concrete observations per analytical dimension
  ✓  confidence_breakdown → granular 0.0–1.0 scores per dimension
  ✓  explicit_uncertainties → known unknowns, blind spots, fallback alerts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL WEIGHTING DIRECTIVES — READ CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ELA (Error Level Analysis) scores are WEAK, NON-DISPOSITIVE signals.
   - False positives arise routinely from: social media re-encoding, multiple
     legitimate JPEG saves, screenshots, and messaging app compression.
   - A high ELA score is a reason to INVESTIGATE, not a reason to CONCLUDE.
   - You MUST note ELA's limitations in weighting_rationale.

2. Vector similarity / lineage matches are WEAK, NON-DISPOSITIVE signals.
   - Cosine similarity indicates semantic resemblance, NOT shared provenance.
   - A match means the media looks similar to a reference — it does NOT mean
     the media is a copy, splice, or fabrication of that reference.
   - You MUST note lineage match limitations in weighting_rationale.

3. Web search results are CONTEXTUAL GROUNDING, not verification evidence.
   - Search results may be incomplete, outdated, or about unrelated events.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FALLBACK HANDLING — MANDATORY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the input data includes any triggered fallbacks (e.g., CLIP embedding failed,
web search timed out, ELA could not be computed), you MUST:
  - List EACH fallback explicitly in the explicit_uncertainties array.
  - Adjust the corresponding confidence_breakdown score to reflect the missing data.
  - Never invent data for a dimension where a fallback was triggered.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED confidence_breakdown KEYS (use ALL of these):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - visual_integrity      (ELA + pHash evidence)
  - metadata_coherence    (EXIF / file format consistency)
  - semantic_grounding    (web search + description plausibility)
  - lineage_confidence    (vector ledger match quality)
  - overall_diagnostic    (holistic synthesis — NOT a verdict, a confidence band)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY FIELDS — ALL must be populated:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - weighting_rationale: Minimum 50 characters. Explain WHY each signal is
    weighted as it is. This is chain-of-thought — be specific and honest about
    uncertainty. Do NOT skip this field.
  - explicit_uncertainties: Minimum 1 entry. Always include at least one
    epistemic limitation (e.g., "Audio track not analyzed", "No provenance
    database available for this media type").
  - shareable_context_card: 20–560 characters. Human-readable summary.
    Do NOT use "fake", "real", "true", or "false" as verdict labels.
"""

# ---------------------------------------------------------------------------
# Prompt Builder
# ---------------------------------------------------------------------------

def build_analysis_prompt(
    media_type: str,
    filename: str,
    ela_score: float,
    ela_finding: str,
    phash: Optional[str],
    embedding_valid: bool,
    lineage_match_found: bool,
    lineage_finding: str,
    search_results: Optional[List[Dict[str, Any]]],
    search_failed: bool,
    search_note: str,
    frame_extraction_summary: Optional[str],
    fallback_notes: List[str],
) -> str:
    """
    Assemble the user-turn prompt from all pipeline forensic signals.

    Args:
        media_type: "image" or "video"
        filename: Original uploaded filename.
        ela_score: Normalized ELA anomaly score (0.0 – 1.0).
        ela_finding: Human-readable ELA observation string.
        phash: Perceptual hash hex string or None.
        embedding_valid: Whether CLIP embedding is valid.
        lineage_match_found: Whether vector ledger returned a match.
        lineage_finding: Human-readable lineage observation.
        search_results: List of web search result dicts or None.
        search_failed: Whether web search failed.
        search_note: Human-readable search status note.
        frame_extraction_summary: Video frame extraction summary or None.
        fallback_notes: All triggered fallback messages to inject.

    Returns:
        Fully assembled prompt string.
    """
    search_section = ""
    if search_failed:
        search_section = f"WEB SEARCH STATUS: FAILED — {search_note}"
    elif search_results:
        result_lines = "\n".join(
            f"  [{i+1}] {r.get('title','N/A')} | {r.get('href','N/A')}\n       {r.get('body','')[:200]}"
            for i, r in enumerate(search_results[:5])
        )
        search_section = f"WEB SEARCH RESULTS ({len(search_results)} hits):\n{result_lines}"
    else:
        search_section = "WEB SEARCH STATUS: Completed, no relevant results found."

    fallback_section = ""
    if fallback_notes:
        fallback_list = "\n".join(f"  ⚠ {note}" for note in fallback_notes)
        fallback_section = f"\nTRIGGERED FALLBACKS (MUST appear in explicit_uncertainties):\n{fallback_list}"

    video_section = ""
    if frame_extraction_summary:
        video_section = f"\nVIDEO FRAME EXTRACTION:\n  {frame_extraction_summary}"

    prompt = f"""
FORENSIC ANALYSIS REQUEST
══════════════════════════════════════════════════════════

FILE INFORMATION:
  Filename   : {filename}
  Media Type : {media_type}

━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL 1 — ELA MICRO-FORENSICS
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ELA Anomaly Score : {ela_score:.4f} (range: 0.0=clean → 1.0=high anomaly)
  Finding           : {ela_finding}
  REMINDER: ELA is a WEAK, NON-DISPOSITIVE signal. False positives are common.
{video_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL 2 — DIGITAL DNA FINGERPRINT
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Perceptual Hash (pHash) : {phash or "NOT AVAILABLE (extraction failed)"}
  CLIP Embedding Valid    : {embedding_valid}
  Lineage Match Found     : {lineage_match_found}
  Lineage Finding         : {lineage_finding}
  REMINDER: Vector similarity is a WEAK signal. Match ≠ confirmed shared provenance.

━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL 3 — WEB GROUNDING
━━━━━━━━━━━━━━━━━━━━━━━━━━
{search_section}
{fallback_section}

══════════════════════════════════════════════════════════
INSTRUCTIONS:
  1. Synthesize ALL signals above into a MediaDNAReport JSON.
  2. Apply the signal weighting directives from your system prompt.
  3. Populate ALL mandatory fields (weighting_rationale, explicit_uncertainties, etc.).
  4. List every triggered fallback in explicit_uncertainties.
  5. DO NOT produce a binary verdict anywhere in the output.
══════════════════════════════════════════════════════════
"""
    return prompt.strip()


def build_claim_analysis_prompt(
    claim_text: str,
    search_results: Optional[List[Dict[str, Any]]] = None,
    search_failed: bool = False,
    search_notes: Optional[List[str]] = None,
    media_context: Optional[str] = None,
    fallback_notes: Optional[List[str]] = None,
) -> str:
    """
    Assemble structured prompt for text claims, rumors, and social posts.
    """
    search_section = ""
    if search_failed:
        search_section = "FACT-CHECK GROUNDING: Failed to query external search registries."
    elif search_results:
        result_lines = "\n".join(
            f"  [{i+1}] {r.get('title','N/A')} | {r.get('href','N/A')}\n       {r.get('body','')[:250]}"
            for i, r in enumerate(search_results[:6])
        )
        search_section = f"FACT-CHECKING & SEARCH GROUNDING ({len(search_results)} sources):\n{result_lines}"
    else:
        search_section = "FACT-CHECK GROUNDING: Completed, no prior debunk or verified record found."

    media_section = f"\nATTACHED MEDIA CONTEXT:\n  {media_context}" if media_context else ""

    fallbacks = ""
    all_fallbacks = (fallback_notes or []) + (search_notes or [])
    if all_fallbacks:
        fallback_lines = "\n".join(f"  ⚠ {n}" for n in all_fallbacks if n)
        fallbacks = f"\nTRIGGERED FALLBACKS / SYSTEM NOTES:\n{fallback_lines}"

    prompt = f"""
FAKE INFORMATION & CLAIM VERIFICATION REQUEST
══════════════════════════════════════════════════════════

CLAIM / SOCIAL POST TEXT:
  "{claim_text}"
{media_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL — FACT-CHECK REGISTRIES & WEB EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━
{search_section}
{fallbacks}

══════════════════════════════════════════════════════════
INSTRUCTIONS:
  1. Synthesize the claim against all factual records above into a MediaDNAReport JSON.
  2. Deliver a strictly NON-BINARY 3-Pillar diagnostic (Evidence, Confidence, Uncertainty).
  3. Under confidence_breakdown include:
     - factual_alignment      (coherence with established factual consensus)
     - source_corroboration   (availability of credible reporting)
     - context_integrity      (absence of out-of-context misattribution)
     - consensus_reliability  (strength of reporting agreement)
     - overall_diagnostic     (holistic confidence index)
  4. In explicit_uncertainties list all unverified assumptions, developing news velocity, and lack of primary records.
  5. DO NOT output 'True', 'False', 'Real', or 'Fake' as verdict terms.
══════════════════════════════════════════════════════════
"""
    return prompt.strip()


def build_link_analysis_prompt(
    url: str,
    article_data: Dict[str, Any],
    search_results: Optional[List[Dict[str, Any]]] = None,
    video_forensics_summary: Optional[str] = None,
    fallback_notes: Optional[List[str]] = None,
) -> str:
    """
    Assemble prompt for URL / Reel / Article analysis.
    """
    title = article_data.get("title", "N/A")
    domain = article_data.get("domain", "N/A")
    is_satire = article_data.get("is_satire", False)
    body = article_data.get("body", "")[:1200]
    description = article_data.get("description", "")
    uploader = article_data.get("uploader", "")

    satire_note = f"\n  ⚠ KNOWN SATIRE DOMAIN: {domain} is a registered parody/satire site." if is_satire else ""

    video_sec = f"\nVIDEO STREAM FORENSICS:\n  {video_forensics_summary}" if video_forensics_summary else ""

    search_section = ""
    if search_results:
        result_lines = "\n".join(
            f"  [{i+1}] {r.get('title','N/A')} | {r.get('href','N/A')}\n       {r.get('body','')[:200]}"
            for i, r in enumerate(search_results[:5])
        )
        search_section = f"FACT-CHECKING & SEARCH GROUNDING:\n{result_lines}"
    else:
        search_section = "FACT-CHECK GROUNDING: No external debunk records found."

    fallbacks = ""
    if fallback_notes:
        fallback_lines = "\n".join(f"  ⚠ {n}" for n in fallback_notes)
        fallbacks = f"\nTRIGGERED FALLBACKS:\n{fallback_lines}"

    prompt = f"""
URL & MEDIA LINK VERIFICATION REQUEST
══════════════════════════════════════════════════════════

LINK METADATA:
  URL         : {url}
  Domain      : {domain}{satire_note}
  Title/Header: {title}
  Author/User : {uploader or 'Unknown'}
  Description : {description}

EXTRACTED BODY / CAPTION CONTEXT:
  {body or 'No text body extracted'}
{video_sec}

━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL — FACT-CHECK REGISTRIES & GROUNDING
━━━━━━━━━━━━━━━━━━━━━━━━━━
{search_section}
{fallbacks}

══════════════════════════════════════════════════════════
INSTRUCTIONS:
  1. Evaluate the link and/or video stream against the 3 Non-Binary Pillars.
  2. Under confidence_breakdown include:
     - domain_reputation       (credibility and history of the publishing domain)
     - factual_alignment       (alignment of article/post claims with verified records)
     - headline_consistency    (whether the headline matches or exaggerates the body)
     - visual_context_coherence(if video/reel present, whether visuals match caption)
     - overall_diagnostic      (holistic confidence index)
  3. Explicitly state any satiral origins or paywalled content in explicit_uncertainties.
  4. DO NOT produce a binary TRUE/FALSE verdict.
══════════════════════════════════════════════════════════
"""
    return prompt.strip()


# ---------------------------------------------------------------------------
# Gemini Synthesis Call
# ---------------------------------------------------------------------------

def synthesize_report(
    prompt: str,
    digital_genome_data: Dict[str, Any],
    client,  # google.genai.Client
) -> MediaDNAReport:
    """
    Call Gemini 2.5 Flash with structured output enforcement and a single retry.

    Flow:
      1. Call Gemini with response_mime_type='application/json'.
      2. Inject digital_genome into the parsed report.
      3. Validate with MediaDNAReport.model_validate_json().
      4. If ValidationError: append error to prompt and retry ONCE.
      5. If retry also fails: raise HTTPException(500).

    Args:
        prompt: Fully assembled user-turn forensic analysis prompt.
        digital_genome_data: Dict with phash/vectors to inject into the report.
        client: Initialized google.genai.Client instance.

    Returns:
        Validated MediaDNAReport instance.

    Raises:
        HTTPException(500): If both the initial call and the retry fail validation.
    """
    from google.genai import types  # noqa: PLC0415

    schema_json = json.dumps(MediaDNAReport.model_json_schema(), indent=2)

    messages = [
        {"role": "user", "parts": [{"text": prompt}]},
    ]

    def _call_gemini(turn_messages) -> str:
        system_with_schema = f"{SYSTEM_PROMPT}\n\nStrict JSON Schema:\n{schema_json}"
        models_to_try = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]
        last_err = None
        for m in models_to_try:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=turn_messages,
                    config=types.GenerateContentConfig(
                        system_instruction=system_with_schema,
                        response_mime_type="application/json",
                        temperature=0.2,   # Low temperature for factual forensic output
                        max_output_tokens=4096,
                    ),
                )
                return response.text
            except Exception as e:
                last_err = e
                logger.warning(f"Model {m} failed: {e}. Trying fallback model...")
        raise last_err or RuntimeError("All Gemini models failed.")

    # ── Attempt 1 ────────────────────────────────────────────────────────────
    logger.info("Calling Gemini 2.5 Flash — Attempt 1...")
    try:
        raw_json = _call_gemini(messages)
        logger.debug(f"Gemini raw output (attempt 1): {raw_json[:500]}...")
    except Exception as exc:
        logger.error(f"Gemini API call failed on attempt 1: {exc}")
        raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}")

    try:
        report = MediaDNAReport.model_validate_json(raw_json)
        _inject_digital_genome(report, digital_genome_data)
        logger.info("Attempt 1 succeeded — report validated.")
        return report
    except (ValidationError, Exception) as val_err:
        logger.warning(f"Attempt 1 validation failed: {val_err}")

    # ── Attempt 2 (single retry with error context) ───────────────────────
    logger.info("Calling Gemini 2.5 Flash — Attempt 2 (retry with error feedback)...")

    retry_messages = messages + [
        {"role": "model", "parts": [{"text": raw_json}]},
        {
            "role": "user",
            "parts": [
                {
                    "text": (
                        f"Your previous response failed Pydantic validation with this error:\n\n"
                        f"{val_err}\n\n"
                        f"Please regenerate the response strictly conforming to this JSON schema:\n\n"
                        f"{schema_json}\n\n"
                        f"Common fixes:\n"
                        f"  - forensic_evidence must contain at least 1 item.\n"
                        f"  - explicit_uncertainties must contain at least 1 item.\n"
                        f"  - weighting_rationale must be at least 50 characters.\n"
                        f"  - confidence_breakdown must have multiple keys (not just 'overall').\n"
                        f"  - Status must be exactly 'Clean', 'Suspicious', or 'Altered'.\n"
                        f"Return ONLY the corrected JSON object, no extra text."
                    )
                }
            ],
        },
    ]

    try:
        raw_json_2 = _call_gemini(retry_messages)
        logger.debug(f"Gemini raw output (attempt 2): {raw_json_2[:500]}...")
    except Exception as exc:
        logger.error(f"Gemini API call failed on attempt 2: {exc}")
        raise HTTPException(status_code=502, detail=f"Gemini API error on retry: {exc}")

    try:
        report = MediaDNAReport.model_validate_json(raw_json_2)
        _inject_digital_genome(report, digital_genome_data)
        logger.info("Attempt 2 succeeded — report validated.")
        return report
    except (ValidationError, Exception) as final_err:
        logger.error(f"Attempt 2 also failed validation: {final_err}")
        raise HTTPException(
            status_code=500,
            detail=(
                f"LLM synthesis failed validation after 2 attempts. "
                f"Final error: {final_err}. "
                f"This is a known LLM schema compliance issue — please retry the request."
            ),
        )


# ---------------------------------------------------------------------------
# Helper: Inject Digital Genome into Report
# ---------------------------------------------------------------------------

def _inject_digital_genome(report: MediaDNAReport, data: Dict[str, Any]) -> None:
    """
    Overwrite the digital_genome field with the actual computed values
    from the pipeline (pHash, vectors). Gemini may hallucinate these values,
    so we always replace them with the real pipeline outputs.
    """
    report.digital_genome = DigitalGenome(
        visual_phash=data.get("visual_phash"),
        semantic_vector=data.get("semantic_vector"),
        acoustic_vector=data.get("acoustic_vector"),
    )
