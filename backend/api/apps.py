import logging
from django.apps import AppConfig

logger = logging.getLogger("truthdna.api")


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        """Auto-seed Qdrant ledger on Django startup."""
        try:
            from seed_ledger import seed as seed_ledger
            from ledger import get_collection_info
            logger.info("Running startup ledger seeding (Django)...")
            count = seed_ledger()
            info = get_collection_info()
            logger.info(f"Django startup ledger seeded: {count} records. Collection info: {info}")
        except Exception as exc:
            logger.error(f"Django startup ledger seeding note: {exc}")
