#!/usr/bin/env bash
# PXE Rollback Pattern 5: Single Device Rollback
# Issue 0042 Phase 4.5
#
# Trigger: One device has issues; all others are fine
# Action: DHCP reservation to serve old boot file to that device's MAC
#
# Usage: sudo ./05-single-rollback.sh --mac 00:11:22:33:44:55 [--version PREV_VERSION] [--dry-run]

set -euo pipefail

PXE_ROOT="${PXE_ROOT:-/srv/pxe}"
DNSMASQ_CONF_DIR="${DNSMASQ_CONF_DIR:-/etc/dnsmasq.d}"
LOG_FILE="/var/log/cdx-rollback.log"
DRY_RUN=false
MAC=""
PREV_VERSION=""

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [SINGLE-ROLLBACK] $*" | tee -a "${LOG_FILE}"; }
die() { log "ERROR: $*"; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        --mac)     MAC="$2"; shift 2 ;;
        --version) PREV_VERSION="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

run() { $DRY_RUN && { log "[DRY-RUN] $*"; return; }; log "Running: $*"; "$@"; }

[[ -n "${MAC}" ]] || die "--mac is required (device MAC address)"
# Normalize MAC address to lowercase colon-separated
MAC=$(echo "${MAC}" | tr '[:upper:]' '[:lower:]' | sed 's/-/:/g')
[[ "${MAC}" =~ ^([0-9a-f]{2}:){5}[0-9a-f]{2}$ ]] || die "Invalid MAC address: ${MAC}"

log "=== Single Device Rollback START: mac=${MAC} dry_run=${DRY_RUN} ==="

if [[ -z "${PREV_VERSION}" ]]; then
    PREV_VERSION=$(ls -1t "${PXE_ROOT}/versions/" 2>/dev/null | sed -n '2p') || die "Cannot detect previous version"
fi
log "Rolling back device ${MAC} to version: ${PREV_VERSION}"

# Create a per-device DHCP reservation that boots from the old version
MAC_SAFE=$(echo "${MAC}" | tr ':' '-')
DEVICE_CONF="${DNSMASQ_CONF_DIR}/cdx-single-${MAC_SAFE}.conf"

if ! $DRY_RUN; then
    cat > "${DEVICE_CONF}" <<CONF
# CDX Single Device Rollback — MAC: ${MAC}
# Created: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
# Reason: rollback to version ${PREV_VERSION}
dhcp-mac=set:rollback-${MAC_SAFE},${MAC}
dhcp-boot=tag:rollback-${MAC_SAFE},pxelinux.0,pxe-server,$(hostname -I | awk '{print $1}')
# Override to serve old version kernel/initrd
pxe-service=tag:rollback-${MAC_SAFE},x86PC,"Old Version ${PREV_VERSION}",/versions/${PREV_VERSION}/standard/pxelinux.0
CONF
else
    log "[DRY-RUN] Would create ${DEVICE_CONF}"
fi

run systemctl restart dnsmasq

log "=== Single Device Rollback COMPLETE: ${MAC} → ${PREV_VERSION} ==="
log "RESTORE: Remove ${DEVICE_CONF} and restart dnsmasq"
