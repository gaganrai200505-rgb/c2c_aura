from django.db import models

class AnalysisLog(models.Model):
    """Stores every media analysis run in persistent database storage."""
    filename = models.CharField(max_length=255)
    media_type = models.CharField(max_length=50, choices=[("image", "Image"), ("video", "Video")])
    ela_score = models.FloatField(help_text="Error Level Analysis residual score (0.0 - 1.0)")
    lineage_match = models.BooleanField(default=False, help_text="True if matching visual vector in Qdrant ledger")
    embedding_valid = models.BooleanField(default=True, help_text="False if zero-vector sentinel fallback triggered")
    search_failed = models.BooleanField(default=False, help_text="True if DuckDuckGo search failed or timed out")
    duration_sec = models.FloatField(help_text="Analysis runtime in seconds")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Analysis Audit Log"
        verbose_name_plural = "Analysis Audit Logs"

    def __str__(self):
        return f"{self.filename} ({self.media_type}) — ELA: {self.ela_score:.4f}"


class LedgerRecord(models.Model):
    """Persistent database cache of vector ledger reference records."""
    event_id = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    source_url = models.URLField(blank=True, null=True)
    capture_date = models.CharField(max_length=50, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    media_type = models.CharField(max_length=50, default="image")
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Ledger Reference Record"
        verbose_name_plural = "Ledger Reference Records"

    def __str__(self):
        return f"[{self.event_id}] {self.description[:50]}"
