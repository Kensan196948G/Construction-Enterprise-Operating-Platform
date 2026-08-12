#!/usr/bin/env bash
# FILE: scripts/r2-backup.sh
#
# Off-site backup of the CEOP SQLite backup to Cloudflare R2 via rclone.
#
# Prerequisites:
#   - rclone installed and configured with a remote named by CEOP_R2_REMOTE
#     (default: ceop-r2). See docs/operations/OFFSITE_BACKUP.md.
#   - The rclone config must live outside this repository (secrets never
#     committed). The script only reads it via rclone.
#
# Behaviour:
#   1. Pick the newest local backup (ceop-*.db).
#   2. rclone copy to R2 (checksum, single transfer).
#   3. Delete R2 objects older than CEOP_R2_RETENTION_DAYS (default 90).
#   4. Download the uploaded object and verify it with scripts/verify-restore.ts
#      (SQLite integrity + migrations + audit chain + ISO number duplicates).
#   5. Exit 0 on success, non-zero on any failure (fail-closed).
#
# Usage:
#   bash scripts/r2-backup.sh [--full]   # --full = log the file list too

set -uo pipefail

R2_REMOTE="${CEOP_R2_REMOTE:-ceop-r2}"
R2_PATH="${CEOP_R2_PATH:-sqlite}"
R2_RETENTION_DAYS="${CEOP_R2_RETENTION_DAYS:-90}"
BACKUP_DIR="${CEOP_BACKUP_DIR:-/home/kensan/.ceop/backups}"
LOG="${CEOP_R2_BACKUP_LOG:-/home/kensan/.ceop/r2-backup.log}"
VERIFY_SCRIPT="${CEOP_R2_VERIFY_SCRIPT:-/home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/scripts/verify-restore.ts}"
NODE_BIN="${CEOP_NODE_BIN:-/home/kensan/.nvm/versions/node/v25.2.1/bin/node}"

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { printf '%s %s\n' "$(now)" "$1" >>"$LOG"; }

if ! command -v rclone >/dev/null 2>&1; then
  log "FAILED rclone not installed — install rclone and configure ${R2_REMOTE} (OFFSITE_BACKUP.md)"
  exit 2
fi

# ── 1. Newest local backup ─────────────────────────────────────────────────
latest=$(ls -t "${BACKUP_DIR}"/ceop-*.db 2>/dev/null | head -1 || true)
if [ -z "$latest" ]; then
  log "FAILED no local backup found in ${BACKUP_DIR}"
  exit 2
fi
base=$(basename "$latest")
log "START ${base}"

# ── 2. Upload ──────────────────────────────────────────────────────────────
if ! rclone copy "$latest" "${R2_REMOTE}:${R2_PATH}/" --checksum --transfers 1 \
  >>"$LOG" 2>&1; then
  log "FAILED upload ${base}"
  exit 2
fi
log "UPLOADED ${base}"

# ── 3. Retention ───────────────────────────────────────────────────────────
rclone delete "${R2_REMOTE}:${R2_PATH}/" --min-age "${R2_RETENTION_DAYS}d" \
  >>"$LOG" 2>&1 || log "WARN retention cleanup failed (non-fatal)"

# ── 4. Verify the uploaded artifact ────────────────────────────────────────
tmpdir=$(mktemp -d)
if ! rclone copy "${R2_REMOTE}:${R2_PATH}/${base}" "$tmpdir/" --checksum >>"$LOG" 2>&1; then
  log "FAILED download-back ${base}"
  rm -rf "$tmpdir"
  exit 2
fi
if ! "$NODE_BIN" --experimental-strip-types "$VERIFY_SCRIPT" "$tmpdir/$base" >>"$LOG" 2>&1; then
  log "FAILED verify ${base} (restored artifact invalid)"
  rm -rf "$tmpdir"
  exit 2
fi
rm -rf "$tmpdir"

log "OK ${base} verified and stored in R2 (${R2_REMOTE}:${R2_PATH}/)"
exit 0
