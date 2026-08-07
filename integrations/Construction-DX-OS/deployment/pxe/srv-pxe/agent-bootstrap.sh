#!/usr/bin/env bash
# Construction-DX-OS — agent-bootstrap.sh
# Issue 0042 Phase 4.2 / 4.3 / 4.4
#
# Fetches a registration token from cdx-server via mTLS,
# installs cdx-agent, and wires the token so the agent
# auto-registers on first boot.
#
# Phase 4.4: Reports bootstrap_complete / bootstrap_failed events to
# POST /api/v1/pxe/events for Prometheus metrics.
#
# Environment variables (set by preseed late_command):
#   CDX_SERVER_URL  — e.g. http://192.168.0.185:8300
#   CDX_PROFILE     — standard | field | kiosk
#
# The script is served at: GET /pxe/agent-bootstrap.sh (via nginx)
# It runs inside the newly installed system via preseed late_command.

set -euo pipefail

CDX_SERVER_URL="${CDX_SERVER_URL:-http://192.168.0.185:8300}"
CDX_PROFILE="${CDX_PROFILE:-standard}"
INSTALL_DIR="/opt/cdx-agent"
AGENT_SERVICE="/etc/systemd/system/cdx-agent.service"
BOOTSTRAP_LOG="/var/log/cdx-bootstrap.log"
BOOTSTRAP_START_EPOCH=$(date +%s)

log() {
    echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "${BOOTSTRAP_LOG}"
}

# Phase 4.4: report bootstrap_failed on unexpected exit
_on_error() {
    local exit_code=$?
    local duration=$(( $(date +%s) - BOOTSTRAP_START_EPOCH ))
    curl -fsS --connect-timeout 10 --retry 2 \
        -X POST "${CDX_SERVER_URL}/api/v1/pxe/events" \
        -H "Content-Type: application/json" \
        -H "X-CDX-Bootstrap-Secret: ${CDX_BOOTSTRAP_SECRET:-}" \
        -d "{\"event\": \"bootstrap_failed\", \"profile\": \"${CDX_PROFILE:-unknown}\", \"fingerprint\": \"${FINGERPRINT:-$(printf '%064d' 0)}\", \"duration_seconds\": ${duration}, \"error_message\": \"exit_code=${exit_code}\"}" \
        >>"${BOOTSTRAP_LOG}" 2>&1 || true
}
trap '_on_error' ERR

log "CDX Bootstrap starting — profile=${CDX_PROFILE} server=${CDX_SERVER_URL}"

# --- 1. Generate device fingerprint (SHA256 of machine-id + MAC) ----------
MACHINE_ID=$(cat /etc/machine-id 2>/dev/null || hostname)
MAC=$(ip link show | awk '/ether/ {print $2; exit}')
FINGERPRINT=$(echo "${MACHINE_ID}:${MAC}" | sha256sum | cut -d' ' -f1)
HOSTNAME_BASE="cdx-${CDX_PROFILE}-$(echo "${FINGERPRINT}" | cut -c1-8)"
log "Fingerprint: ${FINGERPRINT}"
log "Hostname: ${HOSTNAME_BASE}"

# Set hostname
hostnamectl set-hostname "${HOSTNAME_BASE}" 2>/dev/null || echo "${HOSTNAME_BASE}" > /etc/hostname

# --- 2. Request ephemeral registration token from cdx-server ---------------
# Uses plain HTTP (same-LAN assumption per Issue 0041 § 5.2).
# mTLS upgrade path: add --cert /etc/cdx/client.crt --key /etc/cdx/client.key
log "Requesting registration token from ${CDX_SERVER_URL}..."

RESPONSE=$(curl -fsSL \
    --connect-timeout 30 \
    --retry 5 \
    --retry-delay 5 \
    -X POST "${CDX_SERVER_URL}/api/v1/devices/registration-tokens" \
    -H "Content-Type: application/json" \
    -d "{\"profile\": \"${CDX_PROFILE}\", \"fingerprint\": \"${FINGERPRINT}\"}" \
    2>>"${BOOTSTRAP_LOG}") || {
    log "ERROR: Failed to obtain registration token. Aborting."
    exit 1
}

