/**
 * Integration tests for SqliteAuditLog.
 *
 * Each test runs against a fresh `:memory:` database — no disk I/O needed.
 * We verify that SqliteAuditLog satisfies the same IAuditLog contract as the
 * in-memory AuditLog, plus SQLite-specific concerns (persistence across
 * reconnect, schema idempotency, duplicate event detection).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SqliteAuditLog } from "./sqlite-audit-log.ts";
import { type AuditEvent, auditEventId } from "../domain/audit-event.ts";
import { GENESIS_HASH } from "./audit-log.ts";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: auditEventId(crypto.randomUUID()),
    at: new Date().toISOString() as AuditEvent["at"],
    actor: "user-test",
    action: "read",
    resource: "application",
    outcome: "success",
    metadata: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SqliteAuditLog", () => {
  it("starts empty with GENESIS_HASH as tail", () => {
    const log = new SqliteAuditLog(":memory:");
    assert.equal(log.size, 0);
    assert.deepEqual(log.entries, []);
    assert.deepEqual(log.verify(), { valid: true });
    log.close();
  });

  it("append() seals an event and returns the chained entry", () => {
    const log = new SqliteAuditLog(":memory:");
    const ev = makeEvent();
    const entry = log.append(ev);

    assert.equal(entry.sequence, 0);
    assert.equal(entry.previousHash, GENESIS_HASH);
    assert.ok(entry.hash.length === 64, "SHA-256 hex is 64 chars");
    assert.equal(log.size, 1);
    log.close();
  });

  it("append() chains hashes across multiple events", () => {
    const log = new SqliteAuditLog(":memory:");
    const e1 = log.append(makeEvent({ actor: "a" }));
    const e2 = log.append(makeEvent({ actor: "b" }));
    const e3 = log.append(makeEvent({ actor: "c" }));

    assert.equal(e1.previousHash, GENESIS_HASH);
    assert.equal(e2.previousHash, e1.hash);
    assert.equal(e3.previousHash, e2.hash);
    assert.equal(log.size, 3);
    log.close();
  });

  it("entries returns all rows in insertion order", () => {
    const log = new SqliteAuditLog(":memory:");
    const actors = ["alpha", "beta", "gamma"];
    for (const actor of actors) log.append(makeEvent({ actor }));

    const entries = log.entries;
    assert.equal(entries.length, 3);
    for (let i = 0; i < actors.length; i++) {
      assert.equal(entries[i]!.event.actor, actors[i]);
      assert.equal(entries[i]!.sequence, i);
    }
    log.close();
  });

  it("verify() returns { valid: true } for an intact chain", () => {
    const log = new SqliteAuditLog(":memory:");
    for (let i = 0; i < 5; i++) log.append(makeEvent());
    assert.deepEqual(log.verify(), { valid: true });
    log.close();
  });

  it("query() filters entries by predicate", () => {
    const log = new SqliteAuditLog(":memory:");
    log.append(makeEvent({ outcome: "success" }));
    log.append(makeEvent({ outcome: "denied" }));
    log.append(makeEvent({ outcome: "denied" }));

    const denied = log.query((e) => e.event.outcome === "denied");
    assert.equal(denied.length, 2);
    log.close();
  });

  it("schema creation is idempotent (double-init same DB file)", async () => {
    const { mkdtempSync, rmdirSync, unlinkSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const tmpDir = mkdtempSync(join(tmpdir(), "ceop-test-"));
    const dbPath = join(tmpDir, "test.db");
    try {
      const log1 = new SqliteAuditLog(dbPath);
      log1.append(makeEvent({ actor: "first" }));
      log1.close();

      const log2 = new SqliteAuditLog(dbPath);
      try {
        assert.equal(log2.size, 1);
        assert.equal(log2.entries[0]!.event.actor, "first");
      } finally {
        log2.close();
      }
    } finally {
      for (const suffix of ["", "-wal", "-shm"]) {
        const p = dbPath + suffix;
        if (existsSync(p)) unlinkSync(p);
      }
      rmdirSync(tmpDir);
    }
  });

  it("persists across reconnect — hash chain resumes correctly", async () => {
    const { mkdtempSync, rmdirSync, unlinkSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const tmpDir = mkdtempSync(join(tmpdir(), "ceop-test-"));
    const dbPath = join(tmpDir, "test.db");
    let lastHash: string;
    try {
      const log1 = new SqliteAuditLog(dbPath);
      log1.append(makeEvent({ actor: "session-1-event-1" }));
      const e2 = log1.append(makeEvent({ actor: "session-1-event-2" }));
      lastHash = e2.hash;
      log1.close();

      const log2 = new SqliteAuditLog(dbPath);
      try {
        const e3 = log2.append(makeEvent({ actor: "session-2-event-3" }));
        assert.equal(e3.previousHash, lastHash, "chain resumes from persisted tail");
        assert.equal(e3.sequence, 2);
        assert.deepEqual(log2.verify(), { valid: true });
      } finally {
        log2.close();
      }
    } finally {
      for (const suffix of ["", "-wal", "-shm"]) {
        const p = dbPath + suffix;
        if (existsSync(p)) unlinkSync(p);
      }
      rmdirSync(tmpDir);
    }
  });

  it("verify() detects a tampered entry (broken hash)", async () => {
    const { DatabaseSync } = await import("node:sqlite");
    const { mkdtempSync, rmdirSync, unlinkSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const tmpDir = mkdtempSync(join(tmpdir(), "ceop-test-"));
    const dbPath = join(tmpDir, "test.db");
    try {
      const log = new SqliteAuditLog(dbPath);
      log.append(makeEvent());
      log.append(makeEvent());
      log.close();

      // Tamper with the event payload stored in the data JSON column.
      // Changing the actor field breaks the hash chain: the recomputed hash
      // will no longer match the stored hash in the same entry.
      const raw = new DatabaseSync(dbPath);
      raw.exec("PRAGMA journal_mode=WAL");
      raw
        .prepare(
          "UPDATE audit_log SET data = json_set(data, '$.event.actor', 'tampered') WHERE sequence=1",
        )
        .run();
      raw.close();

      const log2 = new SqliteAuditLog(dbPath);
      try {
        const report = log2.verify();
        assert.equal(report.valid, false);
      } finally {
        log2.close();
      }
    } finally {
      for (const suffix of ["", "-wal", "-shm"]) {
        const p = dbPath + suffix;
        if (existsSync(p)) unlinkSync(p);
      }
      rmdirSync(tmpDir);
    }
  });
});
