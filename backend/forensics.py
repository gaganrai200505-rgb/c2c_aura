"""
forensics.py — TruthDNA Micro-Forensics Engine

Responsibilities:
  1. Extract frames from video (hard-capped at 15 seconds / 1 fps).
  2. Run Error Level Analysis (ELA) on images/frames to detect
     re-compression anomalies and return a normalized anomaly score.

CRITICAL PERFORMANCE CAP:
  Frame extraction is LIMITED to the first 15 seconds at 1 fps = max 15 frames.
  This prevents demo timeouts regardless of video length.

SIGNAL INTERPRETATION WARNING:
  ELA scores are weak, non-dispositive signals prone to false positives.
  High ELA scores MAY indicate manipulation but can also arise from:
    - Multiple legitimate JPEG saves
    - Social media re-encoding pipelines
    - Screenshot artifacts
  These caveats MUST be surfaced in explicit_uncertainties by the LLM.
"""

from __future__ import annotations

import io
import logging
import os
import tempfile
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_VIDEO_SECONDS: int = 15          # Hard cap on video analysis duration
FRAMES_PER_SECOND: int = 1          # Extraction rate (1 fps = max 15 frames)
ELA_QUALITY: int = 75               # JPEG re-save quality for ELA
ELA_ENHANCE_FACTOR: float = 10.0    # Amplification factor for residual visibility


# ---------------------------------------------------------------------------
# Frame Extraction
# ---------------------------------------------------------------------------

def extract_frames(video_path: str) -> Tuple[List[np.ndarray], str]:
    """
    Extract frames from a video file at 1 fps, capped at MAX_VIDEO_SECONDS.

    Args:
        video_path: Absolute path to the video file.

    Returns:
        A tuple of:
          - List[np.ndarray]: Extracted frames in BGR format (OpenCV native).
          - str: Human-readable extraction summary for the forensic report.

    Raises:
        ValueError: If the video file cannot be opened.
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    try:
        native_fps: float = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames: int = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration_sec: float = total_frames / native_fps

        # Enforce the hard cap: analyze at most MAX_VIDEO_SECONDS
        analysis_duration_sec: float = min(video_duration_sec, MAX_VIDEO_SECONDS)
        frame_interval: int = max(1, int(native_fps / FRAMES_PER_SECOND))

        frames: List[np.ndarray] = []
        frame_index: int = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            current_time_sec: float = frame_index / native_fps

            # Stop after the capped duration
            if current_time_sec > analysis_duration_sec:
                break

            # Sample at the target fps rate
            if frame_index % frame_interval == 0:
                frames.append(frame)

            frame_index += 1

        summary = (
            f"Extracted {len(frames)} frame(s) from {analysis_duration_sec:.1f}s "
            f"(of {video_duration_sec:.1f}s total) at {FRAMES_PER_SECOND} fps. "
            f"Hard cap applied: {analysis_duration_sec < video_duration_sec}."
        )
        logger.info(summary)
        return frames, summary

    finally:
        cap.release()


# ---------------------------------------------------------------------------
# Error Level Analysis (ELA)
# ---------------------------------------------------------------------------

def run_ela_on_image(image: Image.Image) -> Tuple[float, Image.Image]:
    """
    Perform Error Level Analysis on a PIL Image.

    Technique:
      1. Re-save the image at a fixed JPEG quality (ELA_QUALITY).
      2. Compute the per-pixel absolute difference between original and re-saved.
      3. Normalize the difference to produce an anomaly score (0.0 – 1.0).

    Args:
        image: A PIL Image (RGB or RGBA).

    Returns:
        A tuple of:
          - float: Normalized anomaly score (0.0 = no anomaly, 1.0 = maximum deviation).
          - Image.Image: Amplified ELA residual image (for visual inspection).

    Signal Interpretation:
        Scores above 0.6 are flagged as Suspicious.
        Scores above 0.8 are flagged as Altered.
        LOW scores do NOT confirm authenticity.
    """
    # Convert to RGB (required for JPEG save)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Re-save at fixed quality to expose compression residuals
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=ELA_QUALITY)
    buffer.seek(0)
    resaved = Image.open(buffer)

    # Pixel-wise difference
    diff = ImageChops.difference(image, resaved)

    # Amplify the residual for human inspection
    enhancer = ImageEnhance.Brightness(diff)
    ela_visual = enhancer.enhance(ELA_ENHANCE_FACTOR)

    # Normalize to 0.0 – 1.0 anomaly score
    diff_array = np.array(diff, dtype=np.float32)
    max_possible = 255.0 * 3.0  # Max sum of R+G+B per pixel
    per_pixel_deviation = diff_array.sum(axis=2)  # Sum channels per pixel
    anomaly_score: float = float(per_pixel_deviation.mean() / max_possible)

    # Clamp to [0.0, 1.0]
    anomaly_score = max(0.0, min(1.0, anomaly_score))

    logger.info(f"ELA anomaly score: {anomaly_score:.4f}")
    return anomaly_score, ela_visual


def compute_ela_score_for_image_file(image_bytes: bytes) -> Tuple[float, str]:
    """
    High-level ELA entry point for a raw image bytestream.

    Args:
        image_bytes: Raw bytes of the uploaded image/frame.

    Returns:
        A tuple of:
          - float: Normalized anomaly score (0.0 – 1.0).
          - str: Human-readable forensic finding for the ForensicSignal.finding field.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        score, _ = run_ela_on_image(image)

        if score >= 0.8:
            status_note = "exceeds high-anomaly threshold (≥0.8). Pattern consistent with JPEG re-compression or region splicing."
        elif score >= 0.6:
            status_note = "exceeds moderate-anomaly threshold (≥0.6). Could indicate re-saving or social media re-encoding."
        else:
            status_note = "within expected bounds for authentic, single-save JPEG content."

        finding = (
            f"ELA residual mean deviation score: {score:.4f}. "
            f"Score {status_note} "
            f"NOTE: ELA is a weak signal; false positives are common in re-shared media."
        )
        return score, finding

    except Exception as exc:
        logger.exception(f"ELA failed on image bytes: {exc}")
        return 0.0, f"ELA could not be computed (error: {exc}). Score defaulted to 0.0; treat as uninformative."


