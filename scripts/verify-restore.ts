/**
 * Verify a CEOP SQLite backup/restore artifact.
 *
 * Checks SQLite integrity, applied migration count, and the presence of the
 * core tables required by the current version, then re-computes the audit
 * hash chain and scans business invariants (duplicate ISO record numbers).
 * Intended to be run after a restore (or before accepting a backup as valid).
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-restore.ts <backup.db>
 *
 * Exit codes: 0 = valid, 1 = usage error, 2 = verification failed.
 */

import { DatabaseSync } from "node:sqlite";
import { GENESIS_HASH, hashAuditEntry } from "../src/governance/audit-log.ts";
import type { AuditEvent } from "../src/domain/audit-event.ts";

export interface BackupVerification {
  readonly path: string;
  readonly integrity: string;
  readonly migrations: number;
  readonly hasIsoRecords: boolean;
  readonly hasIntegrationEvents: boolean;
  readonly auditChainValid: boolean;
  readonly duplicateNumberGroups: number;
  readonly ok: boolean;
}

/** Recompute the audit hash chain without opening a second write connection. */
function auditChainValid(db: DatabaseSync): boolean {
  const rows = db
    .prepare(
      `SELECT sequence, at, actor, action, resource, outcome, prev_hash, hash, data
       FROM audit_log ORDER BY sequence ASC`,
    )
    .all() as {
    sequence: number;
    at: string;
    actor: string;
    action: string;
    resource: string;
    outcome: string;
    prev_hash: string;
    hash: string;
    data: string;
  }[];
  let previousHash = GENESIS_HASH;
  for (const row of rows) {
    let entry: {
      readonly event: AuditEvent;
      readonly sequence: number;
      readonly previousHash: string;
      readonly hash: string;
    };
    try {
      entry = JSON.parse(row.data) as typeof entry;
    } catch {
      return false;
    }
    const expected = hashAuditEntry(previousHash, entry.event);
    if (
      row.sequence !== entry.sequence ||
      row.at !== (entry.event.at as string) ||
      row.actor !== entry.event.actor ||
      row.action !== entry.event.action ||
      row.resource !== entry.event.resource ||
      row.outcome !== entry.event.outcome ||
      row.prev_hash !== previousHash ||
      row.hash !== entry.hash ||
      entry.previousHash !== previousHash ||
      row.hash !== expected
    ) {
      return false;
    }
    previousHash = row.hash;
  }
  return true;
}

/**
 * Count ISO record number groups that collide on (org, kind, number).
 * ISO record numbers are meant to be unique per kind within an organisation;
 * duplicates indicate an import or hand-edit that bypassed domain validation.
 */
function countDuplicateNumberGroups(db: DatabaseSync): number {
  const rows = db.prepare("SELECT org_id, kind, data FROM iso_records").all() as {
    org_id: string;
    kind: string;
    data: string;
  }[];
  const seen = new Map<string, string[]>();
  let duplicateGroups = 0;
  for (const row of rows) {
    let parsed: { number?: unknown };
    try {
      parsed = JSON.parse(row.data) as { number?: unknown };
    } catch {
      duplicateGroups += 1;
      continue;
    }
    if (typeof parsed.number !== "string" || parsed.number.length === 0) continue;
    const key = `${row.org_id}|${row.kind}|${parsed.number}`;
    const ids = seen.get(key) ?? [];
    if (ids.length === 1) duplicateGroups += 1;
    ids.push(row.org_id);
    seen.set(key, ids);
  }
  return duplicateGroups;
}

export function verifyBackup(dbPath: string): BackupVerification {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const integrity = (db.prepare("PRAGMA integrity_check").get() as { integrity_check: string })
      .integrity_check;
    const migrations = (
      db.prepare("SELECT COUNT(*) AS c FROM schema_migrations").get() as { c: number }
    ).c;
    const table = (name: string): boolean =>
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name) !==
      undefined;
    const hasIsoRecords = table("iso_records");
    const hasIntegrationEvents = table("integration_events");
    const chainValid = table("audit_log") ? auditChainValid(db) : false;
    const duplicateGroups = hasIsoRecords ? countDuplicateNumberGroups(db) : 0;
    return {
      path: dbPath,
      integrity,
      migrations,
      hasIsoRecords,
      hasIntegrationEvents,
      auditChainValid: chainValid,
      duplicateNumberGroups: duplicateGroups,
      ok:
        integrity === "ok" &&
        migrations >= 26 &&
        hasIsoRecords &&
        hasIntegrationEvents &&
        chainValid &&
        duplicateGroups === 0,
    };
  } finally {
    db.close();
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === new URL(process.argv[1], import.meta.url).href
) {
  const dbPath = process.argv[2];
  if (dbPath === undefined) {
    console.error("usage: verify-restore.ts <backup.db>");
    process.exit(1);
  }

  const result = verifyBackup(dbPath);
  console.error(
    `[verify-restore] integrity=${result.integrity} migrations=${result.migrations} ` +
      `iso_records=${result.hasIsoRecords} integration_events=${result.hasIntegrationEvents} ` +
      `audit_chain=${result.auditChainValid} duplicate_iso_numbers=${result.duplicateNumberGroups}`,
  );
  if (!result.ok) {
    console.error(`[verify-restore] FAILED: ${dbPath}`);
    process.exit(2);
  }
  console.error(`[verify-restore] OK: ${dbPath}`);
}
