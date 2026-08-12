/**
 * Verify the tamper-evident audit chain in a CEOP SQLite database.
 *
 * Recomputes the SHA-256 hash chain over every `audit_log` row and exits
 * non-zero when any entry has been altered (direct column update, JSON blob
 * edit, missing row, or sequence reorder).
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-audit-chain.ts <db-path>
 *
 * Exit codes: 0 = chain intact, 1 = usage error, 2 = chain broken / unreadable.
 */

import { SqliteAuditLog } from "../src/governance/sqlite-audit-log.ts";
import type { IntegrityReport } from "../src/governance/audit-log.ts";

export interface AuditChainVerification extends IntegrityReport {
  readonly path: string;
  readonly entries: number;
}

export function verifyAuditChain(dbPath: string): AuditChainVerification {
  // Read-only: the verifier must never write to the database it is checking,
  // and this also allows verifying immutable backup files.
  const log = new SqliteAuditLog(dbPath, { readOnly: true });
  try {
    const report = log.verify();
    return { path: dbPath, entries: log.size, ...report };
  } finally {
    log.close();
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === new URL(process.argv[1], import.meta.url).href
) {
  const dbPath = process.argv[2];
  if (dbPath === undefined) {
    console.error("usage: verify-audit-chain.ts <db-path>");
    process.exit(1);
  }
  try {
    const result = verifyAuditChain(dbPath);
    console.error(
      `[verify-audit-chain] ${result.path}: entries=${result.entries} valid=${result.valid}` +
        (result.brokenAt !== undefined ? ` brokenAt=${result.brokenAt}` : ""),
    );
    process.exit(result.valid ? 0 : 2);
  } catch (e) {
    console.error(`[verify-audit-chain] FAILED: ${dbPath}`, e);
    process.exit(2);
  }
}
