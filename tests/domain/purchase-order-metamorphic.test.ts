import assert from "node:assert/strict";
import { test } from "node:test";
import { createPurchaseOrder } from "../../src/domain/purchase-order.ts";
import { withinTolerance } from "../helpers/evidence.ts";

const NOW = "2026-09-12T00:00:00.000Z";

test("QA-META-001: scaling quantity scales purchase order amount by the same factor", () => {
  const quantities = [0, 0.5, 1, 7.25, 1000];
  const prices = [0, 1, 123.45, 999999.99];
  const factors = [0, 0.5, 2, 10];
  for (const quantity of quantities) {
    for (const unitPrice of prices) {
      const base = createPurchaseOrder({
        id: "base",
        organizationId: "org",
        projectId: "project",
        orderNumber: "PO-base",
        supplier: "supplier",
        item: "item",
        quantity,
        unitPrice,
        createdAt: NOW as never,
      });
      assert.ok(base.ok);
      for (const factor of factors) {
        const transformed = createPurchaseOrder({
          id: "transformed",
          organizationId: "org",
          projectId: "project",
          orderNumber: "PO-transformed",
          supplier: "supplier",
          item: "item",
          quantity: quantity * factor,
          unitPrice,
          createdAt: NOW as never,
        });
        assert.ok(transformed.ok);
        assert.ok(withinTolerance(transformed.value.amount, base.value.amount * factor, 0.000001));
      }
    }
  }
});
