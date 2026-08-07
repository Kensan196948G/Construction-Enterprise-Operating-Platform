# Build context: リポジトリルート (docker-compose.yml の build.context: .)
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev libgeos-dev curl \
    && rm -rf /var/lib/apt/lists/*

# 共通モジュールを先に COPY
COPY 00_共通基盤/shared-auth /opt/shared-auth
COPY 00_共通基盤/shared-db /opt/shared-db
COPY 11_統合データ基盤/ConstructionDataLake-DigitalTwin/backend /app

RUN pip install --upgrade pip && \
    pip install /opt/shared-auth /opt/shared-db && \
    pip install -e ".[dev]"

EXPOSE 8000

CMD ["uvicorn", "data_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
