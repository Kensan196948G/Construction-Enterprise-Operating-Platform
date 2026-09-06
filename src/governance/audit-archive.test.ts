/**
 * Unit tests for audit-event archival (issue #83).
 *
 * The central property under test: archiving never touches the hash chain.
 * `verify()` must report the same result before and after a batch archive
 * run, for both the in-memory and SQLite-backed audit log implementations.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type AuditEvent,
  type IsoTimestamp,
  type Result,
  createAuditEvent,
  toIsoTimestamp,
} from "../domain/index.ts";
import { AuditLog, type IAuditLog } from "./audit-log.ts";
import { SqliteAuditLog } from "./sqlite-audit-log.ts";
import {
  DEFAULT_AUDIT_RETENTION_DAYS,
  InMemoryAuditArchiveStore,
  SqliteAuditArchiveStore,
  archiveExpiredAuditEvents,
  withArchiveStatus,
  type AuditArchiveStore,
} from "./audit-archive.ts";

function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

function isoDaysAgo(days: number, from: Date): IsoTimestamp {
  return unwrap(toIsoTimestamp(new Date(from.getTime() - days * 24 * 60 * 60 * 1000).toISOString()));
}

function event(id: string, at: IsoTimestamp): AuditEvent {
  return unwrap(
    createAuditEvent({ id, at, actor: "u1", action: "read", resource: "application", outcome: "success" }),
  );
}

const NOW = new Date("2026-09-06T00:00:00.000Z");

/**
 * Shared behavioral suite run against both the in-memory and SQLite-backed
 * `AuditLog` + `AuditArchiveStore` pairs, so the two backends stay in parity.
 */
function runArchiveSuite(
  label: string,
  makeLog: () => IAuditLog,
  makeStore: () => AuditArchiveStore,
): void {
  test(`[${label}] entries older than the retention window are archived; recent ones are not`, () => {
    const log = makeLog();
    const store = makeStore();

    // Well outside the default ~7yr window, well inside a 30-day window, and
    // right at the edge of a 30-day window.
    const old = log.append(event("old", isoDaysAgo(4000, NOW)));
    const recent = log.append(event("recent", isoDaysAgo(1, NOW)));
    const atEdge = log.append(event("edge", isoDaysAgo(31, NOW)));

    const result = archiveExpiredAuditEvents(log, store, { retentionDays: 30, now: NOW });

    assert.equal(result.archivedCount, 2);
    assert.deepEqual([...result.archivedSequences].sort(), [old.sequence, atEdge.sequence].sort());
    assert.equal(result.totalArchived, 2);

    assert.equal(store.isArchived(old.sequence), true);
    assert.equal(store.isArchived(atEdge.sequence), true);
    assert.equal(store.isArchived(recent.sequence), false);
    assert.equal(store.archivedAt(recent.sequence), undefined);
    assert.equal(typeof store.archivedAt(old.sequence), "string");
  });

  test(`[${label}] archiving does not mutate the log and verify() stays valid`, () => {
    const log = makeLog();
    const store = makeStore();
    log.append(event("e1", isoDaysAgo(4000, NOW)));
    log.append(event("e2", isoDaysAgo(3000, NOW)));
    log.append(event("e3", isoDaysAgo(1, NOW)));

    const before = log.entries.map((e) => ({ ...e }));
    assert.equal(log.verify().valid, true);

    const result = archiveExpiredAuditEvents(log, store, { retentionDays: 365, now: NOW });
    assert.equal(result.archivedCount, 2);

    // The chain is byte-for-byte identical to before archival.
    assert.deepEqual(log.entries, before);
    assert.equal(log.verify().valid, true);
  });

  test(`[${label}] is idempotent across repeated runs`, () => {
    const log = makeLog();
    const store = makeStore();
    const e1 = log.append(event("e1", isoDaysAgo(4000, NOW)));

    const first = archiveExpiredAuditEvents(log, store, { retentionDays: 30, now: NOW });
    assert.equal(first.archivedCount, 1);
    const firstArchivedAt = store.archivedAt(e1.sequence);

    // Running again later must not re-archive or change the recorded timestamp.
    const later = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    const second = archiveExpiredAuditEvents(log, store, { retentionDays: 30, now: later });
    assert.equal(second.archivedCount, 0);
    assert.equal(store.archivedAt(e1.sequence), firstArchivedAt);
    assert.equal(store.size, 1);
  });

  test(`[${label}] withArchiveStatus annotates entries without mutating them`, () => {
    const log = makeLog();
    const store = makeStore();
    const old = log.append(event("old", isoDaysAgo(4000, NOW)));
    const recent = log.append(event("recent", isoDaysAgo(1, NOW)));
    archiveExpiredAuditEvents(log, store, { retentionDays: 30, now: NOW });

    const annotatedOld = withArchiveStatus(old, store);
    const annotatedRecent = withArchiveStatus(recent, store);

    assert.equal(annotatedOld.archived, true);
    assert.equal(typeof annotatedOld.archivedAt, "string");
    assert.equal(annotatedOld.event.id, old.event.id);
    assert.equal(annotatedOld.hash, old.hash);

    assert.equal(annotatedRecent.archived, false);
    assert.equal(annotatedRecent.archivedAt, undefined);

    // The original entries are untouched (no `archived` field leaked onto them).
    assert.equal((old as unknown as { archived?: boolean }).archived, undefined);
  });

  test(`[${label}] defaults to DEFAULT_AUDIT_RETENTION_DAYS when unspecified`, () => {
    const log = makeLog();
    const store = makeStore();
    log.append(event("very-old", isoDaysAgo(DEFAULT_AUDIT_RETENTION_DAYS + 10, NOW)));
    log.append(event("within-default", isoDaysAgo(10, NOW)));

    const result = archiveExpiredAuditEvents(log, store, { now: NOW });
    assert.equal(result.archivedCount, 1);
    assert.equal(result.cutoff, isoDaysAgo(DEFAULT_AUDIT_RETENTION_DAYS, NOW));
  });
}

runArchiveSuite(
  "in-memory",
  () => new AuditLog(),
  () => new InMemoryAuditArchiveStore(),
);

test("[sqlite] archival persists across a store reconnect and preserves verify()", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-audit-archive-"));
  const dbPath = join(dir, "audit.db");
  try {
    const log = new SqliteAuditLog(dbPath);
    const store = new SqliteAuditArchiveStore(dbPath);
    try {
      const old = log.append(event("old", isoDaysAgo(4000, NOW)));
      const recent = log.append(event("recent", isoDaysAgo(1, NOW)));

      const result = archiveExpiredAuditEvents(log, store, { retentionDays: 30, now: NOW });
      assert.equal(result.archivedCount, 1);
      assert.equal(store.isArchived(old.sequence), true);
      assert.equal(store.isArchived(recent.sequence), false);
      assert.equal(log.verify().valid, true);
    } finally {
      store.close();
      log.close();
    }

    // Reopen fresh connections against the same file: the archive record and
    // the hash chain both survive the reconnect.
    const reopenedLog = new SqliteAuditLog(dbPath);
    const reopenedStore = new SqliteAuditArchiveStore(dbPath);
    try {
      assert.equal(reopenedLog.verify().valid, true);
      assert.equal(reopenedStore.isArchived(0), true);
      assert.equal(reopenedStore.isArchived(1), false);
      assert.equal(reopenedStore.size, 1);
    } finally {
      reopenedStore.close();
      reopenedLog.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
