FROM python:3.12-slim

WORKDIR /app

# Install shared package first (dependency for all services)
COPY services/_shared/ /app/_shared/
RUN pip install --no-cache-dir -e /app/_shared

# Install service package with postgres extra for DATABASE_URL support
COPY services/object-service/ /app/service/
RUN pip install --no-cache-dir -e "/app/service[postgres]"

EXPOSE 8004

CMD ["uvicorn", "object_app.main:app", "--host", "0.0.0.0", "--port", "8004"]
