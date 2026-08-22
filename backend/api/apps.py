import logging
from django.apps import AppConfig

logger = logging.getLogger("truthdna.api")

class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        """Auto-seed Qdrant ledger and ensure default superuser on Django startup."""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(username="admin").exists():
                User.objects.create_superuser("admin", "admin@truthdna.local", "adminpassword")
                logger.info("✓ Default admin superuser created (admin / adminpassword)")
        except Exception as exc:
            logger.debug(f"Superuser check note: {exc}")

        try:
            from seed_ledger import seed as seed_ledger
            from ledger import get_collection_info
            logger.info("Running startup ledger seeding (Django)...")
            count = seed_ledger()
            info = get_collection_info()
            logger.info(f"✓ Django startup ledger seeded: {count} records. Collection info: {info}")
        except Exception as exc:
            logger.error(f"Django startup ledger seeding note: {exc}")

