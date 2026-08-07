# Build context: リポジトリルート (docker-compose.yml の build.context: .)
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl libgeos-dev && rm -rf /var/lib/apt/lists/*

# Copy shared modules then this service
COPY 00_共通基盤/shared-auth /opt/shared-auth
COPY 00_共通基盤/shared-db /opt/shared-db
COPY 00_共通基盤/shared-pdf /opt/shared-pdf
COPY 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/backend /app

RUN pip install --upgrade pip && \
    pip install /opt/shared-auth /opt/shared-db /opt/shared-pdf && \
    pip install -e .

EXPOSE 8000

CMD ["uvicorn", "sol_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
