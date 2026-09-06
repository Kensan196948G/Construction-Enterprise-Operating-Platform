/** Unit tests for the billing / accounting domain (#84). */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BILLING_APPROVAL_STATUSES,
  PAYMENT_METHODS,
  ADVANCE_PAYMENT_STATUSES,
  createProgressBillingInvoice,
  updateProgressBillingInvoice,
  createPaymentRecord,
  updatePaymentRecord,
  createAdvancePayment,
  updateAdvancePayment,
} from "./billing.ts";

const NOW = "2026-08-10T08:00:00.000Z";

// ---------------------------------------------------------------------------
// Progress billing invoice
// ---------------------------------------------------------------------------

test("progress billing invoice creates with defaults", () => {
  const r = createProgressBillingInvoice({
    id: "inv-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    invoiceNumber: "INV-2026-001",
    billingDate: "2026-08-01",
    progressPercentage: 40,
    billedAmount: 4_000_000,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.approvalStatus, "draft");
  assert.equal(r.value.cumulativeBilledAmount, 4_000_000);
});

test("progress billing invoice accepts all approval statuses", () => {
  for (const approvalStatus of BILLING_APPROVAL_STATUSES) {
    const r = createProgressBillingInvoice({
      id: `inv-${approvalStatus}`,
      organizationId: "org",
      projectId: "p-1",
      contractId: "c-1",
      invoiceNumber: `INV-${approvalStatus}`,
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 1000,
      approvalStatus,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${approvalStatus} should be valid`);
    assert.equal(r.value.approvalStatus, approvalStatus);
  }
});

test("progress billing invoice validates required fields", () => {
  assert.ok(
    !createProgressBillingInvoice({
      id: "",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      invoiceNumber: "INV-1",
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createProgressBillingInvoice({
      id: "inv",
      organizationId: "org",
      projectId: "p",
      contractId: "",
      invoiceNumber: "INV-1",
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 100,
      createdAt: NOW as never,
    }).ok,
  );
});

test("progress billing invoice rejects out-of-range progress and bad dates", () => {
  assert.ok(
    !createProgressBillingInvoice({
      id: "inv",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      invoiceNumber: "INV-1",
      billingDate: "2026-08-01",
      progressPercentage: 150,
      billedAmount: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createProgressBillingInvoice({
      id: "inv",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      invoiceNumber: "INV-1",
      billingDate: "2026/08/01",
      progressPercentage: 10,
      billedAmount: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createProgressBillingInvoice({
      id: "inv",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      invoiceNumber: "INV-1",
      billingDate: "2026-08-01",
      periodStart: "not-a-date",
      progressPercentage: 10,
      billedAmount: 100,
      createdAt: NOW as never,
    }).ok,
  );
});

test("progress billing invoice rejects invalid approval status", () => {
  assert.ok(
    !createProgressBillingInvoice({
      id: "inv",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      invoiceNumber: "INV-1",
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 100,
      approvalStatus: "bogus" as never,
      createdAt: NOW as never,
    }).ok,
  );
});

test("progress billing invoice update merges fields", () => {
  const base = createProgressBillingInvoice({
    id: "inv-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    invoiceNumber: "INV-2026-001",
    billingDate: "2026-08-01",
    progressPercentage: 40,
    billedAmount: 4_000_000,
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateProgressBillingInvoice(base.value, {
    approvalStatus: "approved",
    progressPercentage: 60,
    billedAmount: 6_000_000,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.approvalStatus, "approved");
  assert.equal(updated.value.progressPercentage, 60);
  assert.equal(updated.value.billedAmount, 6_000_000);
  // cumulativeBilledAmount left untouched when not passed in the update.
  assert.equal(updated.value.cumulativeBilledAmount, 4_000_000);
});

test("progress billing invoice update rejects invalid approval status", () => {
  const base = createProgressBillingInvoice({
    id: "inv-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    invoiceNumber: "INV-2026-001",
    billingDate: "2026-08-01",
    progressPercentage: 40,
    billedAmount: 4_000_000,
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateProgressBillingInvoice(base.value, {
      approvalStatus: "bogus" as never,
      updatedAt: NOW as never,
    }).ok,
  );
});

// ---------------------------------------------------------------------------
// Payment record
// ---------------------------------------------------------------------------

test("payment record creates with defaults", () => {
  const r = createPaymentRecord({
    id: "pay-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    paymentDate: "2026-08-05",
    amount: 4_000_000,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.paymentMethod, "bank_transfer");
});

test("payment record accepts all payment methods", () => {
  for (const paymentMethod of PAYMENT_METHODS) {
    const r = createPaymentRecord({
      id: `pay-${paymentMethod}`,
      organizationId: "org",
      projectId: "p-1",
      contractId: "c-1",
      paymentDate: "2026-08-05",
      amount: 100,
      paymentMethod,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${paymentMethod} should be valid`);
    assert.equal(r.value.paymentMethod, paymentMethod);
  }
});

test("payment record rejects non-positive amount and bad date", () => {
  assert.ok(
    !createPaymentRecord({
      id: "pay",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      paymentDate: "2026-08-05",
      amount: 0,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPaymentRecord({
      id: "pay",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      paymentDate: "not-a-date",
      amount: 100,
      createdAt: NOW as never,
    }).ok,
  );
});

test("payment record update merges fields", () => {
  const base = createPaymentRecord({
    id: "pay-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    paymentDate: "2026-08-05",
    amount: 100,
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updatePaymentRecord(base.value, {
    amount: 200,
    paymentMethod: "cash",
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.amount, 200);
  assert.equal(updated.value.paymentMethod, "cash");
});

// ---------------------------------------------------------------------------
// Advance payment
// ---------------------------------------------------------------------------

test("advance payment creates with defaults", () => {
  const r = createAdvancePayment({
    id: "adv-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    paymentDate: "2026-08-01",
    amount: 1_000_000,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "outstanding");
  assert.equal(r.value.recoveredAmount, 0);
});

test("advance payment accepts all statuses", () => {
  for (const status of ADVANCE_PAYMENT_STATUSES) {
    const r = createAdvancePayment({
      id: `adv-${status}`,
      organizationId: "org",
      projectId: "p-1",
      contractId: "c-1",
      paymentDate: "2026-08-01",
      amount: 1000,
      status,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
    assert.equal(r.value.status, status);
  }
});

test("advance payment rejects non-positive amount and negative recoveredAmount", () => {
  assert.ok(
    !createAdvancePayment({
      id: "adv",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      paymentDate: "2026-08-01",
      amount: -1,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createAdvancePayment({
      id: "adv",
      organizationId: "org",
      projectId: "p",
      contractId: "c",
      paymentDate: "2026-08-01",
      amount: 1000,
      recoveredAmount: -1,
      createdAt: NOW as never,
    }).ok,
  );
});

test("advance payment update merges fields", () => {
  const base = createAdvancePayment({
    id: "adv-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    paymentDate: "2026-08-01",
    amount: 1_000_000,
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateAdvancePayment(base.value, {
    recoveredAmount: 500_000,
    status: "partially_recovered",
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.recoveredAmount, 500_000);
  assert.equal(updated.value.status, "partially_recovered");
});

test("advance payment update rejects invalid status", () => {
  const base = createAdvancePayment({
    id: "adv-1",
    organizationId: "org",
    projectId: "p-1",
    contractId: "c-1",
    paymentDate: "2026-08-01",
    amount: 1_000_000,
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateAdvancePayment(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok,
  );
});
