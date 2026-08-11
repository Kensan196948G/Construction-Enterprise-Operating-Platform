/** Integration tests for Purchase Order API (Enterprise-OS E-05 / ERP). */

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
      permissions: ["purchase-order:read"],
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

test("Purchase Order API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal(
    (await call(h.baseUrl, "GET", "/api/v1/projects/p-1/purchase-orders", "")).status,
    401,
  );
});

test("Purchase Order API — CRUD normal path with admin key", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  // Create a project first
  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "PO-1",
    name: "purchase order project",
  });
  const pid = (project.json as { project: { id: string } }).project.id;

  // List (empty)
  const listEmpty = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/purchase-orders`,
    h.adminCred,
  );
  assert.equal(listEmpty.status, 200);
  assert.ok(Array.isArray((listEmpty.json as { purchaseOrders: unknown[] }).purchaseOrders));

  // Create
  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders`,
    h.adminCred,
    {
      orderNumber: "PO-2026-001",
      supplier: "建材商事株式会社",
      item: "セメント 25kg",
      quantity: 100,
      unitPrice: 500,
      status: "issued",
    },
  );
  assert.equal(created.status, 201);
  const po = (created.json as { purchaseOrder: { id: string; amount: number } }).purchaseOrder;
  assert.equal(po.amount, 50000);

  // Get by ID
  const getRes = await call(h.baseUrl, "GET", `/api/v1/purchase-orders/${po.id}`, h.adminCred);
  assert.equal(getRes.status, 200);
  assert.equal(
    (getRes.json as { purchaseOrder: { orderNumber: string } }).purchaseOrder.orderNumber,
    "PO-2026-001",
  );

  // List (now has one)
  const list = await call(h.baseUrl, "GET", `/api/v1/projects/${pid}/purchase-orders`, h.adminCred);
  assert.equal((list.json as { count: number }).count, 1);

  // Duplicate order number
  const dup = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders`,
    h.adminCred,
    { orderNumber: "PO-2026-001", supplier: "s", item: "i", quantity: 1, unitPrice: 100 },
  );
  assert.equal(dup.status, 400);

  // Audit
  assert.ok(h.audit.query((e) => e.event.action === "purchase-order:create").length >= 1);
});

test("Purchase Order API — 403 with viewer (read-only) key for write", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/projects/p-1/purchase-orders", h.viewerCred, {
    orderNumber: "PO-X",
    supplier: "s",
    item: "i",
    quantity: 1,
    unitPrice: 100,
  });
  assert.equal(res.status, 403);
});

test("Purchase Order API — 400 on invalid status", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "PO-BAD",
    name: "bad status project",
  });
  const pid = (project.json as { project: { id: string } }).project.id;

  const res = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders`,
    h.adminCred,
    {
      orderNumber: "PO-BAD-STATUS",
      supplier: "s",
      item: "i",
      quantity: 1,
      unitPrice: 100,
      status: "shipped",
    },
  );
  assert.equal(res.status, 400);
});

test("Purchase Order API — 400 on negative quantity", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "PO-NEG",
    name: "negative qty project",
  });
  const pid = (project.json as { project: { id: string } }).project.id;

  const res = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders`,
    h.adminCred,
    { orderNumber: "PO-NEG", supplier: "s", item: "i", quantity: -1, unitPrice: 100 },
  );
  assert.equal(res.status, 400);
});

test("Purchase Order API — 404 for non-existent project", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(
    h.baseUrl,
    "GET",
    "/api/v1/projects/does-not-exist/purchase-orders",
    h.adminCred,
  );
  assert.equal(res.status, 404);
});

test("Purchase Order API — 404 for non-existent purchase order", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", "/api/v1/purchase-orders/does-not-exist", h.adminCred);
  assert.equal(res.status, 404);
});
