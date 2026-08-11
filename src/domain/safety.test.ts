/** Unit tests for safety check / quality inspection domain (ServiceHub S-04). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createSafetyCheck, createQualityInspection } from "./safety.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("safety check domain creates a check with proper item arithmetic", () => {
  const ok = createSafetyCheck({
    id: "sc-1",
    organizationId: "org",
    projectId: "p-1",
    checkDate: "2026-08-07",
    itemsTotal: 10,
    itemsOk: 8,
    itemsNg: 2,
    overallResult: "ok",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.itemsTotal, 10);
  assert.equal(ok.value.itemsOk, 8);
  assert.equal(ok.value.itemsNg, 2);
  assert.equal(ok.value.overallResult, "ok");
  assert.equal(ok.value.checkType, "daily");
});

test("safety check domain accepts all check types and results", () => {
  for (const t of ["daily", "patrol", "ky", "other"] as const) {
    const r = createSafetyCheck({
      id: `sc-type-${t}`,
      organizationId: "org",
      projectId: "p-1",
      checkDate: "2026-08-07",
      checkType: t,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `type ${t} should be valid`);
    assert.equal(r.value.checkType, t);
  }
  for (const result of ["pending", "ok", "ng"] as const) {
    const r = createSafetyCheck({
      id: `sc-result-${result}`,
      organizationId: "org",
      projectId: "p-1",
      checkDate: "2026-08-07",
      overallResult: result,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `result ${result} should be valid`);
    assert.equal(r.value.overallResult, result);
  }
});

test("safety check domain validates itemsOk + itemsNg <= itemsTotal", () => {
  const bad = createSafetyCheck({
    id: "sc-bad",
    organizationId: "org",
    projectId: "p-1",
    checkDate: "2026-08-07",
    itemsTotal: 5,
    itemsOk: 3,
    itemsNg: 3,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);

  const ok = createSafetyCheck({
    id: "sc-ok",
    organizationId: "org",
    projectId: "p-1",
    checkDate: "2026-08-07",
    itemsTotal: 5,
    itemsOk: 3,
    itemsNg: 2,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
});

test("safety check domain validates dates and non-negative items", () => {
  assert.ok(
    !createSafetyCheck({
      id: "sc-bad-date",
      organizationId: "org",
      projectId: "p-1",
      checkDate: "invalid",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createSafetyCheck({
      id: "sc-neg-items",
      organizationId: "org",
      projectId: "p-1",
      checkDate: "2026-08-07",
      itemsTotal: -1,
      createdAt: NOW as never,
    }).ok,
  );
});

test("safety check domain stores optional notes and inspector", () => {
  const r = createSafetyCheck({
    id: "sc-full",
    organizationId: "org",
    projectId: "p-1",
    checkDate: "2026-08-07",
    checkType: "patrol",
    itemsTotal: 5,
    itemsOk: 4,
    itemsNg: 1,
    overallResult: "ok",
    notes: "足場注意",
    inspectorId: "inspector-1",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.notes, "足場注意");
  assert.equal(r.value.inspectorId, "inspector-1");
  assert.equal(r.value.updatedAt, NOW);
});

test("quality inspection domain creates an inspection with all fields", () => {
  const ok = createQualityInspection({
    id: "qi-1",
    organizationId: "org",
    projectId: "p-1",
    inspectionDate: "2026-08-07",
    inspectionType: "concrete",
    targetItem: "A-1 slab",
    result: "pass",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.inspectionType, "concrete");
  assert.equal(ok.value.targetItem, "A-1 slab");
  assert.equal(ok.value.result, "pass");
});

test("quality inspection domain validates date and required fields", () => {
  assert.ok(
    !createQualityInspection({
      id: "qi-bad-date",
      organizationId: "org",
      projectId: "p-1",
      inspectionDate: "",
      inspectionType: "c",
      targetItem: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createQualityInspection({
      id: "qi",
      organizationId: "org",
      projectId: "p-1",
      inspectionDate: "2026-08-07",
      inspectionType: "",
      targetItem: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createQualityInspection({
      id: "qi",
      organizationId: "org",
      projectId: "p-1",
      inspectionDate: "2026-08-07",
      inspectionType: "c",
      targetItem: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("quality inspection domain stores standard/measured values", () => {
  const r = createQualityInspection({
    id: "qi-full",
    organizationId: "org",
    projectId: "p-1",
    inspectionDate: "2026-08-07",
    inspectionType: "concrete",
    targetItem: "compressive strength",
    standardValue: "18 N/mm²",
    measuredValue: "20.5 N/mm²",
    result: "pass",
    notes: "基準値超過・合格",
    inspectorId: "inspector-2",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.standardValue, "18 N/mm²");
  assert.equal(r.value.measuredValue, "20.5 N/mm²");
  assert.equal(r.value.inspectorId, "inspector-2");
});
