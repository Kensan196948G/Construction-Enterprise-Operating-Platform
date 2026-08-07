/**
 * Backup retention cleanup for CEOP SQLite snapshots.
 *
 * Usage:
 *   node --experimental-strip-types scripts/backup-retention.ts <backupDir> [--keep-days 14]
 *
 * Deletes `ceop-*.db` files in the backup directory whose mtime is older than
 * `--keep-days` (default 14). Files whose names contain `predeploy` or
 * `crontest` are never auto-deleted — predeploy snapshots are the rollback
 * baseline and manual test artifacts are the operator's to remove.
 *
 * The script only prints deleted paths to stderr and exits non-zero when
 * argument validation fails; deletion errors are reported and counted.
 */

import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PROTECTED_SUBSTRINGS = ["predeploy", "crontest"] as const;

/** True for backup snapshots that automated retention may consider deleting. */
export function isRetentionCandidate(filename: string): boolean {
  return (
    filename.startsWith("ceop-") &&
    filename.endsWith(".db") &&
    !PROTECTED_SUBSTRINGS.some((s) => filename.includes(s))
  );
}

/** Return candidate paths whose mtime is older than `keepDays`. */
export function retentionCandidates(
  dir: string,
  keepDays: number,
  nowMs: number = Date.now(),
): string[] {
  const cutoff = nowMs - keepDays * 86_400_000;
  return readdirSync(dir)
    .filter(isRetentionCandidate)
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).mtimeMs < cutoff)
    .sort();
}

/** Delete expired snapshots and return a summary. */
export function cleanBackups(
  dir: string,
  keepDays: number,
  nowMs: number = Date.now(),
): { deleted: readonly string[]; failed: readonly string[] } {
  const deleted: string[] = [];
  const failed: string[] = [];
  const candidates = retentionCandidates(dir, keepDays, nowMs);
  // Never delete every snapshot: after a long backup outage all files can be
  // older than the retention window, and wiping the lot would leave nothing
  // to restore from. The newest candidate is always preserved.
  let targets = candidates;
  if (candidates.length > 1) {
    let newestIndex = 0;
    for (let i = 1; i < candidates.length; i++) {
      if (statSync(candidates[i]!).mtimeMs > statSync(candidates[newestIndex]!).mtimeMs) {
        newestIndex = i;
      }
    }
    targets = candidates.filter((_, i) => i !== newestIndex);
  }
  for (const path of targets) {
    try {
      unlinkSync(path);
      deleted.push(path);
    } catch (e) {
      console.error(`[backup-retention] failed to delete ${path}: ${e instanceof Error ? e.message : String(e)}`);
      failed.push(path);
    }
  }
  return { deleted, failed };
}

function main(): void {
  const args = process.argv.slice(2);
  const dir = args[0];
  const keepDaysArg = args.indexOf("--keep-days");
  const keepDays = keepDaysArg >= 0 ? Number(args[keepDaysArg + 1]) : 14;

  if (!dir) {
    console.error("usage: node scripts/backup-retention.ts <backupDir> [--keep-days 14]");
    process.exit(1);
  }
  if (!Number.isSafeInteger(keepDays) || keepDays < 1) {
    console.error("[backup-retention] --keep-days must be a positive integer");
    process.exit(1);
  }

  const { deleted, failed } = cleanBackups(dir, keepDays);
  for (const path of deleted) {
    console.error(`[backup-retention] deleted ${path}`);
  }
  console.error(`[backup-retention] deleted ${deleted.length} snapshot(s), ${failed.length} failure(s)`);
  if (failed.length > 0) process.exit(2);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