REG_TOKEN=$(echo "${RESPONSE}" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>>"${BOOTSTRAP_LOG}") || {
    log "ERROR: Could not parse token from response: ${RESPONSE}"
    exit 1
}

log "Registration token obtained (length=${#REG_TOKEN})"

# --- 3. Install cdx-agent from cdx-server ----------------------------------
log "Installing cdx-agent..."
mkdir -p "${INSTALL_DIR}"
curl -fsSL "${CDX_SERVER_URL}/pxe/cdx-agent.tar.gz" \
    -o /tmp/cdx-agent.tar.gz 2>>"${BOOTSTRAP_LOG}" || {
    log "WARN: Could not download cdx-agent binary. Will install via pip."
    python3 -m pip install cdx-agent --quiet 2>>"${BOOTSTRAP_LOG}" || true
}
if [ -f /tmp/cdx-agent.tar.gz ]; then
    tar xzf /tmp/cdx-agent.tar.gz -C "${INSTALL_DIR}"
fi

# --- 4. Write cdx-agent config (wires the registration token) --------------
mkdir -p /etc/cdx-agent
cat > /etc/cdx-agent/config.toml <<EOF
[agent]
device_id = "${HOSTNAME_BASE}"
fingerprint = "${FINGERPRINT}"
profile = "${CDX_PROFILE}"

[server]
url = "${CDX_SERVER_URL}"

[auth]
# Ephemeral registration token — consumed on first registration.
# After registration, the agent switches to a long-lived token via rotation API.
registration_token = "${REG_TOKEN}"
token_file = "/etc/cdx-agent/token"
EOF
chmod 600 /etc/cdx-agent/config.toml

log "cdx-agent config written to /etc/cdx-agent/config.toml"

# --- 5. Install systemd service --------------------------------------------
cat > "${AGENT_SERVICE}" <<'SYSTEMD'
[Unit]
Description=Construction-DX-OS Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=/etc/cdx-agent/config.toml
ExecStart=/opt/cdx-agent/bin/cdx-agent --config /etc/cdx-agent/config.toml
Restart=on-failure
RestartSec=30s
NoNewPrivileges=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable cdx-agent.service
log "cdx-agent.service enabled — will start on reboot"

# --- 6. Report bootstrap_complete event to cdx-server (Phase 4.4) ----------
BOOTSTRAP_END_EPOCH=$(date +%s)
DURATION_SECONDS=$((BOOTSTRAP_END_EPOCH - BOOTSTRAP_START_EPOCH))

report_pxe_event() {
    local event="$1"
    local extra_fields="$2"
    curl -fsS \
        --connect-timeout 10 \
        --retry 3 \
        --retry-delay 2 \
        -X POST "${CDX_SERVER_URL}/api/v1/pxe/events" \
        -H "Content-Type: application/json" \
        -H "X-CDX-Bootstrap-Secret: ${CDX_BOOTSTRAP_SECRET:-}" \
        -d "{\"event\": \"${event}\", \"profile\": \"${CDX_PROFILE}\", \"fingerprint\": \"${FINGERPRINT}\", ${extra_fields}}" \
        >>"${BOOTSTRAP_LOG}" 2>&1 || log "WARN: Could not report PXE event ${event} (non-fatal)"
}

report_pxe_event "bootstrap_complete" "\"duration_seconds\": ${DURATION_SECONDS}"
log "PXE bootstrap_complete reported (duration=${DURATION_SECONDS}s)"

# --- 7. Record bootstrap outcome -------------------------------------------
cat >> "${BOOTSTRAP_LOG}" <<EOF
--- Bootstrap Summary ---
profile:     ${CDX_PROFILE}
fingerprint: ${FINGERPRINT}
hostname:    ${HOSTNAME_BASE}
server:      ${CDX_SERVER_URL}
token_len:   ${#REG_TOKEN}
duration_s:  ${DURATION_SECONDS}
completed:   $(date -u '+%Y-%m-%dT%H:%M:%SZ')
EOF

log "CDX Bootstrap complete. Rebooting into managed system."
