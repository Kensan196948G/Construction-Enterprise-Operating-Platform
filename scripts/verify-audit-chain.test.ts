/** Unit tests for the audit chain verifier CLI. */

import { mkdtempSync, rmSync, cpSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";

import { SqliteAuditLog } from "../src/governance/sqlite-audit-log.ts";
import { createAuditEvent } from "../src/domain/audit-event.ts";
import type { IsoTimestamp } from "../src/domain/common.ts";
import { verifyAuditChain } from "./verify-audit-chain.ts";

function append(auditLog: SqliteAuditLog, actor: string, action: string): void {
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
  auditLog.append(result.value);
}

test("verifyAuditChain accepts an intact chain", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-audit-cli-"));
  const dbPath = join(dir, "audit.db");
  try {
    const log = new SqliteAuditLog(dbPath);
    append(log, "user-a", "user:create");
    append(log, "user-b", "governance:evaluate");
    log.close();

    const result = verifyAuditChain(dbPath);
    assert.equal(result.valid, true);
    assert.equal(result.entries, 2);
    assert.equal(result.brokenAt, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyAuditChain rejects a tampered chain", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-audit-cli-"));
  const dbPath = join(dir, "audit.db");
  try {
    const log = new SqliteAuditLog(dbPath);
    append(log, "user-a", "user:create");
    append(log, "user-b", "governance:evaluate");
    log.close();

    const db = new DatabaseSync(dbPath);
    db.prepare("UPDATE audit_log SET outcome = 'tampered' WHERE sequence = 1").run();
    db.close();

    const result = verifyAuditChain(dbPath);
    assert.equal(result.valid, false);
    assert.equal(result.brokenAt, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyAuditChain can verify an immutable backup file", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-audit-cli-"));
  const dbPath = join(dir, "audit.db");
  const backupPath = join(dir, "audit-backup.db");
  try {
    const log = new SqliteAuditLog(dbPath);
    append(log, "user-a", "user:create");
    append(log, "user-b", "governance:evaluate");
    log.close();

    // Simulate a read-only backup artifact.
    cpSync(dbPath, backupPath);
    chmodSync(backupPath, 0o444);

    const result = verifyAuditChain(backupPath);
    assert.equal(result.valid, true);
    assert.equal(result.entries, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
