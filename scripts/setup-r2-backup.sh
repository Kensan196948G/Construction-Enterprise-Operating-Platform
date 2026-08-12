#!/usr/bin/env bash
# FILE: scripts/setup-r2-backup.sh
#
# One-shot setup helper for the Cloudflare R2 off-site backup.
#
# Creates/updates the rclone remote "ceop-r2" (S3-compatible, Cloudflare R2),
# hardens the config file permissions, verifies connectivity, and enables the
# daily systemd timer.
#
# Required environment (never put these in Git):
#   R2_ACCOUNT_ID         — Cloudflare account ID (dash.cloudflare.com → Workers & Pages → R2)
#   R2_ACCESS_KEY_ID      — R2 API token Access Key ID
#   R2_SECRET_ACCESS_KEY  — R2 API token Secret Access Key
# Optional:
#   R2_BUCKET             — bucket name (default: ceop-backup)
#
# Usage:
#   sudo -E env R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
#     bash scripts/setup-r2-backup.sh

set -euo pipefail

REMOTE_NAME="${R2_REMOTE_NAME:-ceop-r2}"
BUCKET="${R2_BUCKET:-ceop-backup}"

if [ -z "${R2_ACCOUNT_ID:-}" ] || [ -z "${R2_ACCESS_KEY_ID:-}" ] || [ -z "${R2_SECRET_ACCESS_KEY:-}" ]; then
  echo "error: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are required" >&2
  exit 1
fi

if ! command -v rclone >/dev/null 2>&1; then
  echo "error: rclone is not installed (sudo apt-get install -y rclone)" >&2
  exit 1
fi

ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "[setup-r2] configuring rclone remote '${REMOTE_NAME}' → ${ENDPOINT}"
rclone config create "${REMOTE_NAME}" s3 \
  provider Cloudflare \
  access_key_id "${R2_ACCESS_KEY_ID}" \
  secret_access_key "${R2_SECRET_ACCESS_KEY}" \
  endpoint "${ENDPOINT}" \
  region auto \
  >/dev/null

CONF="${HOME}/.config/rclone/rclone.conf"
if [ -f "$CONF" ]; then
  chmod 600 "$CONF"
  echo "[setup-r2] config permissions set to 600: ${CONF}"
fi

echo "[setup-r2] verifying bucket '${BUCKET}'..."
if rclone lsd "${REMOTE_NAME}:" >/dev/null 2>&1; then
  echo "[setup-r2] connection OK"
else
  echo "[setup-r2] warning: could not list buckets. Check token permissions (Object Read & Write, bucket scope)."
fi

echo "[setup-r2] enabling daily timer (03:00 JST)..."
cp deploy/systemd/ceop-r2-backup.service deploy/systemd/ceop-r2-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ceop-r2-backup.timer

echo "[setup-r2] done. Next: run 'bash scripts/r2-backup.sh' once to upload the latest backup."
