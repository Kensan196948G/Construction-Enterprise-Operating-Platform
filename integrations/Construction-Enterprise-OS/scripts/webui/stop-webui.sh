#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.webui"

cd "${ROOT_DIR}"
if [[ -f "${ENV_FILE}" ]]; then
  docker compose --env-file "${ENV_FILE}" stop web
else
  docker compose stop web
fi
