from django.contrib import admin
from .models import AnalysisLog, LedgerRecord

@admin.register(AnalysisLog)
class AnalysisLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "filename",
        "media_type",
        "ela_score",
        "lineage_match",
        "embedding_valid",
        "search_failed",
        "duration_sec",
        "created_at",
    )
    list_filter = ("media_type", "lineage_match", "embedding_valid", "search_failed")
    search_fields = ("filename",)
    readonly_fields = ("created_at",)


@admin.register(LedgerRecord)
class LedgerRecordAdmin(admin.ModelAdmin):
    list_display = ("event_id", "media_type", "region", "capture_date", "created_at")
    search_fields = ("event_id", "description", "region", "tags")
    list_filter = ("media_type", "region")
    readonly_fields = ("created_at",)
