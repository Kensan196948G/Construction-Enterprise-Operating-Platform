import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createPurchaseOrder } from "../../src/domain/purchase-order.ts";

interface BoundaryDataset {
  readonly version: string;
  readonly cases: readonly {
    readonly id: string;
    readonly quantity: number | null;
    readonly unitPrice: number;
    readonly accepted: boolean;
  }[];
}

const dataset = JSON.parse(
  readFileSync(new URL("../../testdata/boundary/purchase-orders.v1.json", import.meta.url), "utf8"),
) as BoundaryDataset;

for (const fixture of dataset.cases) {
  test(`QA-BOUNDARY-${fixture.id}: purchase order boundary result is stable`, () => {
    const result = createPurchaseOrder({
      id: fixture.id,
      organizationId: "org-boundary",
      projectId: "project-boundary",
      orderNumber: `PO-${fixture.id}`,
      supplier: "supplier",
      item: "item",
      quantity: fixture.quantity as number,
      unitPrice: fixture.unitPrice,
      createdAt: "2026-09-12T00:00:00.000Z" as never,
    });
    assert.equal(result.ok, fixture.accepted);
  });
}
