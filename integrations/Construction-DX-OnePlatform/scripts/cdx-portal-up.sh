#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT_DIR/scripts/cdx-portal-env.sh"
set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/.runtime/cdx-portal.env"
set +a

cd "$ROOT_DIR"
docker compose up -d --build cdx-portal
docker compose ps cdx-portal
echo "Open: $CDX_PORTAL_URL"
