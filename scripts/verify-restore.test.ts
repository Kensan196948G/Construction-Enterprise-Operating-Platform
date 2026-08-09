/** Unit tests for the backup/restore verifier. */

import { mkdtempSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyMigrations } from "./migrate.ts";
import { verifyBackup } from "./verify-restore.ts";

test("verifyBackup accepts a migrated database with required tables", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-verify-restore-"));
  const dbPath = join(dir, "ceop.db");
  const backupPath = join(dir, "backup.db");
  try {
    const db = new DatabaseSync(dbPath);
    applyMigrations(db);
    db.close();
    cpSync(dbPath, backupPath);
    const result = verifyBackup(backupPath);
    assert.equal(result.ok, true);
    assert.equal(result.integrity, "ok");
    assert.ok(result.migrations >= 26);
    assert.equal(result.hasIsoRecords, true);
    assert.equal(result.hasIntegrationEvents, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
