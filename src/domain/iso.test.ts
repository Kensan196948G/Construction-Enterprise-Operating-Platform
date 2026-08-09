/** Unit tests for the ISO integrated-management domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { applyIsoAction, createIsoRecord, isoAnalytics, updateIsoRecord } from "./iso.ts";

const NOW = "2026-08-09T06:00:00.000Z" as never;

function base(kind: "quality-plan" | "asset" | "corrective-action" | "bim-bep" | "audit-plan") {
  return {
    id: `iso-${kind}`,
    kind,
    organizationId: "org-hq",
    projectId: kind === "bim-bep" ? "project-1" : undefined,
    title: "テスト",
    createdBy: "user-1",
    createdAt: NOW,
  };
}

test("createIsoRecord validates kind, status, project requirement, and payload", () => {
  const ok = createIsoRecord({
    ...base("quality-plan"),
    projectId: "project-1",
    payload: { title: "plan" },
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.status, "draft");

  const badKind = createIsoRecord({ ...base("quality-plan"), kind: "nope" as never });
  assert.ok(!badKind.ok);

  const missingProject = createIsoRecord({ ...base("bim-bep"), projectId: undefined });
  assert.ok(!missingProject.ok);

  const missingPayload = createIsoRecord({ ...base("asset"), payload: { assetType: "" } });
  assert.ok(!missingPayload.ok);
});

test("updateIsoRecord merges payload, validates, and bumps version", () => {
  const created = createIsoRecord({
    ...base("asset"),
    payload: { name: "橋梁A", assetType: "structure" },
  });
  assert.ok(created.ok);
  const updated = updateIsoRecord(created.value, { category: "橋梁" }, NOW);
  assert.ok(updated.ok);
  assert.equal(updated.value.payload["category"], "橋梁");
  assert.equal(updated.value.versionNo, 2);
});

test("applyIsoAction enforces status transitions and records approver", () => {
  const created = createIsoRecord({
    ...base("corrective-action"),
    payload: { sourceType: "audit_finding", description: "d" },
  });
  assert.ok(created.ok);
  const started = applyIsoAction(created.value, "start", "user-2", NOW);
  assert.ok(started.ok);
  assert.equal(started.value.status, "in_progress");
  const closed = applyIsoAction(started.value, "close", "user-3", NOW);
  assert.ok(closed.ok);
  assert.equal(closed.value.payload["closedBy"], "user-3");
  const bad = applyIsoAction(closed.value, "approve", "user-3", NOW);
  assert.ok(!bad.ok);
});

test("isoAnalytics counts kinds, statuses, open and overdue records", () => {
  const a = createIsoRecord({ ...base("quality-plan"), projectId: "p1" });
  const b = createIsoRecord({
    ...base("corrective-action"),
    payload: { sourceType: "audit", description: "x", dueDate: "2020-01-01" },
  });
  assert.ok(a.ok && b.ok);
  const analytics = isoAnalytics([a.value, b.value]);
  assert.equal(analytics.total, 2);
  assert.equal(analytics.byKind["quality-plan"], 1);
  assert.equal(analytics.open, 2);
  assert.equal(analytics.overdue, 1);
});
