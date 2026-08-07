#!/usr/bin/env bash
# Spin up a local cdx-server with a fresh registration token for dev/testing.
# After this script finishes:
#   * The server runs on http://127.0.0.1:8080
#   * The registration token is printed to stdout (use it for register calls)
#
# Usage:
#   ./scripts/dev-up.sh
#   curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8080/...

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/server/api"

# venv health check: a stale .venv (wrong Python, half-installed deps) silently
# breaks startup. Detect by importing the package and rebuild on failure.
if [ -d ".venv" ] && ! .venv/bin/python -c 'import cdx_server' >/dev/null 2>&1; then
    echo "[dev-up] existing .venv is stale (cdx_server import failed); recreating..." >&2
    rm -rf .venv
fi

if [ ! -d ".venv" ]; then
    echo "[dev-up] creating .venv ..." >&2
    python3 -m venv .venv
    .venv/bin/pip install --quiet --upgrade pip
    .venv/bin/pip install --quiet -e ".[dev]"
    .venv/bin/pip install --quiet -e ../../agent/cdx_agent
fi

TOKEN="${CDX_REGISTRATION_TOKEN:-}"
if [ -z "$TOKEN" ]; then
    TOKEN="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
fi

cat <<EOF
================================================================
cdx-server starting...
  URL              : http://127.0.0.1:8080
  Registration tok : $TOKEN
  Health endpoint  : http://127.0.0.1:8080/health

Save the token:
  export CDX_REGISTRATION_TOKEN=$TOKEN

Stop with Ctrl-C.
================================================================
EOF

CDX_REGISTRATION_TOKEN="$TOKEN" \
    .venv/bin/uvicorn cdx_server.app:app --host 127.0.0.1 --port 8080 --reload
