/** Unit tests for the site inspection domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { INSPECTION_RESULTS, createInspection, updateInspection } from "./inspection.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("inspection creates with defaults and pending result", () => {
  const r = createInspection({
    id: "i-1",
    organizationId: "org",
    projectId: "p-1",
    title: "鉄筋検査",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.result, "pending");
  assert.deepEqual(r.value.checklistItems, []);
});

test("inspection derives result from checklist items", () => {
  const pass = createInspection({
    id: "i-pass",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    checklistItems: [
      { label: "a", passed: true },
      { label: "b", passed: true },
    ],
    createdAt: NOW as never,
  });
  assert.ok(pass.ok);
  assert.equal(pass.value.result, "pass");

  const fail = createInspection({
    id: "i-fail",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    checklistItems: [
      { label: "a", passed: true },
      { label: "b", passed: false },
    ],
    createdAt: NOW as never,
  });
  assert.ok(fail.ok);
  assert.equal(fail.value.result, "fail");
});

test("inspection explicit result is used only when no checklist items exist", () => {
  const r = createInspection({
    id: "i-2",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    result: "fail",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.result, "fail");

  // When checklist items exist, the overall result is derived from them.
  const derived = createInspection({
    id: "i-3",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    result: "fail",
    checklistItems: [{ label: "a", passed: true }],
    createdAt: NOW as never,
  });
  assert.ok(derived.ok);
  assert.equal(derived.value.result, "pass");
});

test("inspection validates required fields and statuses", () => {
  assert.ok(
    !createInspection({
      id: "",
      organizationId: "org",
      projectId: "p",
      title: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createInspection({
      id: "i",
      organizationId: "org",
      projectId: "p",
      title: "",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createInspection({
      id: "i",
      organizationId: "org",
      projectId: "p",
      title: "x",
      result: "bogus" as never,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createInspection({
      id: "i",
      organizationId: "org",
      projectId: "p",
      title: "x",
      checklistItems: [{ label: "", passed: true }],
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createInspection({
      id: "i",
      organizationId: "org",
      projectId: "p",
      title: "x",
      inspectedAt: "2026/08/10",
      createdAt: NOW as never,
    }).ok,
  );
});

test("inspection update merges and re-derives result", () => {
  const base = createInspection({
    id: "i-1",
    organizationId: "org",
    projectId: "p-1",
    title: "鉄筋検査",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateInspection(base.value, {
    checklistItems: [{ label: "a", passed: true }],
    inspectorId: "user-q",
    inspectedAt: "2026-08-16",
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.result, "pass");
  assert.equal(updated.value.inspectorId, "user-q");
});

test("inspection update rejects invalid checklist and status", () => {
  const base = createInspection({
    id: "i-1",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateInspection(base.value, {
      checklistItems: [{ label: "", passed: true }],
      updatedAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !updateInspection(base.value, { result: "bogus" as never, updatedAt: NOW as never }).ok,
  );
});

test("inspection result enum is stable", () => {
  assert.deepEqual(INSPECTION_RESULTS, ["pass", "fail", "pending"]);
});
