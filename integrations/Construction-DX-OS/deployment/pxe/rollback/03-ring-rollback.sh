#!/usr/bin/env bash
# PXE Rollback Pattern 3: Ring Rollback
# Issue 0042 Phase 4.5
#
# Trigger: Ring advancement failure (e.g., ring2 pilot devices have issues)
# Action: Switch the ring's DHCP boot file to point to previous version
#
# Rings: ring0 (5-device pilot), ring1 (10%), ring2 (50%), ring3 (all)
# Usage: sudo ./03-ring-rollback.sh --ring ring2 [--version PREV_VERSION] [--dry-run]

set -euo pipefail

PXE_ROOT="${PXE_ROOT:-/srv/pxe}"
DNSMASQ_CONF_DIR="${DNSMASQ_CONF_DIR:-/etc/dnsmasq.d}"
LOG_FILE="/var/log/cdx-rollback.log"
DRY_RUN=false
RING=""
PREV_VERSION=""

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [RING-ROLLBACK] $*" | tee -a "${LOG_FILE}"; }
die() { log "ERROR: $*"; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        --ring)    RING="$2"; shift 2 ;;
        --version) PREV_VERSION="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

run() { $DRY_RUN && { log "[DRY-RUN] $*"; return; }; log "Running: $*"; "$@"; }

[[ -n "${RING}" ]] || die "--ring is required (ring0|ring1|ring2|ring3)"
[[ "${RING}" =~ ^ring[0-3]$ ]] || die "Invalid ring: ${RING} (must be ring0-ring3)"

log "=== Ring Rollback START: ring=${RING} dry_run=${DRY_RUN} ==="

if [[ -z "${PREV_VERSION}" ]]; then
    PREV_VERSION=$(ls -1t "${PXE_ROOT}/versions/" 2>/dev/null | sed -n '2p') || die "Cannot detect previous version"
fi
log "Rolling back ring '${RING}' to version: ${PREV_VERSION}"

# Update dnsmasq tag-based boot config for this ring
RING_CONF="${DNSMASQ_CONF_DIR}/cdx-${RING}.conf"
if [[ -f "${RING_CONF}" ]]; then
    run cp "${RING_CONF}" "${RING_CONF}.bak-$(date +%Y%m%d%H%M%S)"
    # Replace the boot version tag in the config
    run sed -i "s|/srv/pxe/[^/]*/|/srv/pxe/versions/${PREV_VERSION}/|g" "${RING_CONF}"
    log "Updated ring config: ${RING_CONF}"
else
    log "WARN: Ring config not found: ${RING_CONF}"
    log "MANUAL ACTION: Update DHCP boot file for ${RING} to point to ${PREV_VERSION}"
fi

run systemctl restart dnsmasq

log "=== Ring Rollback COMPLETE: ${RING} → ${PREV_VERSION} ==="
log "Devices in ${RING} will receive old boot file on next DHCP renew"
