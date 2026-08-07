#!/usr/bin/env bash
# PXE Rollback Pattern 4: Site Rollback
# Issue 0042 Phase 4.5
#
# Trigger: Site-specific issue (one branch/office has problems)
# Action: Redirect site's DHCP relay to a backup PXE server
#
# Usage: sudo ./04-site-rollback.sh --site tokyo-main --backup-pxe 192.168.1.10 [--dry-run]

set -euo pipefail

DNSMASQ_CONF_DIR="${DNSMASQ_CONF_DIR:-/etc/dnsmasq.d}"
LOG_FILE="/var/log/cdx-rollback.log"
DRY_RUN=false
SITE=""
BACKUP_PXE=""

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [SITE-ROLLBACK] $*" | tee -a "${LOG_FILE}"; }
die() { log "ERROR: $*"; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)     DRY_RUN=true; shift ;;
        --site)        SITE="$2"; shift 2 ;;
        --backup-pxe)  BACKUP_PXE="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

run() { $DRY_RUN && { log "[DRY-RUN] $*"; return; }; log "Running: $*"; "$@"; }

[[ -n "${SITE}" ]]       || die "--site is required"
[[ -n "${BACKUP_PXE}" ]] || die "--backup-pxe is required (IP of backup PXE server)"

log "=== Site Rollback START: site=${SITE} backup_pxe=${BACKUP_PXE} dry_run=${DRY_RUN} ==="

# Each site has its own dnsmasq config with DHCP relay/boot settings
SITE_CONF="${DNSMASQ_CONF_DIR}/cdx-site-${SITE}.conf"

if [[ -f "${SITE_CONF}" ]]; then
    run cp "${SITE_CONF}" "${SITE_CONF}.bak-$(date +%Y%m%d%H%M%S)"
    # Redirect the next-server (TFTP) to backup PXE server
    run sed -i "s/^dhcp-boot=.*/dhcp-boot=pxelinux.0,pxe-backup,${BACKUP_PXE}/" "${SITE_CONF}"
    log "Updated site config: ${SITE_CONF} → next-server=${BACKUP_PXE}"
else
    # Create a site-specific override
    if ! $DRY_RUN; then
        cat > "${SITE_CONF}" <<CONF
# CDX Site Rollback — ${SITE}
# Created: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
# Redirecting PXE traffic to backup server: ${BACKUP_PXE}
dhcp-boot=pxelinux.0,pxe-backup,${BACKUP_PXE}
CONF
    fi
    log "Created site override config: ${SITE_CONF}"
fi

run systemctl restart dnsmasq

log "=== Site Rollback COMPLETE: ${SITE} → backup PXE ${BACKUP_PXE} ==="
log "Devices at site '${SITE}' will use backup PXE server on next DHCP renew"
log "RESTORE: Remove ${SITE_CONF} and restart dnsmasq to revert"