def compute_ela_score_for_video_frames(frames: List[np.ndarray]) -> Tuple[float, str]:
    """
    Run ELA across all extracted video frames and return the aggregated score.

    The final score is the mean of per-frame ELA scores.
    If no frames exist, returns 0.0 with an uncertainty note.

    Args:
        frames: List of BGR numpy arrays from extract_frames().

    Returns:
        A tuple of:
          - float: Mean ELA anomaly score across all frames (0.0 – 1.0).
          - str: Forensic finding string.
    """
    if not frames:
        return 0.0, "No frames extracted; ELA could not be performed. Score is uninformative."

    scores: List[float] = []
    for idx, bgr_frame in enumerate(frames):
        try:
            # Convert BGR (OpenCV) → RGB (PIL)
            rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
            pil_frame = Image.fromarray(rgb_frame)
            score, _ = run_ela_on_image(pil_frame)
            scores.append(score)
        except Exception as exc:
            logger.warning(f"ELA failed on frame {idx}: {exc}")
            continue

    if not scores:
        return 0.0, "ELA failed on all extracted frames. Score is uninformative."

    mean_score = float(np.mean(scores))
    max_score = float(np.max(scores))

    finding = (
        f"Video ELA: mean anomaly score across {len(scores)} frame(s) = {mean_score:.4f}. "
        f"Peak frame score = {max_score:.4f}. "
        f"NOTE: Video re-encoding pipelines routinely produce ELA scores ≥0.4; "
        f"interpret with caution."
    )
    return mean_score, finding
