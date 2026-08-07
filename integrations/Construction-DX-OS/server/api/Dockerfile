# cdx-server Dockerfile
# Multi-stage build: builder installs deps, runtime is a slim image.
#
# OCR support (GMSV0002 serial-scan pipeline):
#   Pass --build-arg INSTALL_OCR=true to include easyocr + pillow-heif.
#   easyocr pulls PyTorch (~500MB extra); omit for lightweight deployments.
#   pillow-heif uses pre-built manylinux wheels (libheif bundled, no apt needed).
#
#   docker build --build-arg INSTALL_OCR=true -t cdx-server:latest .
#   docker build -t cdx-server:lite .

ARG PYTHON_VERSION=3.11
ARG INSTALL_OCR=false

# --------------------------------------------------------------------------
# Stage 1: builder — install dependencies into a venv
# --------------------------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim AS builder

ARG INSTALL_OCR

WORKDIR /build

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy package metadata first for layer caching
COPY pyproject.toml .
COPY cdx_server/__version__.py cdx_server/__version__.py
COPY cdx_server/__init__.py cdx_server/__init__.py

# Create venv and install runtime dependencies (no dev extras)
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Install OCR extras only when requested (easyocr + pillow-heif)
# pillow-heif wheels bundle libheif — no system packages needed.
RUN if [ "$INSTALL_OCR" = "true" ]; then \
      pip install --no-cache-dir ".[ocr]"; \
    fi

# --------------------------------------------------------------------------
# Stage 2: runtime — copy venv into a clean slim image
# --------------------------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim AS runtime

LABEL org.opencontainers.image.title="cdx-server"
LABEL org.opencontainers.image.description="Construction DX OS central platform API"
LABEL org.opencontainers.image.source="https://github.com/construction-dx-os/construction-dx-os"

# Non-root user for defence in depth
RUN useradd --system --no-create-home --shell /bin/false cdx-server

WORKDIR /app

# Copy venv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application source + migration scripts
COPY cdx_server/ cdx_server/
COPY pyproject.toml .
COPY alembic.ini .
COPY migrations/ migrations/

USER cdx-server

EXPOSE 8000

# uvicorn with one worker per container; scale horizontally via compose --scale
CMD ["uvicorn", "cdx_server.app:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--access-log"]
