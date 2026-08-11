/** Unit tests for site work schedule domain (Enterprise-OS E-02). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorkSchedule } from "./work-schedule.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("work schedule domain creates a planned schedule with defaults", () => {
  const ok = createWorkSchedule({
    id: "ws-1",
    organizationId: "org",
    projectId: "p-1",
    workDate: "2026-08-10",
    title: "基礎工事",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.status, "planned");
  assert.equal(ok.value.workDate, "2026-08-10");
  assert.equal(ok.value.title, "基礎工事");
});

test("work schedule domain accepts all statuses", () => {
  for (const s of ["planned", "in_progress", "completed", "cancelled"] as const) {
    const r = createWorkSchedule({
      id: `ws-${s}`,
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-10",
      title: "test",
      status: s,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `status ${s} should be valid`);
    assert.equal(r.value.status, s);
  }
});

test("work schedule domain validates workDate format (YYYY-MM-DD)", () => {
  assert.ok(
    !createWorkSchedule({
      id: "ws-bad",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026/08/10",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkSchedule({
      id: "ws-bad2",
      organizationId: "org",
      projectId: "p-1",
      workDate: "",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkSchedule({
      id: "ws-bad3",
      organizationId: "org",
      projectId: "p-1",
      workDate: "invalid",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
});

test("work schedule domain rejects empty required fields", () => {
  assert.ok(
    !createWorkSchedule({
      id: "",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-10",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkSchedule({
      id: "ws",
      organizationId: "",
      projectId: "p-1",
      workDate: "2026-08-10",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkSchedule({
      id: "ws",
      organizationId: "org",
      projectId: "",
      workDate: "2026-08-10",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkSchedule({
      id: "ws",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-10",
      title: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("work schedule domain preserves optional assignee and notes", () => {
  const r = createWorkSchedule({
    id: "ws-full",
    organizationId: "org",
    projectId: "p-1",
    workDate: "2026-08-10",
    title: "型枠組立",
    assignee: "worker-1",
    status: "in_progress",
    notes: "天候注意",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.assignee, "worker-1");
  assert.equal(r.value.notes, "天候注意");
  assert.equal(r.value.status, "in_progress");
  assert.equal(r.value.updatedAt, NOW);
});
