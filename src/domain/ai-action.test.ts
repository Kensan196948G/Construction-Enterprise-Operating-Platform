/**
 * Unit tests for AI action governance domain (Y-09).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createAiAction, decideAiAction } from "./ai-action.ts";

const NOW = "2026-08-07T06:00:00.000Z";
const HASH = "a".repeat(64);

test("createAiAction produces a pending action with defaults", () => {
  const result = createAiAction({
    id: "ai-1",
    requester: "user-admin",
    organizationId: "org-hq",
    model: "deepseek:deepseek-chat",
    purpose: "incident summary",
    promptHash: HASH.toUpperCase(),
    createdAt: NOW as never,
  });
  assert.ok(result.ok);
  assert.equal(result.value.status, "pending");
  assert.equal(result.value.promptHash, HASH);
  assert.equal(result.value.decidedBy, undefined);
});

test("createAiAction rejects missing fields and malformed hash", () => {
  const missing = createAiAction({
    id: "ai-2",
    requester: "",
    model: "m",
    purpose: "p",
    promptHash: HASH,
    createdAt: NOW as never,
  });
  assert.ok(!missing.ok);
  const badHash = createAiAction({
    id: "ai-3",
    requester: "r",
    model: "m",
    purpose: "p",
    promptHash: "not-a-hash",
    createdAt: NOW as never,
  });
  assert.ok(!badHash.ok);
});

test("decideAiAction approves or rejects a pending action", () => {
  const created = createAiAction({
    id: "ai-4",
    requester: "r",
    model: "m",
    purpose: "p",
    promptHash: HASH,
    evidenceRefs: ["incident-1"],
    wrongAnswerMitigation: "human reviewer validates the summary",
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const approved = decideAiAction(created.value, {
    decision: "approved",
    decidedBy: "approver",
    decidedAt: "2026-08-07T07:00:00.000Z" as never,
    note: "ok",
  });
  assert.ok(approved.ok);
  assert.equal(approved.value.status, "approved");
  assert.equal(approved.value.decidedBy, "approver");

  const rejected = decideAiAction(created.value, {
    decision: "rejected",
    decidedBy: "approver",
    decidedAt: "2026-08-07T07:01:00.000Z" as never,
  });
  assert.ok(rejected.ok);
  assert.equal(rejected.value.status, "rejected");
});

test("decideAiAction rejects double decisions", () => {
  const created = createAiAction({
    id: "ai-5",
    requester: "r",
    model: "m",
    purpose: "p",
    promptHash: HASH,
    evidenceRefs: ["incident-1"],
    wrongAnswerMitigation: "human reviewer validates the summary",
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const first = decideAiAction(created.value, {
    decision: "approved",
    decidedBy: "a",
    decidedAt: "2026-08-07T07:00:00.000Z" as never,
  });
  assert.ok(first.ok);
  const second = decideAiAction(first.value, {
    decision: "rejected",
    decidedBy: "a",
    decidedAt: "2026-08-07T08:00:00.000Z" as never,
  });
  assert.ok(!second.ok);
});

test("decideAiAction fails closed when approval lacks grounding or mitigation", () => {
  const created = createAiAction({
    id: "ai-unsafe",
    requester: "r",
    model: "m",
    purpose: "p",
    promptHash: HASH,
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const result = decideAiAction(created.value, {
    decision: "approved",
    decidedBy: "approver",
    decidedAt: NOW as never,
  });
  assert.ok(!result.ok);
  assert.deepEqual(
    result.error.map((issue) => issue.path),
    ["evidenceRefs", "wrongAnswerMitigation"],
  );
});

test("createAiAction requires zero-day retention for PII-sensitive input", () => {
  const result = createAiAction({
    id: "ai-pii",
    requester: "r",
    model: "m",
    purpose: "p",
    promptHash: HASH,
    piiSensitive: true,
    inputRetentionDays: 30,
    createdAt: NOW as never,
  });
  assert.ok(!result.ok);
  assert.ok(result.error.some((issue) => issue.path === "inputRetentionDays"));
});
