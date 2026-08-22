from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Seed or reset default admin superuser (admin / adminpassword)"

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(username="admin", defaults={"email": "admin@truthdna.local"})
        user.set_password("adminpassword")
        user.is_staff = True
        user.is_superuser = True
        user.save()
        if created:
            self.stdout.write(self.style.SUCCESS("[OK] Created default superuser: admin / adminpassword"))
        else:
            self.stdout.write(self.style.SUCCESS("[OK] Reset password for superuser: admin / adminpassword"))
