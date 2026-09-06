/** Integration tests for the billing / accounting API (Issue #84). */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import type { Result } from "../../domain/common.ts";
import type { ApiKeyStore } from "../types.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface Harness {
  baseUrl: string;
  adminCred: string;
  viewerCred: string;
  audit: AuditLog;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const adminRole = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  const viewerRole = unwrap(
    createRole({
      id: "r-viewer",
      name: "viewer",
      description: "",
      scope: "global",
      permissions: ["billing-invoice:read", "payment-record:read", "advance-payment:read"],
    }),
  );
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const viewerKV = createApiKey("viewer-subject", resolvePermissions([viewerRole]), apiKeyStore);
  const audit = new AuditLog();
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: audit, apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    viewerCred: `${viewerKV.key}:${viewerKV.secret}`,
    audit,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  credential: string,
  body?: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // no-op
  }
  return { status: res.status, json };
}

/** Create a project + contract via the API and return their ids. */
async function seedContract(
  h: Harness,
  projectCode: string,
): Promise<{ projectId: string; contractId: string }> {
  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode,
    name: `${projectCode} project`,
  });
  const pid = (project.json as { project: { id: string } }).project.id;
  const contract = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/contracts`, h.adminCred, {
    contractNumber: `${projectCode}-CT-1`,
    title: `${projectCode} contract`,
    amount: 10_000_000,
  });
  const cid = (contract.json as { contract: { id: string } }).contract.id;
  return { projectId: pid, contractId: cid };
}

test("Billing API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal(
    (await call(h.baseUrl, "GET", "/api/v1/contracts/c-1/billing-invoices", "")).status,
    401,
  );
});

test("Billing API — 404 billing invoice creation against non-existent contract", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(
    h.baseUrl,
    "POST",
    "/api/v1/contracts/does-not-exist/billing-invoices",
    h.adminCred,
    {
      invoiceNumber: "INV-X",
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 100,
    },
  );
  assert.equal(res.status, 404);
});

test("Billing API — progress billing invoice CRUD", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const { contractId } = await seedContract(h, "BILL-1");

  // List (empty)
  const listEmpty = await call(
    h.baseUrl,
    "GET",
    `/api/v1/contracts/${contractId}/billing-invoices`,
    h.adminCred,
  );
  assert.equal(listEmpty.status, 200);
  assert.equal((listEmpty.json as { count: number }).count, 0);

  // Create
  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/billing-invoices`,
    h.adminCred,
    {
      invoiceNumber: "BILL-1-INV-001",
      billingDate: "2026-08-01",
      progressPercentage: 40,
      billedAmount: 4_000_000,
    },
  );
  assert.equal(created.status, 201);
  const invoice = (
    created.json as { billingInvoice: { id: string; cumulativeBilledAmount: number } }
  ).billingInvoice;
  assert.equal(invoice.cumulativeBilledAmount, 4_000_000);

  // Duplicate invoice number rejected
  const dup = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/billing-invoices`,
    h.adminCred,
    {
      invoiceNumber: "BILL-1-INV-001",
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 100,
    },
  );
  assert.equal(dup.status, 400);

  // Get by id
  const getRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/billing-invoices/${invoice.id}`,
    h.adminCred,
  );
  assert.equal(getRes.status, 200);

  // Update (approve)
  const updated = await call(
    h.baseUrl,
    "PUT",
    `/api/v1/billing-invoices/${invoice.id}`,
    h.adminCred,
    { approvalStatus: "approved" },
  );
  assert.equal(updated.status, 200);
  assert.equal(
    (updated.json as { billingInvoice: { approvalStatus: string } }).billingInvoice.approvalStatus,
    "approved",
  );

  // Invalid approval status rejected
  const badStatus = await call(
    h.baseUrl,
    "PUT",
    `/api/v1/billing-invoices/${invoice.id}`,
    h.adminCred,
    { approvalStatus: "bogus" },
  );
  assert.equal(badStatus.status, 400);

  // Viewer cannot write
  const forbiddenRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/billing-invoices`,
    h.viewerCred,
    { invoiceNumber: "X", billingDate: "2026-08-01", progressPercentage: 1, billedAmount: 1 },
  );
  assert.equal(forbiddenRes.status, 403);

  // Delete
  const del = await call(
    h.baseUrl,
    "DELETE",
    `/api/v1/billing-invoices/${invoice.id}`,
    h.adminCred,
  );
  assert.equal(del.status, 204);
  const afterDelete = await call(
    h.baseUrl,
    "GET",
    `/api/v1/billing-invoices/${invoice.id}`,
    h.adminCred,
  );
  assert.equal(afterDelete.status, 404);

  assert.ok(h.audit.query((e) => e.event.action === "billing-invoice:create").length >= 1);
});

test("Billing API — payment record CRUD and invoice cross-check", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const { contractId } = await seedContract(h, "BILL-2");

  const invoiceRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/billing-invoices`,
    h.adminCred,
    {
      invoiceNumber: "BILL-2-INV-001",
      billingDate: "2026-08-01",
      progressPercentage: 50,
      billedAmount: 5_000_000,
    },
  );
  const invoiceId = (invoiceRes.json as { billingInvoice: { id: string } }).billingInvoice.id;

  // invoiceId referencing an invoice on a different contract is rejected.
  const { contractId: otherContractId } = await seedContract(h, "BILL-2-OTHER");
  const otherInvoiceRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${otherContractId}/billing-invoices`,
    h.adminCred,
    {
      invoiceNumber: "BILL-2-OTHER-INV-001",
      billingDate: "2026-08-01",
      progressPercentage: 10,
      billedAmount: 1_000_000,
    },
  );
  const otherInvoiceId = (otherInvoiceRes.json as { billingInvoice: { id: string } }).billingInvoice
    .id;
  const crossContractPayment = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/payments`,
    h.adminCred,
    { invoiceId: otherInvoiceId, paymentDate: "2026-08-10", amount: 1000 },
  );
  assert.equal(crossContractPayment.status, 400);

  // Create a valid payment referencing the invoice.
  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/payments`,
    h.adminCred,
    { invoiceId, paymentDate: "2026-08-10", amount: 5_000_000, paymentMethod: "bank_transfer" },
  );
  assert.equal(created.status, 201);
  const payment = (created.json as { payment: { id: string } }).payment;

  const listRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/contracts/${contractId}/payments`,
    h.adminCred,
  );
  assert.equal((listRes.json as { count: number }).count, 1);

  const updated = await call(h.baseUrl, "PUT", `/api/v1/payments/${payment.id}`, h.adminCred, {
    amount: 4_500_000,
  });
  assert.equal(updated.status, 200);
  assert.equal((updated.json as { payment: { amount: number } }).payment.amount, 4_500_000);

  const del = await call(h.baseUrl, "DELETE", `/api/v1/payments/${payment.id}`, h.adminCred);
  assert.equal(del.status, 204);
});

