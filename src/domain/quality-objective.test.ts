/** Unit tests for the quality objective domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUALITY_OBJECTIVE_STATUSES,
  createQualityObjective,
  updateQualityObjective,
} from "./quality-objective.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("quality objective creates with defaults", () => {
  const r = createQualityObjective({
    id: "q-1",
    organizationId: "org",
    title: "合格率 100%",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "active");
});

test("quality objective accepts all statuses", () => {
  for (const status of QUALITY_OBJECTIVE_STATUSES) {
    const r = createQualityObjective({
      id: `q-${status}`,
      organizationId: "org",
      title: "x",
      status,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
  }
});

test("quality objective validates numbers and dates", () => {
  assert.ok(
    !createQualityObjective({ id: "", organizationId: "org", title: "x", createdAt: NOW as never })
      .ok,
  );
  assert.ok(
    !createQualityObjective({ id: "q", organizationId: "", title: "x", createdAt: NOW as never })
      .ok,
  );
  assert.ok(
    !createQualityObjective({ id: "q", organizationId: "org", title: "", createdAt: NOW as never })
      .ok,
  );
  assert.ok(
    !createQualityObjective({
      id: "q",
      organizationId: "org",
      title: "x",
      baseline: Number.NaN,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createQualityObjective({
      id: "q",
      organizationId: "org",
      title: "x",
      dueDate: "2026/12/31",
      createdAt: NOW as never,
    }).ok,
  );
});

test("quality objective keeps optional fields", () => {
  const r = createQualityObjective({
    id: "q-2",
    organizationId: "org",
    title: "目標",
    isoClause: "6.2",
    target: "合格率",
    unit: "%",
    baseline: 98,
    targetValue: 100,
    dueDate: "2026-12-31",
    ownerId: "user-1",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.targetValue, 100);
  assert.equal(r.value.isoClause, "6.2");
});

test("quality objective update merges", () => {
  const base = createQualityObjective({
    id: "q-1",
    organizationId: "org",
    title: "合格率 100%",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateQualityObjective(base.value, {
    status: "achieved",
    targetValue: 100,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.status, "achieved");
  assert.equal(updated.value.targetValue, 100);
});

test("quality objective update rejects invalid", () => {
  const base = createQualityObjective({
    id: "q-1",
    organizationId: "org",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateQualityObjective(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok,
  );
  assert.ok(
    !updateQualityObjective(base.value, { baseline: Number.NaN, updatedAt: NOW as never }).ok,
  );
});
