from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView
from api.api import api, router as admin_api_router

# Attach Ninja Admin telemetry routes under /api/admin
api.add_router("/api/admin", admin_api_router)

urlpatterns = [
    path("", RedirectView.as_view(url="/admin/", permanent=False)),  # Direct redirect to Django Admin
    path("admin/", admin.site.urls),  # Built-in Django Admin Interface
    path("", api.urls),               # Ninja API (/health, /api/analyze, /api/docs, etc.)
]