test("Billing API — advance payment CRUD", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const { contractId } = await seedContract(h, "BILL-3");

  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/advance-payments`,
    h.adminCred,
    { paymentDate: "2026-08-01", amount: 1_000_000, purpose: "資材先行調達" },
  );
  assert.equal(created.status, 201);
  const advance = (created.json as { advancePayment: { id: string; status: string } })
    .advancePayment;
  assert.equal(advance.status, "outstanding");

  const updated = await call(
    h.baseUrl,
    "PUT",
    `/api/v1/advance-payments/${advance.id}`,
    h.adminCred,
    { recoveredAmount: 500_000, status: "partially_recovered" },
  );
  assert.equal(updated.status, 200);
  assert.equal(
    (updated.json as { advancePayment: { status: string } }).advancePayment.status,
    "partially_recovered",
  );

  const badStatus = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${contractId}/advance-payments`,
    h.adminCred,
    { paymentDate: "2026-08-01", amount: 1000, status: "bogus" },
  );
  assert.equal(badStatus.status, 400);

  const del = await call(
    h.baseUrl,
    "DELETE",
    `/api/v1/advance-payments/${advance.id}`,
    h.adminCred,
  );
  assert.equal(del.status, 204);
  const afterDelete = await call(
    h.baseUrl,
    "GET",
    `/api/v1/advance-payments/${advance.id}`,
    h.adminCred,
  );
  assert.equal(afterDelete.status, 404);
});
