#!/bin/sh
# Docker HEALTHCHECK script.
# Returns 0 if the /health endpoint responds with HTTP 2xx, 1 otherwise.

curl -f --connect-timeout 2 --max-time 5 "http://localhost:${PORT:-3000}/health" || exit 1
