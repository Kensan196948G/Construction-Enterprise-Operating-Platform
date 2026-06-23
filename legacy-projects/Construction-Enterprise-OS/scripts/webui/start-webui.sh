#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.webui"
PORT_START="${WEBUI_PORT_START:-3100}"
PORT_END="${WEBUI_PORT_END:-3199}"

detect_ip() {
  if command -v ip >/dev/null 2>&1; then
    ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1; i<=NF; i++) if ($i=="src") {print $(i+1); exit}}'
    return
  fi
  hostname -I 2>/dev/null | awk '{print $1}'
}

port_is_free() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ! ss -ltn "( sport = :${port} )" | tail -n +2 | grep -q .
    return
  fi
  if command -v lsof >/dev/null 2>&1; then
    ! lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi
  return 0
}

choose_port() {
  local port
  for port in $(seq "${PORT_START}" "${PORT_END}"); do
    if port_is_free "${port}"; then
      echo "${port}"
      return 0
    fi
  done
  echo "No free WebUI port found in ${PORT_START}-${PORT_END}" >&2
  return 1
}

WEBUI_BIND_IP="${WEBUI_BIND_IP:-$(detect_ip)}"
WEBUI_BIND_IP="${WEBUI_BIND_IP:-0.0.0.0}"
WEBUI_PORT="${WEBUI_PORT:-$(choose_port)}"

cat >"${ENV_FILE}" <<ENV
WEBUI_BIND_IP=${WEBUI_BIND_IP}
WEBUI_PORT=${WEBUI_PORT}
ENV

cd "${ROOT_DIR}"
docker compose --env-file "${ENV_FILE}" up -d --no-deps web

echo "Construction Enterprise OS WebUI: http://${WEBUI_BIND_IP}:${WEBUI_PORT}"
