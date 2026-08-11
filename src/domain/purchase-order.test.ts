/** Unit tests for purchase order domain (Enterprise-OS E-05 / ERP). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createPurchaseOrder } from "./purchase-order.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("purchase order domain creates a draft order with computed amount", () => {
  const ok = createPurchaseOrder({
    id: "po-1",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-2026-001",
    supplier: "建材商事株式会社",
    item: "セメント 25kg",
    quantity: 100,
    unitPrice: 500,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.orderNumber, "PO-2026-001");
  assert.equal(ok.value.status, "draft");
  assert.equal(ok.value.amount, 50000); // quantity * unitPrice
  assert.equal(ok.value.quantity, 100);
  assert.equal(ok.value.unitPrice, 500);
});

test("purchase order domain accepts all statuses", () => {
  for (const s of ["draft", "issued", "approved", "received", "cancelled"] as const) {
    const r = createPurchaseOrder({
      id: `po-${s}`,
      organizationId: "org",
      projectId: "p-1",
      orderNumber: `PO-${s}`,
      supplier: "supplier",
      item: "item",
      quantity: 1,
      unitPrice: 100,
      status: s,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `status ${s} should be valid`);
    assert.equal(r.value.status, s);
  }
});

test("purchase order domain rejects invalid status", () => {
  const bad = createPurchaseOrder({
    id: "po-bad",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-bad",
    supplier: "s",
    item: "i",
    quantity: 1,
    unitPrice: 100,
    status: "shipped" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("purchase order domain requires non-negative quantity and unitPrice", () => {
  const okZero = createPurchaseOrder({
    id: "po-zero",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-zero",
    supplier: "s",
    item: "i",
    quantity: 0,
    unitPrice: 0,
    createdAt: NOW as never,
  });
  assert.ok(okZero.ok);
  assert.equal(okZero.value.amount, 0);

  const badQty = createPurchaseOrder({
    id: "po-bad-qty",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-bad-qty",
    supplier: "s",
    item: "i",
    quantity: -1,
    unitPrice: 100,
    createdAt: NOW as never,
  });
  assert.ok(!badQty.ok);

  const badPrice = createPurchaseOrder({
    id: "po-bad-price",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-bad-price",
    supplier: "s",
    item: "i",
    quantity: 10,
    unitPrice: -1,
    createdAt: NOW as never,
  });
  assert.ok(!badPrice.ok);
});

test("purchase order domain rejects non-finite quantity and unitPrice", () => {
  const nanQty = createPurchaseOrder({
    id: "po-nan",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-nan",
    supplier: "s",
    item: "i",
    quantity: Number.NaN,
    unitPrice: 100,
    createdAt: NOW as never,
  });
  assert.ok(!nanQty.ok);

  const infQty = createPurchaseOrder({
    id: "po-inf",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-inf",
    supplier: "s",
    item: "i",
    quantity: Number.POSITIVE_INFINITY,
    unitPrice: 100,
    createdAt: NOW as never,
  });
  assert.ok(!infQty.ok);
});

test("purchase order domain rejects empty required fields", () => {
  assert.ok(
    !createPurchaseOrder({
      id: "",
      organizationId: "org",
      projectId: "p-1",
      orderNumber: "PO-1",
      supplier: "s",
      item: "i",
      quantity: 1,
      unitPrice: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPurchaseOrder({
      id: "po",
      organizationId: "",
      projectId: "p-1",
      orderNumber: "PO-1",
      supplier: "s",
      item: "i",
      quantity: 1,
      unitPrice: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPurchaseOrder({
      id: "po",
      organizationId: "org",
      projectId: "",
      orderNumber: "PO-1",
      supplier: "s",
      item: "i",
      quantity: 1,
      unitPrice: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPurchaseOrder({
      id: "po",
      organizationId: "org",
      projectId: "p-1",
      orderNumber: "",
      supplier: "s",
      item: "i",
      quantity: 1,
      unitPrice: 100,
      createdAt: NOW as never,
    }).ok,
  );
});

test("purchase order domain preserves notes and defaults updatedAt", () => {
  const r = createPurchaseOrder({
    id: "po-note",
    organizationId: "org",
    projectId: "p-1",
    orderNumber: "PO-note",
    supplier: "建材商事",
    item: "鉄筋 D19",
    quantity: 50,
    unitPrice: 1200,
    notes: "緊急発注・納期厳守",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.notes, "緊急発注・納期厳守");
  assert.equal(r.value.amount, 60000);
  assert.equal(r.value.updatedAt, NOW);
});
