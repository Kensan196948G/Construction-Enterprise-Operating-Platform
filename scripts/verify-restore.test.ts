/** Unit tests for the backup/restore verifier. */

import { mkdtempSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyMigrations } from "./migrate.ts";
import { verifyBackup } from "./verify-restore.ts";
import { SqliteAuditLog } from "../src/governance/sqlite-audit-log.ts";
import { createAuditEvent } from "../src/domain/audit-event.ts";
import type { IsoTimestamp } from "../src/domain/common.ts";

function appendAudit(dbPath: string, actor: string, action: string): void {
  const log = new SqliteAuditLog(dbPath);
  const result = createAuditEvent({
    id: `${action}-${actor}-${Date.now()}-${Math.random()}`,
    at: new Date().toISOString() as IsoTimestamp,
    actor,
    action,
    resource: "test",
    outcome: "success",
    metadata: {},
  });
  assert.ok(result.ok);
  log.append(result.value);
  log.close();
}

test("verifyBackup accepts a migrated database with required tables", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-verify-restore-"));
  const dbPath = join(dir, "ceop.db");
  const backupPath = join(dir, "backup.db");
  try {
    const db = new DatabaseSync(dbPath);
    applyMigrations(db);
    db.close();
    appendAudit(dbPath, "user-a", "user:create");
    cpSync(dbPath, backupPath);
    const result = verifyBackup(backupPath);
    assert.equal(result.ok, true);
    assert.equal(result.integrity, "ok");
    assert.ok(result.migrations >= 26);
    assert.equal(result.hasIsoRecords, true);
    assert.equal(result.hasIntegrationEvents, true);
    assert.equal(result.auditChainValid, true);
    assert.equal(result.duplicateNumberGroups, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyBackup rejects a backup whose audit chain was tampered", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-verify-restore-"));
  const dbPath = join(dir, "ceop.db");
  const backupPath = join(dir, "backup.db");
  try {
    const db = new DatabaseSync(dbPath);
    applyMigrations(db);
    db.close();
    appendAudit(dbPath, "user-a", "user:create");
    cpSync(dbPath, backupPath);

    const tamper = new DatabaseSync(backupPath);
    tamper.prepare("UPDATE audit_log SET outcome = 'tampered' WHERE sequence = 0").run();
    tamper.close();

    const result = verifyBackup(backupPath);
    assert.equal(result.auditChainValid, false);
    assert.equal(result.ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
