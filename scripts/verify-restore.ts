/**
 * Verify a CEOP SQLite backup/restore artifact.
 *
 * Checks SQLite integrity, applied migration count, and the presence of the
 * core tables required by the current version. Intended to be run after a
 * restore (or before accepting a backup as valid).
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-restore.ts <backup.db>
 *
 * Exit codes: 0 = valid, 1 = usage error, 2 = verification failed.
 */

import { DatabaseSync } from "node:sqlite";

export interface BackupVerification {
  readonly path: string;
  readonly integrity: string;
  readonly migrations: number;
  readonly hasIsoRecords: boolean;
  readonly hasIntegrationEvents: boolean;
  readonly ok: boolean;
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
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(name) !== undefined;
    const hasIsoRecords = table("iso_records");
    const hasIntegrationEvents = table("integration_events");
    return {
      path: dbPath,
      integrity,
      migrations,
      hasIsoRecords,
      hasIntegrationEvents,
      ok: integrity === "ok" && migrations >= 26 && hasIsoRecords && hasIntegrationEvents,
    };
  } finally {
    db.close();
  }
}

if (process.argv[1] !== undefined && import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  const dbPath = process.argv[2];
  if (dbPath === undefined) {
    console.error("usage: verify-restore.ts <backup.db>");
    process.exit(1);
  }

  const result = verifyBackup(dbPath);
  console.error(
    `[verify-restore] integrity=${result.integrity} migrations=${result.migrations} ` +
      `iso_records=${result.hasIsoRecords} integration_events=${result.hasIntegrationEvents}`,
  );
  if (!result.ok) {
    console.error(`[verify-restore] FAILED: ${dbPath}`);
    process.exit(2);
  }
  console.error(`[verify-restore] OK: ${dbPath}`);
}
