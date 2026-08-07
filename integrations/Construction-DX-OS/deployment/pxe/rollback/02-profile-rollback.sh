#!/usr/bin/env bash
# PXE Rollback Pattern 2: Profile Rollback
# Issue 0042 Phase 4.5
#
# Trigger: Bug affecting one specific profile (standard/field/kiosk)
# Action: Switch only the affected profile's symlink to previous version
#
# Usage: sudo ./02-profile-rollback.sh --profile field [--version PREV_VERSION] [--dry-run]

set -euo pipefail

PXE_ROOT="${PXE_ROOT:-/srv/pxe}"
LOG_FILE="/var/log/cdx-rollback.log"
DRY_RUN=false
PROFILE=""
PREV_VERSION=""

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [PROFILE-ROLLBACK] $*" | tee -a "${LOG_FILE}"; }
die() { log "ERROR: $*"; exit 1; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)  DRY_RUN=true; shift ;;
        --profile)  PROFILE="$2"; shift 2 ;;
        --version)  PREV_VERSION="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

run() { $DRY_RUN && { log "[DRY-RUN] $*"; return; }; log "Running: $*"; "$@"; }

[[ -n "${PROFILE}" ]] || die "--profile is required (standard|field|kiosk)"
[[ "${PROFILE}" =~ ^(standard|field|kiosk)$ ]] || die "Invalid profile: ${PROFILE}"

log "=== Profile Rollback START: profile=${PROFILE} dry_run=${DRY_RUN} ==="

if [[ -z "${PREV_VERSION}" ]]; then
    PREV_VERSION=$(ls -1t "${PXE_ROOT}/versions/" 2>/dev/null | sed -n '2p') || die "Cannot detect previous version"
fi
log "Rolling back profile '${PROFILE}' to version: ${PREV_VERSION}"

PREV_PATH="${PXE_ROOT}/versions/${PREV_VERSION}/${PROFILE}"
[[ -d "${PREV_PATH}" ]] || die "Previous path not found: ${PREV_PATH}"

run ln -sfn "${PREV_PATH}" "${PXE_ROOT}/${PROFILE}"
log "Symlink updated: ${PXE_ROOT}/${PROFILE} → ${PREV_PATH}"

run nginx -t || die "nginx config test failed"
run systemctl reload nginx

log "=== Profile Rollback COMPLETE: ${PROFILE} → ${PREV_VERSION} ==="
