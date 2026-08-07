#!/usr/bin/env bash
# PXE Rollback Pattern 6: Abort (Emergency Stop)
# Issue 0042 Phase 4.5
#
# Trigger: Immediate stop of all PXE deployments
# Action: Enable nginx maintenance mode + disable DHCP PXE boot
#
# Usage: sudo ./06-abort.sh [--dry-run]
# Restore: sudo ./06-abort.sh --restore

set -euo pipefail

NGINX_CONF_DIR="${NGINX_CONF_DIR:-/etc/nginx/conf.d}"
DNSMASQ_CONF_DIR="${DNSMASQ_CONF_DIR:-/etc/dnsmasq.d}"
LOG_FILE="/var/log/cdx-rollback.log"
DRY_RUN=false
RESTORE=false

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [ABORT] $*" | tee -a "${LOG_FILE}"; }
die() { log "ERROR: $*"; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        --restore) RESTORE=true; shift ;;
        *) die "Unknown argument: $1" ;;
    esac
done

run() { $DRY_RUN && { log "[DRY-RUN] $*"; return; }; log "Running: $*"; "$@"; }

if $RESTORE; then
    log "=== Abort RESTORE START ==="
    # Re-enable DHCP PXE boot
    DISABLED_CONF="${DNSMASQ_CONF_DIR}/cdx-pxe-boot.conf.aborted"
    ACTIVE_CONF="${DNSMASQ_CONF_DIR}/cdx-pxe-boot.conf"
    if [[ -f "${DISABLED_CONF}" ]]; then
        run mv "${DISABLED_CONF}" "${ACTIVE_CONF}"
        run systemctl restart dnsmasq
        log "DHCP PXE boot re-enabled"
    fi
    # Remove nginx maintenance page
    MAINT_CONF="${NGINX_CONF_DIR}/cdx-maintenance.conf"
    if [[ -f "${MAINT_CONF}" ]]; then
        run rm -f "${MAINT_CONF}"
        run nginx -t || die "nginx config test failed after restore"
        run systemctl reload nginx
        log "Nginx maintenance mode removed"
    fi
    log "=== Abort RESTORE COMPLETE ==="
    exit 0
fi

log "=== ABORT START (dry_run=${DRY_RUN}) ==="
log "WARNING: This will stop ALL PXE provisioning immediately!"

# Disable dnsmasq PXE boot (comment out dhcp-boot directives)
ACTIVE_CONF="${DNSMASQ_CONF_DIR}/cdx-pxe-boot.conf"
if [[ -f "${ACTIVE_CONF}" ]]; then
    run mv "${ACTIVE_CONF}" "${ACTIVE_CONF}.aborted"
    log "DHCP PXE boot disabled: ${ACTIVE_CONF}"
fi
run systemctl restart dnsmasq

# Enable nginx maintenance mode (returns 503 for /pxe/* requests)
MAINT_CONF="${NGINX_CONF_DIR}/cdx-maintenance.conf"
if ! $DRY_RUN; then
    cat > "${MAINT_CONF}" <<'NGINX'
# CDX PXE Maintenance Mode
# Activated by 06-abort.sh — remove to restore
location /pxe/ {
    return 503 "PXE deployment suspended by emergency abort procedure.\n";
    add_header Content-Type text/plain;
}
NGINX
fi

run nginx -t || die "nginx config test failed"
run systemctl reload nginx

log "=== ABORT COMPLETE ==="
log "All PXE provisioning suspended."
log "RESTORE: sudo $0 --restore"
