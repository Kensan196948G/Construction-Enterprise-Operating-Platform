# Construction DX OS — Mock WebUI
# Serves the admin SPA with dummy data via nginx
# Port 8888 (non-conflicting with cdx-server:8000, grafana:3000, prometheus:9090)

FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="cdx-mock-ui" \
      org.opencontainers.image.description="Construction DX OS mock WebUI with dummy data" \
      org.opencontainers.image.version="0.1.0"

# Copy static admin SPA files
COPY admin-spa/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8888

# Use 127.0.0.1 (not localhost): nginx listens on IPv4 0.0.0.0 only, while
# busybox wget resolves "localhost" to IPv6 ::1 first -> connection refused.
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8888/ > /dev/null || exit 1
