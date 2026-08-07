#!/usr/bin/env bash
# Deploy the CEOP WebUI to the local host (systemd service ceop-webui).
#
# Steps:
#   1. verify the working tree passes tests (optional: SKIP_VERIFY=1)
#   2. sync app source (src/, scripts/, package.json) to the release dir
#   3. unpack the design bundle into the release webui-dist/
#   4. install/refresh the systemd unit and (re)start the service
#   5. probe /healthz on the configured port
#
# Requires: passwordless sudo for systemctl/cp (present on this host).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${CEOP_WEBUI_RELEASE_DIR:-/home/kensan/.ceop/webui/current}"
UNIT_SRC="$REPO_DIR/deploy/systemd/ceop-webui.service"
UNIT_DST="/etc/systemd/system/ceop-webui.service"
ENV_FILE="/home/kensan/.ceop/webui.env"
PORT="$(grep -E '^CEOP_WEBUI_PORT=' "$ENV_FILE" | cut -d= -f2 || echo 3130)"

cd "$REPO_DIR"

if [[ "${SKIP_VERIFY:-0}" != "1" ]]; then
  echo "[deploy] running verify (SKIP_VERIFY=1 to skip)"
  pnpm run verify >/dev/null
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[deploy] missing $ENV_FILE — create it first (chmod 600)" >&2
  exit 1
fi

echo "[deploy] syncing app source to $RELEASE_DIR/app"
mkdir -p "$RELEASE_DIR/app"
rsync -a --delete --exclude '*.test.ts' src scripts package.json "$RELEASE_DIR/app/"

echo "[deploy] unpacking design bundle to $RELEASE_DIR/webui-dist"
node --experimental-strip-types scripts/webui-unpack.ts \
  "webui/CEOP Platform.html" "$RELEASE_DIR/webui-dist"

if ! cmp -s "$UNIT_SRC" "$UNIT_DST" 2>/dev/null; then
  echo "[deploy] installing systemd unit"
  sudo cp "$UNIT_SRC" "$UNIT_DST"
  sudo systemctl daemon-reload
fi
sudo systemctl enable --now ceop-webui >/dev/null 2>&1 || true
sudo systemctl restart ceop-webui

echo "[deploy] waiting for /healthz on port $PORT"
for _ in $(seq 1 20); do
  if node --experimental-strip-types scripts/webui-healthcheck.ts "http://127.0.0.1:$PORT/healthz" 2>/dev/null; then
    echo "[deploy] ceop-webui healthy on port $PORT"
    exit 0
  fi
  sleep 0.5
done

echo "[deploy] health check FAILED — inspect: journalctl -u ceop-webui -n 50" >&2
exit 1
