/** Integration tests for the ISO API (canonical + IMS-compatible aliases). */

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

async function buildHarness() {
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
  const readerRole = unwrap(
    createRole({
      id: "r-reader",
      name: "Iso Reader",
      description: "",
      scope: "global",
      permissions: ["iso:read"],
    }),
  );
  const admin = createApiKey("admin", resolvePermissions([adminRole]), apiKeyStore);
  const reader = createApiKey("reader", resolvePermissions([readerRole]), apiKeyStore);
  const org = createApiKey("org", resolvePermissions([adminRole]), apiKeyStore, "org-site");
  const audit = new AuditLog();
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: audit, apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${admin.key}:${admin.secret}`,
    readerCred: `${reader.key}:${reader.secret}`,
    orgCred: `${org.key}:${org.secret}`,
    audit,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
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
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

function rec(value: unknown): Record<string, unknown> {
  return (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
}

test("ISO canonical CRUD, action, analytics, and tenant scoping", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  assert.equal((await call(h.baseUrl, "GET", "/api/v1/iso", "")).status, 401);
  assert.equal(
    (await call(h.baseUrl, "POST", "/api/v1/iso", h.readerCred, { kind: "asset" })).status,
    403,
  );

  const created = await call(h.baseUrl, "POST", "/api/v1/iso", h.adminCred, {
    kind: "asset",
    organizationId: "org-hq",
    title: "橋梁A",
    name: "橋梁A",
    assetType: "structure",
  });
  assert.equal(created.status, 201);
  const id = rec(created.json["isoRecord"])["id"] as string;

  const listed = await call(h.baseUrl, "GET", "/api/v1/iso?kind=asset", h.adminCred);
  assert.equal(listed.status, 200);
  assert.equal(rec(listed.json)["total"], 1);

  const updated = await call(h.baseUrl, "PUT", `/api/v1/iso/${id}`, h.adminCred, {
    location: "東京",
  });
  assert.equal(updated.status, 200);
  assert.equal(rec(rec(updated.json["isoRecord"])["payload"])["location"], "東京");

  const analytics = await call(h.baseUrl, "GET", "/api/v1/iso/analytics", h.adminCred);
  assert.equal(analytics.status, 200);
  assert.equal(rec(rec(analytics.json)["analytics"])["total"], 1);

  // Organisation-scoped credential cannot read org-hq records.
  const scopedList = await call(h.baseUrl, "GET", "/api/v1/iso", h.orgCred);
  assert.equal(rec(scopedList.json)["total"], 0);

  const deleted = await call(h.baseUrl, "DELETE", `/api/v1/iso/${id}`, h.adminCred);
  assert.equal(deleted.status, 204);
});

test("IMS-compatible aliases map to ISO kinds", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const plan = await call(h.baseUrl, "POST", "/api/v1/quality/plans", h.adminCred, {
    organizationId: "org-hq",
    projectId: "project-1",
    title: "品質計画A",
    planNo: "QP-001",
  });
  assert.equal(plan.status, 201);
  assert.equal(rec(plan.json["isoRecord"])["kind"], "quality-plan");

  const action = await call(
    h.baseUrl,
    "POST",
    `/api/v1/quality/plans/${rec(plan.json["isoRecord"])["id"] as string}/action`,
    h.adminCred,
    {
      action: "submit-review",
    },
  );
  assert.equal(action.status, 200);
  assert.equal(rec(action.json["isoRecord"])["status"], "under_review");

  const asset = await call(h.baseUrl, "POST", "/api/v1/assets", h.adminCred, {
    organizationId: "org-hq",
    title: "重機",
    name: "重機1",
    assetType: "equipment",
  });
  assert.equal(asset.status, 201);
  assert.equal(rec(asset.json["isoRecord"])["kind"], "asset");

  const maintenance = await call(
    h.baseUrl,
    "POST",
    "/api/v1/assets/maintenance-plans",
    h.adminCred,
    {
      organizationId: "org-hq",
      parentId: rec(asset.json["isoRecord"])["id"],
      title: "月次点検",
      maintenanceType: "preventive",
    },
  );
  assert.equal(maintenance.status, 201);
  assert.equal(rec(maintenance.json["isoRecord"])["kind"], "asset-maintenance-plan");
});

test("invalid ISO kind and transition are rejected", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const badKind = await call(h.baseUrl, "POST", "/api/v1/iso", h.adminCred, {
    kind: "nope",
    organizationId: "org-hq",
    title: "x",
  });
  assert.equal(badKind.status, 400);

  const created = await call(h.baseUrl, "POST", "/api/v1/corrective-actions", h.adminCred, {
    organizationId: "org-hq",
    title: "CA",
    sourceType: "audit_finding",
    description: "d",
  });
  assert.equal(created.status, 201);
  const badAction = await call(
    h.baseUrl,
    "POST",
    `/api/v1/corrective-actions/${rec(created.json["isoRecord"])["id"] as string}/action`,
    h.adminCred,
    { action: "approve" },
  );
  assert.equal(badAction.status, 400);
});
