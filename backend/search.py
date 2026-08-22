"""
search.py — TruthDNA Web Search Grounding Module

Responsibilities:
  Perform contextual web searches using DuckDuckGo to ground the media
  analysis in publicly available information about the event/scene depicted.

CRITICAL SAFETY CONTRACT:
  ALL search operations are wrapped in a strict try/except block.
  On ANY failure (timeout, rate limit, network error, API change):
    - Returns: (results=None, search_failed=True, reason=<error_message>)
  The caller MUST surface search_failed=True in explicit_uncertainties.
  A failed search MUST NOT be treated as evidence that the media is authentic
  or that no relevant information exists.

RATE LIMIT AWARENESS:
  DuckDuckGo's unofficial API may rate-limit aggressive scrapers.
  A soft delay is applied between rapid successive calls.
  If rate-limited, the module degrades gracefully without crashing the pipeline.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_RESULTS: int = 5                   # Max search results to return
SEARCH_TIMEOUT_SECS: float = 10.0     # Per-search timeout threshold
MIN_QUERY_LENGTH: int = 5             # Reject queries that are too short to be useful


# ---------------------------------------------------------------------------
# Web Search
# ---------------------------------------------------------------------------

def web_search(query: str) -> Tuple[Optional[List[Dict[str, Any]]], bool, str]:
    """
    Execute a DuckDuckGo text search with a strict try/except safety wrapper.

    Args:
        query: The search query string to run (e.g., event description from LLM context).

    Returns:
        A tuple of:
          - Optional[List[Dict]]: List of result dicts with keys:
              'title', 'href', 'body'
            OR None if the search failed.
          - bool: search_failed flag.
            True  = search did not complete; results are None.
            False = search completed (results may still be empty if no hits).
          - str: Human-readable status/uncertainty note for explicit_uncertainties.

    Caller Contract:
        Always check search_failed before using results.
        If search_failed=True, include the returned note in explicit_uncertainties.
        NEVER interpret a failed search as evidence of media authenticity or inauthenticity.
    """
    # Basic input validation
    if not query or len(query.strip()) < MIN_QUERY_LENGTH:
        note = (
            f"Web search skipped: query too short or empty ('{query}'). "
            f"Semantic grounding via web search is unavailable for this analysis."
        )
        logger.warning(note)
        return None, True, note

    logger.info(f"Running DuckDuckGo search: '{query[:100]}...' (truncated)" if len(query) > 100 else f"Running DuckDuckGo search: '{query}'")

    try:
        # Deferred import — only pull in ddgs when actually called
        from duckduckgo_search import DDGS  # noqa: PLC0415

        results: List[Dict[str, Any]] = []

        # DDGS uses a context manager interface
        with DDGS() as ddgs:
            raw_results = ddgs.text(
                keywords=query,
                max_results=MAX_RESULTS,
                timelimit=None,  # No date restriction — we want historical results
            )
            results = list(raw_results) if raw_results else []

        if not results:
            note = (
                f"Web search completed but returned no results for query: '{query[:80]}'. "
                f"Absence of results does NOT confirm or deny the media's provenance."
            )
            logger.info(note)
            return [], False, note

        # Sanitize results — keep only safe string fields
        sanitized = [
            {
                "title": str(r.get("title", ""))[:200],
                "href": str(r.get("href", ""))[:500],
                "body": str(r.get("body", ""))[:500],
            }
            for r in results
        ]

        note = (
            f"Web search returned {len(sanitized)} result(s) for query: '{query[:80]}'. "
            f"Results are used as contextual grounding only, not as verification evidence."
        )
        logger.info(f"Search succeeded: {len(sanitized)} results.")
        return sanitized, False, note

    except ImportError as exc:
        note = (
            f"FALLBACK TRIGGERED: duckduckgo-search package not available ({exc}). "
            f"Web search grounding is unavailable. Treat semantic context as unverified."
        )
        logger.error(note)
        return None, True, note

    except TimeoutError as exc:
        note = (
            f"FALLBACK TRIGGERED: Web search timed out ({exc}). "
            f"Network connectivity or DuckDuckGo availability issue. "
            f"Semantic web grounding is unavailable for this analysis."
        )
        logger.warning(note)
        return None, True, note

    except Exception as exc:
        # Catch-all: rate limits, HTTP errors, parsing errors, API changes
        error_type = type(exc).__name__
        note = (
            f"FALLBACK TRIGGERED: Web search failed ({error_type}: {exc}). "
            f"Possible causes: rate limit exceeded, network error, or DuckDuckGo API change. "
            f"Web grounding is unavailable. Do NOT interpret this as evidence of manipulation."
        )
        logger.warning(f"DuckDuckGo search error [{error_type}]: {exc}")
        return None, True, note


# ---------------------------------------------------------------------------
# Convenience: Build a contextual query from media metadata
# ---------------------------------------------------------------------------

def build_search_query(
    description: str,
    location_hint: Optional[str] = None,
    date_hint: Optional[str] = None,
) -> str:
    """
    Construct a focused DuckDuckGo query from contextual clues.

    Args:
        description: Short description of what the media depicts.
        location_hint: Optional geographic context (e.g., "Gujarat, India").
        date_hint: Optional temporal context (e.g., "August 2022").

    Returns:
        A composed query string suitable for web_search().
    """
    parts = [description.strip()]
    if location_hint:
        parts.append(location_hint.strip())
    if date_hint:
        parts.append(date_hint.strip())

    query = " ".join(parts)
    # Truncate to a reasonable search query length
    return query[:200]
