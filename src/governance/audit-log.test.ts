import { test } from "node:test";
import assert from "node:assert/strict";

import {
  type AuditEvent,
  type IsoTimestamp,
  type Result,
  createAuditEvent,
  toIsoTimestamp,
} from "../domain/index.ts";
import { AuditLog } from "./audit-log.ts";

function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

const AT: IsoTimestamp = unwrap(toIsoTimestamp("2026-06-25T00:00:00.000Z"));

function event(id: string, outcome: AuditEvent["outcome"] = "success"): AuditEvent {
  return unwrap(
    createAuditEvent({ id, at: AT, actor: "u1", action: "read", resource: "application", outcome }),
  );
}

test("append chains entries and exposes a read-only snapshot", () => {
  const log = new AuditLog();
  const first = log.append(event("e1"));
  const second = log.append(event("e2"));

  assert.equal(log.size, 2);
  assert.equal(first.sequence, 0);
  assert.equal(second.sequence, 1);
  assert.equal(second.previousHash, first.hash);
  assert.notEqual(first.hash, second.hash);
});

test("the snapshot returned by entries does not mutate the log", () => {
  const log = new AuditLog();
  log.append(event("e1"));
  const snapshot = log.entries;
  (snapshot as AuditLog["entries"][number][]).push(snapshot[0]!);
  assert.equal(log.size, 1);
});

test("verify accepts an untampered chain", () => {
  const log = new AuditLog();
  log.append(event("e1"));
  log.append(event("e2", "denied"));
  log.append(event("e3", "failure"));
  assert.deepEqual(log.verify(), { valid: true });
});

test("verify detects tampering with a recorded event", () => {
  const log = new AuditLog();
  log.append(event("e1"));
  log.append(event("e2"));

  // Simulate out-of-band mutation of evidence by overwriting the stored hash
  // directly. metadata is now frozen (Object.freeze), so hash mutation is the
  // canonical tampering path for the in-memory log.
  const tampered = log.entries[1]!;
  (tampered as { hash: string }).hash = "00000000tampered";

  const report = log.verify();
  assert.equal(report.valid, false);
  assert.equal(report.brokenAt, 1);
});

test("query filters entries by predicate", () => {
  const log = new AuditLog();
  log.append(event("e1", "success"));
  log.append(event("e2", "denied"));
  log.append(event("e3", "denied"));

  const denied = log.query((entry) => entry.event.outcome === "denied");
  assert.equal(denied.length, 2);
  assert.deepEqual(
    denied.map((e) => e.event.id),
    ["e2", "e3"],
  );
});
