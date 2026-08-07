#!/usr/bin/env bash
# Register a test device against a locally-running cdx-server.
#
# Secret handling: the per-device shared secret is written to a temp file
# (mode 0600) and the file PATH is printed instead of the value, so the
# secret never appears in terminal scrollback or shell history.
#
# Usage:
#   export CDX_REGISTRATION_TOKEN=<token-from-dev-up.sh>
#   ./scripts/dev-register.sh dev-001 standard test-host

set -euo pipefail

DEVICE_ID="${1:-dev-001}"
PROFILE="${2:-standard}"
HOSTNAME="${3:-test-host}"
URL="${CDX_API_BASE:-http://127.0.0.1:8080}/api/v1/devices/register"

if [ -z "${CDX_REGISTRATION_TOKEN:-}" ]; then
    echo "ERROR: CDX_REGISTRATION_TOKEN is not set." >&2
    echo "Run scripts/dev-up.sh first and export the token." >&2
    exit 2
fi

# Generate a per-device shared secret into a 0600 temp file. The value is
# never echoed to the terminal — only the file path is.
SECRET_DIR="${TMPDIR:-/tmp}/cdx-secrets"
mkdir -p "$SECRET_DIR"
chmod 0700 "$SECRET_DIR"
SECRET_FILE="$SECRET_DIR/${DEVICE_ID}.secret"
umask 0177
python3 -c 'import secrets,sys; sys.stdout.write(secrets.token_hex(32))' > "$SECRET_FILE"
chmod 0600 "$SECRET_FILE"

cat <<EOF
Registering device:
  device_id     : $DEVICE_ID
  profile       : $PROFILE
  hostname      : $HOSTNAME
  shared_secret : (kept in $SECRET_FILE, mode 0600 — not printed)
  endpoint      : $URL
EOF

# Build the JSON body via python so the secret never lands in process args
# (process args are visible via /proc/<pid>/cmdline to other UIDs).
PAYLOAD="$(
    SECRET_FILE="$SECRET_FILE" \
    DEVICE_ID="$DEVICE_ID" \
    PROFILE="$PROFILE" \
    HOSTNAME_VAL="$HOSTNAME" \
    python3 - <<'PY'
import json, os, pathlib
secret = pathlib.Path(os.environ["SECRET_FILE"]).read_text().strip()
print(json.dumps({
    "device_id": os.environ["DEVICE_ID"],
    "profile": os.environ["PROFILE"],
    "hostname": os.environ["HOSTNAME_VAL"],
    "shared_secret": secret,
}))
PY
)"

curl -sf -X POST "$URL" \
    -H "Authorization: Bearer ${CDX_REGISTRATION_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
echo

cat <<EOF

Provision the secret on the device WITHOUT printing it:
  scp $SECRET_FILE  device:/tmp/shared_secret.tmp
  ssh device 'sudo install -m 0600 -o root -g cdx-agent /tmp/shared_secret.tmp /etc/cdx-agent/shared_secret && rm /tmp/shared_secret.tmp'

When done, shred the local copy:
  shred -u $SECRET_FILE
EOF
