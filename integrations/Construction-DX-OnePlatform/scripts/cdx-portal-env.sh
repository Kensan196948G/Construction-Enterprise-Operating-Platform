#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
ENV_FILE="$RUNTIME_DIR/cdx-portal.env"
mkdir -p "$RUNTIME_DIR"

detect_ip() {
  local ip=""
  if command -v ip >/dev/null 2>&1; then
    ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
  fi
  if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
  printf '%s\n' "${ip:-127.0.0.1}"
}

port_free() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ! ss -H -ltn "sport = :$port" | grep -q .
  elif command -v lsof >/dev/null 2>&1; then
    ! lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  else
    ! timeout 1 bash -c ":</dev/tcp/127.0.0.1/$port" >/dev/null 2>&1
  fi
}

choose_port() {
  local requested="${CDX_PORTAL_PORT:-}"
  if [[ -n "$requested" ]] && port_free "$requested"; then
    printf '%s\n' "$requested"
    return
  fi
  local port
  for port in 5179 5200 5201 5202 5203 5204 5205 5206 5207 5208 5209 5210; do
    if port_free "$port"; then
      printf '%s\n' "$port"
      return
    fi
  done
  echo "No free portal port found in 5179 or 5200-5210" >&2
  exit 1
}

PUBLIC_HOST="$(detect_ip)"
PORT="$(choose_port)"

cat > "$ENV_FILE" <<EOF
CDX_PORTAL_BIND_HOST=0.0.0.0
CDX_PORTAL_PUBLIC_HOST=$PUBLIC_HOST
CDX_PORTAL_PORT=$PORT
CDX_PORTAL_URL=http://$PUBLIC_HOST:$PORT/
EOF

echo "CDX Portal endpoint: http://$PUBLIC_HOST:$PORT/"
echo "Environment file: $ENV_FILE"
