/** Unit tests for labor attendance domain (HR — issue #74). */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createLaborAttendance,
  transitionLaborAttendance,
  updateLaborAttendance,
} from "./labor-attendance.ts";

const NOW = "2026-09-01T00:00:00.000Z";

test("labor attendance domain creates an in-house record with defaults", () => {
  const r = createLaborAttendance({
    id: "la-1",
    organizationId: "org",
    projectId: "p-1",
    workerName: "山田太郎",
    attendanceDate: "2026-09-01",
    dailyRate: 15000,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.affiliation, "in_house");
  assert.equal(r.value.overtimeHours, 0);
  assert.equal(r.value.status, "draft");
  assert.equal(r.value.workerName, "山田太郎");
  assert.equal(r.value.updatedAt, NOW);
});

test("labor attendance domain requires subcontractorName when affiliation is subcontractor", () => {
  const missing = createLaborAttendance({
    id: "la-2",
    organizationId: "org",
    projectId: "p-1",
    workerName: "鈴木一郎",
    affiliation: "subcontractor",
    attendanceDate: "2026-09-01",
    dailyRate: 18000,
    createdAt: NOW as never,
  });
  assert.ok(!missing.ok);

  const ok = createLaborAttendance({
    id: "la-3",
    organizationId: "org",
    projectId: "p-1",
    workerName: "鈴木一郎",
    affiliation: "subcontractor",
    subcontractorName: "協力建設株式会社",
    attendanceDate: "2026-09-01",
    dailyRate: 18000,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.subcontractorName, "協力建設株式会社");
});

test("labor attendance domain validates attendanceDate format", () => {
  assert.ok(
    !createLaborAttendance({
      id: "la-bad-date",
      organizationId: "org",
      projectId: "p-1",
      workerName: "test",
      attendanceDate: "2026/09/01",
      dailyRate: 10000,
      createdAt: NOW as never,
    }).ok,
  );
});

test("labor attendance domain validates dailyRate is a non-negative finite number", () => {
  assert.ok(
    !createLaborAttendance({
      id: "la-neg",
      organizationId: "org",
      projectId: "p-1",
      workerName: "test",
      attendanceDate: "2026-09-01",
      dailyRate: -1,
      createdAt: NOW as never,
    }).ok,
  );
});

test("labor attendance domain validates overtimeHours between 0 and 24", () => {
  assert.ok(
    createLaborAttendance({
      id: "la-ot-0",
      organizationId: "org",
      projectId: "p-1",
      workerName: "test",
      attendanceDate: "2026-09-01",
      dailyRate: 10000,
      overtimeHours: 0,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    createLaborAttendance({
      id: "la-ot-24",
      organizationId: "org",
      projectId: "p-1",
      workerName: "test",
      attendanceDate: "2026-09-01",
      dailyRate: 10000,
      overtimeHours: 24,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createLaborAttendance({
      id: "la-ot-25",
      organizationId: "org",
      projectId: "p-1",
      workerName: "test",
      attendanceDate: "2026-09-01",
      dailyRate: 10000,
      overtimeHours: 25,
      createdAt: NOW as never,
    }).ok,
  );
});

test("labor attendance domain rejects empty required fields", () => {
  assert.ok(
    !createLaborAttendance({
      id: "",
      organizationId: "org",
      projectId: "p-1",
      workerName: "test",
      attendanceDate: "2026-09-01",
      dailyRate: 10000,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createLaborAttendance({
      id: "la",
      organizationId: "org",
      projectId: "p-1",
      workerName: "",
      attendanceDate: "2026-09-01",
      dailyRate: 10000,
      createdAt: NOW as never,
    }).ok,
  );
});

test("updateLaborAttendance updates mutable fields without touching status", () => {
  const created = createLaborAttendance({
    id: "la-update",
    organizationId: "org",
    projectId: "p-1",
    workerName: "山田太郎",
    attendanceDate: "2026-09-01",
    dailyRate: 15000,
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const updated = updateLaborAttendance(created.value, {
    dailyRate: 16000,
    overtimeHours: 2,
    notes: "残業対応",
    updatedAt: "2026-09-02T00:00:00.000Z" as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.dailyRate, 16000);
  assert.equal(updated.value.overtimeHours, 2);
  assert.equal(updated.value.notes, "残業対応");
  assert.equal(updated.value.status, "draft");
});

test("updateLaborAttendance requires subcontractorName if switching affiliation to subcontractor", () => {
  const created = createLaborAttendance({
    id: "la-switch",
    organizationId: "org",
    projectId: "p-1",
    workerName: "山田太郎",
    attendanceDate: "2026-09-01",
    dailyRate: 15000,
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const bad = updateLaborAttendance(created.value, {
    affiliation: "subcontractor",
    updatedAt: NOW as never,
  });
  assert.ok(!bad.ok);
  const good = updateLaborAttendance(created.value, {
    affiliation: "subcontractor",
    subcontractorName: "協力建設株式会社",
    updatedAt: NOW as never,
  });
  assert.ok(good.ok);
});

test("transitionLaborAttendance follows draft -> submitted -> approved lifecycle", () => {
  const created = createLaborAttendance({
    id: "la-flow",
    organizationId: "org",
    projectId: "p-1",
    workerName: "山田太郎",
    attendanceDate: "2026-09-01",
    dailyRate: 15000,
    createdAt: NOW as never,
  });
  assert.ok(created.ok);

  const submitted = transitionLaborAttendance(created.value, "submitted", NOW as never);
  assert.ok(submitted.ok);
  assert.equal(submitted.value.status, "submitted");

  const approved = transitionLaborAttendance(submitted.value, "approved", NOW as never);
  assert.ok(approved.ok);
  assert.equal(approved.value.status, "approved");

  const invalid = transitionLaborAttendance(approved.value, "draft", NOW as never);
  assert.ok(!invalid.ok);
});

test("transitionLaborAttendance allows rejected -> draft resubmission", () => {
  const created = createLaborAttendance({
    id: "la-reject",
    organizationId: "org",
    projectId: "p-1",
    workerName: "山田太郎",
    attendanceDate: "2026-09-01",
    dailyRate: 15000,
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const submitted = transitionLaborAttendance(created.value, "submitted", NOW as never);
  assert.ok(submitted.ok);
  const rejected = transitionLaborAttendance(submitted.value, "rejected", NOW as never);
  assert.ok(rejected.ok);
  assert.equal(rejected.value.status, "rejected");
  const backToDraft = transitionLaborAttendance(rejected.value, "draft", NOW as never);
  assert.ok(backToDraft.ok);
  assert.equal(backToDraft.value.status, "draft");
});
