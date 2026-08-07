FROM python:3.12-slim

WORKDIR /app

# Install shared package first (dependency for all services)
COPY services/_shared/ /app/_shared/
RUN pip install --no-cache-dir -e /app/_shared

# Install service package
COPY services/ai-gateway-service/ /app/service/
RUN pip install --no-cache-dir -e /app/service

EXPOSE 8006

CMD ["uvicorn", "ai_gateway_app.main:app", "--host", "0.0.0.0", "--port", "8006"]
