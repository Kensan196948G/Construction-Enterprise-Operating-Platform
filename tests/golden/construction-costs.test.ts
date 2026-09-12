import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { laborAttendanceCostAmount } from "../../src/domain/cost.ts";
import { createPurchaseOrder } from "../../src/domain/purchase-order.ts";
import { recordEvidence, withinTolerance } from "../helpers/evidence.ts";

interface CostDataset {
  readonly version: string;
  readonly purchaseOrders: readonly {
    readonly id: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly expectedAmount: number;
    readonly tolerance: number;
  }[];
  readonly laborCosts: readonly {
    readonly id: string;
    readonly dailyRate: number;
    readonly overtimeHours: number;
    readonly overtimeMultiplier: number;
    readonly expectedAmount: number;
    readonly tolerance: number;
  }[];
}

const dataset = JSON.parse(
  readFileSync(
    new URL("../../testdata/golden/construction-costs.v1.json", import.meta.url),
    "utf8",
  ),
) as CostDataset;
const NOW = "2026-09-12T00:00:00.000Z";

for (const fixture of dataset.purchaseOrders) {
  test(`QA-GOLD-PO-${fixture.id}: purchase order amount matches golden result`, () => {
    const result = createPurchaseOrder({
      id: fixture.id,
      organizationId: "org-golden",
      projectId: "project-golden",
      orderNumber: `PO-${fixture.id}`,
      supplier: "golden supplier",
      item: "golden item",
      quantity: fixture.quantity,
      unitPrice: fixture.unitPrice,
      createdAt: NOW as never,
    });
    assert.ok(result.ok);
    const passed = withinTolerance(result.value.amount, fixture.expectedAmount, fixture.tolerance);
    recordEvidence({
      requirementId: "QA-LOGIC-001",
      testId: `QA-GOLD-PO-${fixture.id}`,
      input: { quantity: fixture.quantity, unitPrice: fixture.unitPrice },
      expected: fixture.expectedAmount,
      actual: result.value.amount,
      tolerance: fixture.tolerance,
      testDataVersion: dataset.version,
      result: passed ? "pass" : "fail",
    });
    assert.ok(passed);
  });
}

for (const fixture of dataset.laborCosts) {
  test(`QA-GOLD-LABOR-${fixture.id}: labor amount matches golden result`, () => {
    const actual = laborAttendanceCostAmount(
      { dailyRate: fixture.dailyRate, overtimeHours: fixture.overtimeHours },
      { overtimeMultiplier: fixture.overtimeMultiplier },
    );
    const passed = withinTolerance(actual, fixture.expectedAmount, fixture.tolerance);
    recordEvidence({
      requirementId: "QA-LOGIC-002",
      testId: `QA-GOLD-LABOR-${fixture.id}`,
      input: fixture,
      expected: fixture.expectedAmount,
      actual,
      tolerance: fixture.tolerance,
      testDataVersion: dataset.version,
      result: passed ? "pass" : "fail",
    });
    assert.ok(passed);
  });
}
