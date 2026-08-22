"""
link_analyzer.py — TruthDNA Social Video & Web Link Analysis Module

Responsibilities:
  1. Detect if a URL belongs to a social video platform (Instagram Reels, Facebook,
     YouTube Shorts/Videos, TikTok, X/Twitter).
  2. Stream & extract video keyframes (capped at 15s) + post caption/metadata via yt-dlp.
  3. Scrape web articles & OpenGraph metadata for standard web links (headline, author,
     body, domain classification, satire detection).
  4. Strict fallback contracts — errors return structured fallbacks without crashing.
"""

from __future__ import annotations

import logging
import os
import re
import tempfile
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Known satire & parody domains for credibility checks
KNOWN_SATIRE_DOMAINS = {
    "theonion.com",
    "babylonbee.com",
    "fakingnews.com",
    "clickhole.com",
    "thepoke.co.uk",
    "waterfordwhispersnews.com",
    "satirewire.com",
    "reductress.com",
    "thebeaverton.com",
}

# Known social video domain patterns
SOCIAL_VIDEO_PATTERNS = [
    r"instagram\.com/(?:reel|p|tv)/",
    r"facebook\.com/(?:reel|watch|.*videos)",
    r"fb\.watch/",
    r"youtube\.com/(?:watch\?v=|shorts/)",
    r"youtu\.be/",
    r"tiktok\.com/@[\w\.-]+/video/\d+",
    r"twitter\.com/\w+/status/\d+",
    r"x\.com/\w+/status/\d+",
]


def is_social_video_url(url: str) -> bool:
    """Return True if the URL points to a supported social video/reel platform."""
    if not url or not isinstance(url, str):
        return False
    clean_url = url.strip()
    return any(re.search(pat, clean_url, re.IGNORECASE) for pat in SOCIAL_VIDEO_PATTERNS)


def _get_ffmpeg_path() -> Optional[str]:
    """Find a usable ffmpeg executable from imageio_ffmpeg, static_ffmpeg, or PATH."""
    try:
        import imageio_ffmpeg  # noqa: PLC0415
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    import shutil
    return shutil.which("ffmpeg")


def extract_social_video_and_metadata(
    url: str,
    max_duration_seconds: int = 15,
) -> Tuple[Optional[str], Dict[str, Any], bool, str]:
    """
    Download a brief segment (max 15s) of a social video/reel using yt-dlp.
    If video stream download is blocked, automatically scrapes post metadata.

    Returns:
        (temp_video_path, metadata_dict, is_fallback, status_note)
    """
    try:
        import yt_dlp  # noqa: PLC0415
    except ImportError:
        # Fallback to web scraping if yt-dlp is missing
        content, fb, note = extract_article_content(url)
        return None, content, True, f"FALLBACK: yt-dlp missing. {note}"

    temp_dir = tempfile.mkdtemp(prefix="truthdna_reel_")
    out_tmpl = os.path.join(temp_dir, "video.%(ext)s")

    ffmpeg_path = _get_ffmpeg_path()

    ydl_opts: Dict[str, Any] = {
        "outtmpl": out_tmpl,
        "format": "best[ext=mp4]/best",
        "quiet": True,
        "no_warnings": True,
        "max_filesize": 25 * 1024 * 1024,  # Max 25 MB stream
        "socket_timeout": 12,
        "download_ranges": lambda info_dict, ydl: [{"start_time": 0, "end_time": max_duration_seconds}],
    }

    if ffmpeg_path:
        ydl_opts["ffmpeg_location"] = ffmpeg_path

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if not info:
                # Fallback to OpenGraph scraper
                content, _, note = extract_article_content(url)
                return None, content, True, f"FALLBACK: yt-dlp extracted no info. {note}"

            title = str(info.get("title") or "")
            description = str(info.get("description") or "")
            uploader = str(info.get("uploader") or info.get("channel") or "")
            upload_date = str(info.get("upload_date") or "")
            duration = info.get("duration")

            # Locate downloaded video file in temp_dir
            downloaded_files = [
                os.path.join(temp_dir, f)
                for f in os.listdir(temp_dir)
                if f.endswith((".mp4", ".mkv", ".webm", ".mov"))
            ]

            video_path = downloaded_files[0] if downloaded_files else None

            meta = {
                "title": title,
                "description": description[:1200],
                "uploader": uploader,
                "upload_date": upload_date,
                "duration": duration,
                "url": url,
            }

            if not video_path:
                # If video wasn't downloaded, check if OpenGraph has better caption
                og_content, _, _ = extract_article_content(url)
                if og_content.get("description") and len(og_content["description"]) > len(description):
                    meta["description"] = og_content["description"]
                note = f"Extracted post caption for '{title or uploader}', but video stream required authentication or was restricted."
                return None, meta, True, note

            note = f"Successfully streamed social video: '{title[:60]}' ({duration or 15}s) from {uploader}."
            logger.info(note)
            return video_path, meta, False, note

    except Exception as exc:
        # Graceful fallback to OpenGraph web extraction
        logger.warning(f"yt-dlp stream extraction error: {exc}. Falling back to OpenGraph scraper...")
        og_content, _, og_note = extract_article_content(url)
        error_msg = f"FALLBACK: Social video stream unavailable ({type(exc).__name__}). Extracted metadata: {og_note}"
        return None, og_content, True, error_msg


def extract_article_content(url: str) -> Tuple[Dict[str, Any], bool, str]:
    """
    Fetch web page / article content, extracting OpenGraph metadata, headline,
    body text, and domain reputation.

    Returns:
        (content_dict, is_fallback, status_note)
    """
    import urllib.request

    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc.lower().replace("www.", "")
    is_known_satire = domain in KNOWN_SATIRE_DOMAINS

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            html = response.read().decode("utf-8", errors="replace")

        try:
            from bs4 import BeautifulSoup  # noqa: PLC0415
            soup = BeautifulSoup(html, "html.parser")

            title = ""
            if soup.title and soup.title.string:
                title = soup.title.string.strip()

            # OpenGraph metadata
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                title = og_title["content"].strip()

            og_desc = soup.find("meta", property="og:description")
            description = og_desc["content"].strip() if (og_desc and og_desc.get("content")) else ""

            # Extract main body paragraphs
            paragraphs = [p.get_text().strip() for p in soup.find_all("p") if len(p.get_text().strip()) > 30]
            body_text = " ".join(paragraphs[:8])[:2500]

            res = {
                "url": url,
                "domain": domain,
                "is_satire": is_known_satire,
                "title": title,
                "description": description,
                "body": body_text or description,
            }

            note = f"Extracted article from {domain}. Known satire domain: {is_known_satire}."
            return res, False, note

        except ImportError:
            # Fallback regex if BeautifulSoup not present
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else url
            return {
                "url": url,
                "domain": domain,
                "is_satire": is_known_satire,
                "title": title,
                "description": "",
                "body": html[:1000],
            }, False, f"Extracted basic title from {domain}."

    except Exception as exc:
        note = f"FALLBACK: Unable to fetch web link content ({type(exc).__name__}: {str(exc)[:120]})."
        logger.warning(note)
        return {
            "url": url,
            "domain": domain,
            "is_satire": is_known_satire,
            "title": url,
            "description": "",
            "body": "",
        }, True, note
