/**
 * Integration tests for GET /api/v1/governance/access-inventory.
 *
 * Covers the RBAC audit report (issue #68): authorization guard for
 * `audit:read`, correct resolution of user -> role -> permission, tenant
 * scoping for organization-scoped credentials, and that a successful read is
 * itself recorded in the tamper-evident audit log.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";
import type { Result } from "../../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface Harness {
  baseUrl: string;
  adminCred: string;
  auditorCred: string;
  scopedAuditorCred: string;
  noPermCred: string;
  auditLog: AuditLog;
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
  const auditorRole = unwrap(
    createRole({
      id: "r-auditor",
      name: "Auditor",
      description: "",
      scope: "global",
      permissions: ["audit:read"],
    }),
  );
  const noPermRole = unwrap(
    createRole({
      id: "r-noperm",
      name: "NoAudit",
      description: "",
      scope: "global",
      permissions: ["organization:read"],
    }),
  );

  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const auditorKV = createApiKey("auditor-subject", resolvePermissions([auditorRole]), apiKeyStore);
  const scopedAuditorKV = createApiKey(
    "scoped-auditor-subject",
    resolvePermissions([auditorRole]),
    apiKeyStore,
    "org-1",
  );
  const noPermKV = createApiKey("noperm-subject", resolvePermissions([noPermRole]), apiKeyStore);

  const auditLog = new AuditLog();
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog,
    apiKeyStore,
  };

  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    auditorCred: `${auditorKV.key}:${auditorKV.secret}`,
    scopedAuditorCred: `${scopedAuditorKV.key}:${scopedAuditorKV.secret}`,
    noPermCred: `${noPermKV.key}:${noPermKV.secret}`,
    auditLog,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function req(
  method: string,
  baseUrl: string,
  path: string,
  cred: string | null,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cred !== null) headers["Authorization"] = `Bearer ${cred}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

const get = (baseUrl: string, path: string, cred: string | null) => req("GET", baseUrl, path, cred);
const post = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  req("POST", baseUrl, path, cred, body);

/** Seed two organizations, one field role, and one user in each organization. */
async function seedTenants(h: Harness): Promise<void> {
  await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    id: "org-1",
    name: "Org One",
    type: "headquarters",
  });
  await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    id: "org-2",
    name: "Org Two",
    type: "headquarters",
  });
  await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    id: "r-field",
    name: "Field Worker",
    scope: "organization",
    permissions: ["project:read", "photo:read"],
  });
  await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    id: "u-org1",
    organizationId: "org-1",
    displayName: "Org One User",
    email: "org1-user@example.com",
    status: "active",
    roleIds: ["r-field"],
  });
  await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    id: "u-org2",
    organizationId: "org-2",
    displayName: "Org Two User",
    email: "org2-user@example.com",
    status: "active",
    roleIds: ["r-field"],
  });
}

test("GET /api/v1/governance/access-inventory — 403 without audit:read", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/governance/access-inventory", h.noPermCred);
  assert.equal(status, 403);
});

test("GET /api/v1/governance/access-inventory — 401 without credentials", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/governance/access-inventory", null);
  assert.equal(status, 401);
});

test("GET /api/v1/governance/access-inventory — resolves users to roles and permissions", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await seedTenants(h);

  const { status, body } = await get(
    h.baseUrl,
    "/api/v1/governance/access-inventory",
    h.auditorCred,
  );
  assert.equal(status, 200);
  const b = body as {
    entries: Array<{
      userId: string;
      roles: Array<{ id: string; name: string }>;
      permissions: string[];
    }>;
    summary: { totalUsers: number; totalRoles: number; usersByPermission: Record<string, number> };
    total: number;
  };
  assert.equal(b.total, 2);
  assert.equal(b.summary.totalUsers, 2);

  const orgOneEntry = b.entries.find((e) => e.userId === "u-org1");
  assert.ok(orgOneEntry);
  assert.deepEqual(orgOneEntry?.permissions.sort(), ["photo:read", "project:read"]);
  assert.equal(orgOneEntry?.roles[0]?.name, "Field Worker");
  assert.equal(b.summary.usersByPermission["project:read"], 2);
});

test("GET /api/v1/governance/access-inventory — org-scoped credential only sees its own tenant", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await seedTenants(h);

  const { status, body } = await get(
    h.baseUrl,
    "/api/v1/governance/access-inventory",
    h.scopedAuditorCred,
  );
  assert.equal(status, 200);
  const b = body as { entries: Array<{ userId: string; organizationId: string }>; total: number };
  assert.equal(b.total, 1);
  assert.equal(b.entries[0]?.userId, "u-org1");
  assert.equal(b.entries[0]?.organizationId, "org-1");
});

test("GET /api/v1/governance/access-inventory — supports limit/offset pagination", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await seedTenants(h);

  const { status, body } = await get(
    h.baseUrl,
    "/api/v1/governance/access-inventory?limit=1&offset=0",
    h.auditorCred,
  );
  assert.equal(status, 200);
  const b = body as { entries: unknown[]; count: number; total: number; limit: number };
  assert.equal(b.count, 1);
  assert.equal(b.total, 2);
  assert.equal(b.limit, 1);
});

test("GET /api/v1/governance/access-inventory — successful read is recorded in the audit log", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await seedTenants(h);

  await get(h.baseUrl, "/api/v1/governance/access-inventory", h.auditorCred);
  const entry = h.auditLog.entries.find((e) => e.event.action === "audit:access-inventory");
  assert.ok(entry, "expected audit:access-inventory to be recorded");
  assert.equal(entry?.event.actor, "auditor-subject");
  assert.equal(entry?.event.outcome, "success");
});
