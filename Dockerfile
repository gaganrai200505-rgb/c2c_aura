# ==============================================================================
# Stage 1: Build the Vite React Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY vite-frontend/package*.json ./
RUN npm ci

COPY vite-frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Production Python Django Backend
# ==============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (OpenCV, FFmpeg requirements)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy compiled frontend assets to staticfiles
COPY --from=frontend-builder /app/frontend/dist /app/backend/staticfiles/

WORKDIR /app/backend

# Run Django migrations and collectstatic
RUN python manage.py makemigrations --noinput && \
    python manage.py migrate --noinput

EXPOSE 8000

CMD ["gunicorn", "truthdna_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
