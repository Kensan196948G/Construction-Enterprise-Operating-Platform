/** Unit tests for the site work order domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { WORK_ORDER_STATUSES, createWorkOrder, updateWorkOrder } from "./work-order.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("work order domain creates with defaults", () => {
  const r = createWorkOrder({
    id: "wo-1",
    organizationId: "org",
    projectId: "p-1",
    title: "基礎配筋検査",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "pending");
  assert.equal(r.value.title, "基礎配筋検査");
});

test("work order accepts all statuses", () => {
  for (const status of WORK_ORDER_STATUSES) {
    const r = createWorkOrder({
      id: `wo-${status}`,
      organizationId: "org",
      projectId: "p-1",
      title: "test",
      status,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
    assert.equal(r.value.status, status);
  }
});

test("work order validates required fields", () => {
  assert.ok(
    !createWorkOrder({
      id: "",
      organizationId: "org",
      projectId: "p",
      title: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkOrder({
      id: "w",
      organizationId: "org",
      projectId: "",
      title: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkOrder({
      id: "w",
      organizationId: "org",
      projectId: "p",
      title: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("work order rejects bad status and dueDate", () => {
  assert.ok(
    !createWorkOrder({
      id: "w",
      organizationId: "org",
      projectId: "p",
      title: "x",
      status: "bogus" as never,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkOrder({
      id: "w",
      organizationId: "org",
      projectId: "p",
      title: "x",
      dueDate: "2026/08/10",
      createdAt: NOW as never,
    }).ok,
  );
});

test("work order update merges fields", () => {
  const base = createWorkOrder({
    id: "wo-1",
    organizationId: "org",
    projectId: "p-1",
    title: "基礎配筋検査",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateWorkOrder(base.value, {
    status: "completed",
    title: "基礎配筋検査（改）",
    completedAt: "2026-08-15T09:00:00.000Z" as never,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.status, "completed");
  assert.equal(updated.value.title, "基礎配筋検査（改）");
  assert.equal(updated.value.completedAt, "2026-08-15T09:00:00.000Z");
});

test("work order update rejects invalid status", () => {
  const base = createWorkOrder({
    id: "wo-1",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(!updateWorkOrder(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok);
});

test("work order update rejects invalid dueDate", () => {
  const base = createWorkOrder({
    id: "wo-1",
    organizationId: "org",
    projectId: "p-1",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(!updateWorkOrder(base.value, { dueDate: "not-a-date", updatedAt: NOW as never }).ok);
});

test("work order create trims title and keeps optional description", () => {
  const r = createWorkOrder({
    id: "wo-2",
    organizationId: "org",
    projectId: "p-1",
    title: "  配筋検査  ",
    description: "詳細",
    dueDate: "2026-08-20",
    assigneeId: "user-1",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.title, "配筋検査");
  assert.equal(r.value.description, "詳細");
  assert.equal(r.value.dueDate, "2026-08-20");
  assert.equal(r.value.assigneeId, "user-1");
});
