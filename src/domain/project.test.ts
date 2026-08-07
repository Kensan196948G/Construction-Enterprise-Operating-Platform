/** Unit tests for the project domain (S-01). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createProject, updateProject } from "./project.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("createProject accepts a valid project with defaults", () => {
  const result = createProject({
    id: "project-1",
    organizationId: "org-hq",
    projectCode: "P-2026-001",
    name: "田町再開発",
    clientName: "みらい建設工業",
    budget: 1_000_000,
    startDate: "2026-09-01",
    endDate: "2027-03-31",
    createdAt: NOW as never,
  });
  assert.ok(result.ok);
  assert.equal(result.value.status, "planning");
  assert.equal(result.value.budget, 1_000_000);
});

test("createProject rejects invalid code, dates, budget, and status", () => {
  const badCode = createProject({
    id: "p",
    organizationId: "org",
    projectCode: "あいう",
    name: "n",
    createdAt: NOW as never,
  });
  assert.ok(!badCode.ok);

  const badDate = createProject({
    id: "p2",
    organizationId: "org",
    projectCode: "P2",
    name: "n",
    startDate: "2026-02-30",
    createdAt: NOW as never,
  });
  assert.ok(!badDate.ok);

  const reversed = createProject({
    id: "p3",
    organizationId: "org",
    projectCode: "P3",
    name: "n",
    startDate: "2027-01-01",
    endDate: "2026-01-01",
    createdAt: NOW as never,
  });
  assert.ok(!reversed.ok);

  const badBudget = createProject({
    id: "p4",
    organizationId: "org",
    projectCode: "P4",
    name: "n",
    budget: -1,
    createdAt: NOW as never,
  });
  assert.ok(!badBudget.ok);

  const badStatus = createProject({
    id: "p5",
    organizationId: "org",
    projectCode: "P5",
    name: "n",
    status: "exploded" as never,
    createdAt: NOW as never,
  });
  assert.ok(!badStatus.ok);
});

test("updateProject merges fields and revalidates", () => {
  const created = createProject({
    id: "p6",
    organizationId: "org",
    projectCode: "P6",
    name: "n",
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const updated = updateProject(created.value, {
    status: "in_progress",
    budget: 500,
    updatedAt: "2026-08-07T07:00:00.000Z" as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.status, "in_progress");
  assert.equal(updated.value.budget, 500);

  const invalid = updateProject(created.value, {
    budget: -5,
    updatedAt: "2026-08-07T07:00:00.000Z" as never,
  });
  assert.ok(!invalid.ok);
});
