#!/usr/bin/env bash
# PXE Rollback Pattern 1: Full Rollback
# Issue 0042 Phase 4.5
#
# Trigger: Critical bug affecting all deployments
# Action: Switch all profiles to previous ISO, stop all ring progression
#
# Usage: sudo ./01-full-rollback.sh [--dry-run] [--version PREV_VERSION]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PXE_ROOT="${PXE_ROOT:-/srv/pxe}"
NGINX_CONF_DIR="${NGINX_CONF_DIR:-/etc/nginx/conf.d}"
LOG_FILE="/var/log/cdx-rollback.log"
DRY_RUN=false
PREV_VERSION=""

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [FULL-ROLLBACK] $*" | tee -a "${LOG_FILE}"; }
die() { log "ERROR: $*"; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        --version) PREV_VERSION="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

run() {
    if $DRY_RUN; then
        log "[DRY-RUN] $*"
    else
        log "Running: $*"
        "$@"
    fi
}

log "=== Full Rollback START (dry_run=${DRY_RUN}) ==="

# Detect previous version if not specified
if [[ -z "${PREV_VERSION}" ]]; then
    PREV_VERSION=$(ls -1t "${PXE_ROOT}/versions/" 2>/dev/null | sed -n '2p') || die "Cannot detect previous version"
    [[ -z "${PREV_VERSION}" ]] && die "No previous version found in ${PXE_ROOT}/versions/"
fi
log "Rolling back to version: ${PREV_VERSION}"
[[ -d "${PXE_ROOT}/versions/${PREV_VERSION}" ]] || die "Version directory not found: ${PXE_ROOT}/versions/${PREV_VERSION}"

# Switch all profiles via symlink
for profile in standard field kiosk; do
    PROFILE_LINK="${PXE_ROOT}/${profile}"
    PREV_PROFILE="${PXE_ROOT}/versions/${PREV_VERSION}/${profile}"
    if [[ -d "${PREV_PROFILE}" ]]; then
        run ln -sfn "${PREV_PROFILE}" "${PROFILE_LINK}"
        log "Profile ${profile}: symlink updated → ${PREV_PROFILE}"
    else
        log "WARN: ${PREV_PROFILE} not found, skipping profile ${profile}"
    fi
done

# Disable ring progression by removing ring-advance cron
RING_CRON="/etc/cron.d/cdx-ring-advance"
if [[ -f "${RING_CRON}" ]]; then
    run mv "${RING_CRON}" "${RING_CRON}.disabled-by-rollback"
    log "Ring cron disabled: ${RING_CRON}"
fi

# Reload nginx to serve new symlink targets
run nginx -t || die "nginx config test failed"
run systemctl reload nginx

log "=== Full Rollback COMPLETE ==="
log "NEXT STEPS:"
log "  1. Verify devices boot from ${PREV_VERSION}"
log "  2. Investigate root cause of issue"
log "  3. Run 01-full-rollback.sh --version NEW_VERSION to re-advance"
