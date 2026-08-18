/** Unit tests for the supplier evaluation domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUPPLIER_EVALUATION_STATUSES,
  createSupplierEvaluation,
  updateSupplierEvaluation,
} from "./supplier.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("supplier evaluation creates with defaults", () => {
  const r = createSupplierEvaluation({
    id: "s-1",
    organizationId: "org",
    supplierName: "デモ生コン",
    evaluationDate: "2026-07-01",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "pending");
  assert.equal(r.value.supplierName, "デモ生コン");
});

test("supplier evaluation accepts all statuses", () => {
  for (const status of SUPPLIER_EVALUATION_STATUSES) {
    const r = createSupplierEvaluation({
      id: `s-${status}`,
      organizationId: "org",
      supplierName: "x",
      status,
      evaluationDate: "2026-07-01",
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
  }
});

test("supplier evaluation validates score and dates", () => {
  assert.ok(
    !createSupplierEvaluation({
      id: "s",
      organizationId: "org",
      supplierName: "",
      evaluationDate: "2026-07-01",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createSupplierEvaluation({
      id: "s",
      organizationId: "org",
      supplierName: "x",
      evaluationDate: "",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createSupplierEvaluation({
      id: "s",
      organizationId: "org",
      supplierName: "x",
      evaluationDate: "2026-07-01",
      score: 101,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createSupplierEvaluation({
      id: "s",
      organizationId: "org",
      supplierName: "x",
      evaluationDate: "2026-07-01",
      score: 1.5,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createSupplierEvaluation({
      id: "s",
      organizationId: "org",
      supplierName: "x",
      evaluationDate: "2026-07-01",
      nextEvaluationDate: "2026/08/01",
      createdAt: NOW as never,
    }).ok,
  );
});

test("supplier evaluation update merges fields", () => {
  const base = createSupplierEvaluation({
    id: "s-1",
    organizationId: "org",
    supplierName: "デモ生コン",
    evaluationDate: "2026-07-01",
    score: 80,
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateSupplierEvaluation(base.value, {
    status: "approved",
    score: 92,
    notes: "良好",
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.status, "approved");
  assert.equal(updated.value.score, 92);
  assert.equal(updated.value.notes, "良好");
});

test("supplier evaluation update rejects invalid values", () => {
  const base = createSupplierEvaluation({
    id: "s-1",
    organizationId: "org",
    supplierName: "x",
    evaluationDate: "2026-07-01",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateSupplierEvaluation(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok,
  );
  assert.ok(!updateSupplierEvaluation(base.value, { score: -1, updatedAt: NOW as never }).ok);
});
