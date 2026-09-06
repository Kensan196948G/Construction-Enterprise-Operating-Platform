/** Unit tests for purchase order domain (Enterprise-OS E-05 / ERP). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createPurchaseOrder, transitionPurchaseOrder } from "./purchase-order.ts";
import type { PurchaseOrder } from "./purchase-order.ts";

const NOW = "2026-08-07T06:00:00.000Z";
const LATER = "2026-08-08T06:00:00.000Z";

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
  for (const s of [
    "draft",
    "issued",
    "approved",
    "received",
    "delivered",
    "inspected",
    "paid",
    "cancelled",
  ] as const) {
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

function makeOrder(status: PurchaseOrder["status"]): PurchaseOrder {
  const r = createPurchaseOrder({
    id: `po-${status}`,
    organizationId: "org",
    projectId: "p-1",
    orderNumber: `PO-${status}`,
    supplier: "建材商事株式会社",
    item: "セメント 25kg",
    quantity: 10,
    unitPrice: 500,
    status,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  return r.value;
}

test("purchase order lifecycle transitions through the normal path", () => {
  const draft = makeOrder("draft");
  const issued = transitionPurchaseOrder(draft, "issued", LATER as never);
  assert.ok(issued.ok);
  assert.equal(issued.value.status, "issued");
  assert.equal(issued.value.updatedAt, LATER);

  const approved = transitionPurchaseOrder(issued.value, "approved", LATER as never);
  assert.ok(approved.ok);
  assert.equal(approved.value.status, "approved");

  const received = transitionPurchaseOrder(approved.value, "received", LATER as never);
  assert.ok(received.ok);
  assert.equal(received.value.status, "received");

  const delivered = transitionPurchaseOrder(received.value, "delivered", LATER as never);
  assert.ok(delivered.ok);
  assert.equal(delivered.value.status, "delivered");

  const inspected = transitionPurchaseOrder(delivered.value, "inspected", LATER as never);
  assert.ok(inspected.ok);
  assert.equal(inspected.value.status, "inspected");

  const paid = transitionPurchaseOrder(inspected.value, "paid", LATER as never);
  assert.ok(paid.ok);
  assert.equal(paid.value.status, "paid");
});

test("purchase order lifecycle allows cancellation from any non-terminal state", () => {
  for (const status of [
    "draft",
    "issued",
    "approved",
    "received",
    "delivered",
    "inspected",
  ] as const) {
    const order = makeOrder(status);
    const cancelled = transitionPurchaseOrder(order, "cancelled", LATER as never);
    assert.ok(cancelled.ok, `cancellation from '${status}' should be allowed`);
    assert.equal(cancelled.value.status, "cancelled");
  }
});

test("purchase order lifecycle rejects an invalid transition (draft -> paid)", () => {
  const draft = makeOrder("draft");
  const result = transitionPurchaseOrder(draft, "paid", LATER as never);
  assert.ok(!result.ok);
  assert.match(result.error[0]?.message ?? "", /cannot transition 'draft' to 'paid'/);
});

test("purchase order lifecycle rejects skipping steps (issued -> delivered)", () => {
  const issued = makeOrder("issued");
  const result = transitionPurchaseOrder(issued, "delivered", LATER as never);
  assert.ok(!result.ok);
});

test("purchase order lifecycle rejects transitions from terminal states", () => {
  const paid = makeOrder("paid");
  assert.ok(!transitionPurchaseOrder(paid, "issued", LATER as never).ok);
  assert.ok(!transitionPurchaseOrder(paid, "cancelled", LATER as never).ok);

  const cancelled = makeOrder("cancelled");
  assert.ok(!transitionPurchaseOrder(cancelled, "issued", LATER as never).ok);
});
