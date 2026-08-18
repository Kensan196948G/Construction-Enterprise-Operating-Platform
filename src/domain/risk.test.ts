/** Unit tests for the risk domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { RISK_LEVELS, RISK_STATUSES, createRisk, matrixRiskLevel, updateRisk } from "./risk.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("risk creates with defaults and matrix level", () => {
  const r = createRisk({
    id: "r-1",
    organizationId: "org",
    title: "暑中コンクリート品質低下",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "identified");
  assert.equal(r.value.likelihood, 3);
  assert.equal(r.value.impact, 3);
  assert.equal(r.value.riskLevel, "medium");
});

test("risk matrix levels", () => {
  assert.equal(matrixRiskLevel(5, 5), "very_high");
  assert.equal(matrixRiskLevel(4, 4), "high");
  assert.equal(matrixRiskLevel(3, 3), "medium");
  assert.equal(matrixRiskLevel(2, 2), "low");
  assert.equal(matrixRiskLevel(1, 1), "very_low");
  assert.equal(matrixRiskLevel(5, 1), "low");
});

test("risk accepts all statuses and levels", () => {
  for (const status of RISK_STATUSES) {
    const r = createRisk({
      id: `r-${status}`,
      organizationId: "org",
      title: "x",
      status,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
  }
  for (const level of RISK_LEVELS) {
    const r = createRisk({
      id: `r-l-${level}`,
      organizationId: "org",
      title: "x",
      riskLevel: level,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${level} should be valid`);
  }
});

test("risk validates ratings", () => {
  assert.ok(
    !createRisk({
      id: "r",
      organizationId: "org",
      title: "x",
      likelihood: 0,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createRisk({
      id: "r",
      organizationId: "org",
      title: "x",
      likelihood: 6,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createRisk({
      id: "r",
      organizationId: "org",
      title: "x",
      impact: 2.5,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(!createRisk({ id: "r", organizationId: "org", title: "", createdAt: NOW as never }).ok);
  assert.ok(
    !createRisk({
      id: "r",
      organizationId: "org",
      title: "x",
      reviewDate: "bad",
      createdAt: NOW as never,
    }).ok,
  );
});

test("risk keeps optional fields", () => {
  const r = createRisk({
    id: "r-2",
    organizationId: "org",
    objectiveId: "q-1",
    title: "リスク",
    description: "desc",
    isoClause: "6.1",
    likelihood: 4,
    impact: 5,
    riskLevel: "very_high",
    status: "assessed",
    treatmentPlan: "plan",
    residualRisk: "低",
    ownerId: "user-1",
    reviewDate: "2026-08-31",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.objectiveId, "q-1");
  assert.equal(r.value.treatmentPlan, "plan");
});

test("risk update recomputes matrix when ratings change", () => {
  const base = createRisk({
    id: "r-1",
    organizationId: "org",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateRisk(base.value, {
    likelihood: 5,
    impact: 5,
    status: "mitigated",
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.riskLevel, "very_high");
  assert.equal(updated.value.status, "mitigated");
});

test("risk update rejects invalid", () => {
  const base = createRisk({
    id: "r-1",
    organizationId: "org",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(!updateRisk(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok);
  assert.ok(!updateRisk(base.value, { likelihood: 7, updatedAt: NOW as never }).ok);
});
