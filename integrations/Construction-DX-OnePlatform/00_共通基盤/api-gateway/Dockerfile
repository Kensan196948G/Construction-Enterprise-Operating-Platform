# syntax=docker/dockerfile:1.7
# Build context: リポジトリルート (docker-compose.yml の build.context: .)
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl && rm -rf /var/lib/apt/lists/*

# 共通モジュールを先に COPY (キャッシュ効率)
COPY 00_共通基盤/shared-auth /opt/shared-auth
COPY 00_共通基盤/api-gateway /app

RUN pip install --upgrade pip && \
    pip install /opt/shared-auth && \
    pip install .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/health',timeout=2).status==200 else 1)"

CMD ["uvicorn", "cdx_gateway.main:app", "--host", "0.0.0.0", "--port", "8080"]
