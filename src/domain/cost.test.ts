/** Unit tests for cost record / work hour domain (ServiceHub S-05). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createCostRecord, createWorkHour } from "./cost.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("cost record domain creates a record with budgeted and actual amounts", () => {
  const ok = createCostRecord({
    id: "cr-1",
    organizationId: "org",
    projectId: "p-1",
    recordDate: "2026-08-07",
    category: "materials",
    description: "鉄筋 D19 x 500本",
    budgetedAmount: 1000000,
    actualAmount: 950000,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.category, "materials");
  assert.equal(ok.value.budgetedAmount, 1000000);
  assert.equal(ok.value.actualAmount, 950000);
  assert.equal(ok.value.description, "鉄筋 D19 x 500本");
});

test("cost record domain validates recordDate as YYYY-MM-DD", () => {
  const ok = createCostRecord({
    id: "cr-date",
    organizationId: "org",
    projectId: "p-1",
    recordDate: "2026-08-07",
    category: "labor",
    description: "人件費",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);

  const bad = createCostRecord({
    id: "cr-bad-date",
    organizationId: "org",
    projectId: "p-1",
    recordDate: "invalid",
    category: "labor",
    description: "test",
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("cost record domain validates amounts are non-negative finite", () => {
  assert.ok(
    !createCostRecord({
      id: "cr-neg",
      organizationId: "org",
      projectId: "p-1",
      recordDate: "2026-08-07",
      category: "labor",
      description: "test",
      budgetedAmount: -1,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createCostRecord({
      id: "cr-nan",
      organizationId: "org",
      projectId: "p-1",
      recordDate: "2026-08-07",
      category: "labor",
      description: "test",
      actualAmount: Number.NaN,
      createdAt: NOW as never,
    }).ok,
  );
});

test("cost record domain rejects empty required fields", () => {
  assert.ok(
    !createCostRecord({
      id: "",
      organizationId: "org",
      projectId: "p-1",
      recordDate: "2026-08-07",
      category: "x",
      description: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createCostRecord({
      id: "cr",
      organizationId: "org",
      projectId: "p-1",
      recordDate: "2026-08-07",
      category: "",
      description: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createCostRecord({
      id: "cr",
      organizationId: "org",
      projectId: "p-1",
      recordDate: "2026-08-07",
      category: "x",
      description: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("cost record domain stores optional vendor and invoice", () => {
  const r = createCostRecord({
    id: "cr-full",
    organizationId: "org",
    projectId: "p-1",
    recordDate: "2026-08-07",
    category: "materials",
    description: "型枠材",
    budgetedAmount: 500000,
    actualAmount: 480000,
    vendorName: "建材商事株式会社",
    invoiceNumber: "INV-2026-0801",
    notes: "納品済み・検収完了",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.vendorName, "建材商事株式会社");
  assert.equal(r.value.invoiceNumber, "INV-2026-0801");
  assert.equal(r.value.notes, "納品済み・検収完了");
  assert.equal(r.value.updatedAt, NOW);
});

test("cost record domain defaults amounts to 0 when not provided", () => {
  const r = createCostRecord({
    id: "cr-defaults",
    organizationId: "org",
    projectId: "p-1",
    recordDate: "2026-08-07",
    category: "equipment",
    description: "重機リース",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.budgetedAmount, 0);
  assert.equal(r.value.actualAmount, 0);
});

test("work hour domain creates a work hour with number in range", () => {
  const ok = createWorkHour({
    id: "wh-1",
    organizationId: "org",
    projectId: "p-1",
    workDate: "2026-08-07",
    hours: 8,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.hours, 8);
  assert.equal(ok.value.workDate, "2026-08-07");
});

test("work hour domain validates hours between 0 and 24", () => {
  assert.ok(
    createWorkHour({
      id: "wh-0",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-07",
      hours: 0,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    createWorkHour({
      id: "wh-24",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-07",
      hours: 24,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkHour({
      id: "wh-25",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-07",
      hours: 25,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createWorkHour({
      id: "wh-neg",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-07",
      hours: -1,
      createdAt: NOW as never,
    }).ok,
  );
});

test("work hour domain validates workDate format", () => {
  assert.ok(
    !createWorkHour({
      id: "wh-bad-date",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026/08/07",
      hours: 8,
      createdAt: NOW as never,
    }).ok,
  );
});

test("work hour domain stores optional workerId and workType", () => {
  const r = createWorkHour({
    id: "wh-full",
    organizationId: "org",
    projectId: "p-1",
    workerId: "worker-1",
    workDate: "2026-08-07",
    hours: 7.5,
    workType: "overtime",
    notes: "残業・法定休日割増",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.workerId, "worker-1");
  assert.equal(r.value.hours, 7.5);
  assert.equal(r.value.workType, "overtime");
  assert.equal(r.value.updatedAt, NOW);
});
