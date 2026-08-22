"""
claim_verifier.py — TruthDNA Fake Information & Fact-Checking Engine

Responsibilities:
  1. Parse text claims, viral headlines, and social media posts.
  2. Generate targeted fact-checking search queries (Snopes, Reuters Fact Check,
     AP News, PolitiFact, AltNews, BBC Reality Check).
  3. Aggregate search grounding evidence from multiple angles.
  4. Perform cross-modal discrepancy checks when media/screenshots are attached.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from search import web_search

logger = logging.getLogger(__name__)

# Known fact checking sources prioritized in search synthesis
FACT_CHECK_DOMAINS = [
    "snopes.com",
    "reuters.com/fact-check",
    "apnews.com/hub/ap-fact-check",
    "politifact.com",
    "altnews.in",
    "factcheck.org",
    "bbc.com/news/reality_check",
]


def generate_fact_check_queries(claim_text: str) -> List[str]:
    """
    Generate multiple targeted search queries from a user claim.
    """
    clean = re.sub(r"\s+", " ", claim_text).strip()
    # Truncate to reasonable query length
    short_claim = clean[:120]

    queries = [
        f"{short_claim} fact check",
        f"{short_claim} debunk verified",
        f"{short_claim} Reuters Snopes AP",
    ]
    return queries


def verify_claim_grounding(claim_text: str) -> Tuple[List[Dict[str, Any]], bool, List[str]]:
    """
    Perform multi-query web search grounding across fact-checking resources.

    Returns:
        (aggregated_results, all_searches_failed, notes)
    """
    queries = generate_fact_check_queries(claim_text)
    aggregated_results: List[Dict[str, Any]] = []
    seen_hrefs = set()
    notes: List[str] = []
    failures = 0

    for q in queries:
        results, failed, note = web_search(q)
        notes.append(note)
        if failed:
            failures += 1
        elif results:
            for r in results:
                href = r.get("href", "")
                if href and href not in seen_hrefs:
                    seen_hrefs.add(href)
                    aggregated_results.append(r)

    all_failed = (failures == len(queries))
    return aggregated_results[:8], all_failed, notes
