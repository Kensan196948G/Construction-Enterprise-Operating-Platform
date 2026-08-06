/**
 * Integration tests for entity CRUD endpoints.
 *
 * Each test spins up a real HTTP server, exercises the full
 * middleware → router → handler chain, and shuts down cleanly.
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
import type { ApiKeyStore } from "../types.ts";
import type { Result } from "../../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
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
  const readerRole = unwrap(
    createRole({
      id: "r-reader",
      name: "Reader",
      description: "",
      scope: "global",
      permissions: [
        "organization:read",
        "user:read",
        "role:read",
        "device:read",
        "application:read",
      ],
    }),
  );

  const adminKV = createApiKey("admin", resolvePermissions([adminRole]), apiKeyStore);
  const readerKV = createApiKey("reader", resolvePermissions([readerRole]), apiKeyStore);

  const container = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore,
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    readerCred: `${readerKV.key}:${readerKV.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function request(
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

const get = (baseUrl: string, path: string, cred: string | null) =>
  request("GET", baseUrl, path, cred);
const post = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  request("POST", baseUrl, path, cred, body);
const put = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  request("PUT", baseUrl, path, cred, body);
const del = (baseUrl: string, path: string, cred: string | null) =>
  request("DELETE", baseUrl, path, cred);

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

test("POST /api/v1/organizations — creates and returns 201", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "HQ Corp",
    type: "headquarters",
  });
  assert.equal(status, 201);
  const b = body as { name: string; type: string; status: string };
  assert.equal(b.name, "HQ Corp");
  assert.equal(b.type, "headquarters");
  assert.equal(b.status, "active");
});

test("POST /api/v1/organizations — 403 without write permission", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/organizations", h.readerCred, {
    name: "X",
    type: "headquarters",
  });
  assert.equal(status, 403);
});

test("POST /api/v1/organizations — 400 on invalid type", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "X",
    type: "spaceship",
  });
  assert.equal(status, 400);
});

test("GET /api/v1/organizations/:id — returns created org", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Branch A",
    type: "branch",
    parentId: "hq-placeholder",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await get(h.baseUrl, `/api/v1/organizations/${id}`, h.adminCred);
  assert.equal(status, 200);
  assert.equal((body as { id: string }).id, id);
});

test("GET /api/v1/organizations/:id — 404 for missing id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/organizations/does-not-exist", h.adminCred);
  assert.equal(status, 404);
});

test("GET /api/v1/organizations/:id — 200 for reader (organization:read)", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Readable Org",
    type: "site",
    parentId: "hq-placeholder",
  });
  const id = (created as { id: string }).id;
  const { status } = await get(h.baseUrl, `/api/v1/organizations/${id}`, h.readerCred);
  assert.equal(status, 200);
});

test("PUT /api/v1/organizations/:id — updates status", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Site X",
    type: "site",
    parentId: "hq-placeholder",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await put(h.baseUrl, `/api/v1/organizations/${id}`, h.adminCred, {
    status: "suspended",
  });
  assert.equal(status, 200);
  assert.equal((body as { status: string }).status, "suspended");
});

test("DELETE /api/v1/organizations/:id — returns 204", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "To Delete",
    type: "partner",
    parentId: "hq-placeholder",
  });
  const id = (created as { id: string }).id;
  const { status } = await del(h.baseUrl, `/api/v1/organizations/${id}`, h.adminCred);
  assert.equal(status, 204);
  const { status: afterStatus } = await get(h.baseUrl, `/api/v1/organizations/${id}`, h.adminCred);
  assert.equal(afterStatus, 404);
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

test("POST /api/v1/users — creates and returns 201", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org For User",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { status, body } = await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    organizationId: orgId,
    displayName: "Alice",
    email: "alice@example.com",
  });
  assert.equal(status, 201);
  assert.equal((body as { email: string }).email, "alice@example.com");
  assert.equal((body as { status: string }).status, "invited");
});

test("POST /api/v1/users — 409 on duplicate email", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const payload = { organizationId: orgId, displayName: "Bob", email: "bob@example.com" };
  await post(h.baseUrl, "/api/v1/users", h.adminCred, payload);
  const { status } = await post(h.baseUrl, "/api/v1/users", h.adminCred, payload);
  assert.equal(status, 409);
});

test("GET /api/v1/users/:id — returns user", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    organizationId: orgId,
    displayName: "Carol",
    email: "carol@example.com",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await get(h.baseUrl, `/api/v1/users/${id}`, h.adminCred);
  assert.equal(status, 200);
  assert.equal((body as { displayName: string }).displayName, "Carol");
});

test("PUT /api/v1/users/:id — updates displayName", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    organizationId: orgId,
    displayName: "Dave Old",
    email: "dave@example.com",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await put(h.baseUrl, `/api/v1/users/${id}`, h.adminCred, {
    displayName: "Dave New",
  });
  assert.equal(status, 200);
  assert.equal((body as { displayName: string }).displayName, "Dave New");
});

test("DELETE /api/v1/users/:id — soft-deactivates rather than hard-deletes", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    organizationId: orgId,
    displayName: "Eve",
    email: "eve@example.com",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await del(h.baseUrl, `/api/v1/users/${id}`, h.adminCred);
  assert.equal(status, 200);
  assert.equal((body as { status: string }).status, "deactivated");
  // User still accessible (not hard-deleted)
  const { status: getStatus } = await get(h.baseUrl, `/api/v1/users/${id}`, h.adminCred);
  assert.equal(getStatus, 200);
});

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

test("GET /api/v1/roles — returns empty list initially", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/roles", h.adminCred);
  assert.equal(status, 200);
  const b = body as { roles: unknown[]; count: number };
  assert.ok(Array.isArray(b.roles));
  assert.equal(b.count, b.roles.length);
});

test("GET /api/v1/roles — 403 without role:read permission", async () => {
  const h = await buildHarness();
  after(() => h.close());
  // Create a credential with NO role:read
  const apiKeyStore: ApiKeyStore = new Map();
  const noRoleRole = unwrap(
    createRole({
      id: "r-norole",
      name: "NoRole",
      description: "",
      scope: "global",
      permissions: ["device:read"],
    }),
  );
  const noRoleKV = createApiKey("norole", resolvePermissions([noRoleRole]), apiKeyStore);
  const container = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore,
  };
  const { createServer: _cs } = await import("../server.ts");
  const server = _cs({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const noRoleBaseUrl = `http://127.0.0.1:${port}`;
  after(
    () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  );
  const { status } = await get(
    noRoleBaseUrl,
    "/api/v1/roles",
    `${noRoleKV.key}:${noRoleKV.secret}`,
  );
  assert.equal(status, 403);
});

test("POST /api/v1/roles — creates role with permissions", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "Supervisor",
    description: "Site supervisor",
    scope: "organization",
    permissions: ["device:read", "user:read"],
  });
  assert.equal(status, 201);
  const b = body as { name: string; permissions: string[] };
  assert.equal(b.name, "Supervisor");
  assert.ok(b.permissions.includes("device:read"));
});

test("POST /api/v1/roles — 409 on duplicate name", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const payload = {
    name: "UniqueRole",
    description: "",
    scope: "global",
    permissions: ["device:read"],
  };
  await post(h.baseUrl, "/api/v1/roles", h.adminCred, payload);
  const { status } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, payload);
  assert.equal(status, 409);
});

test("POST /api/v1/roles — 400 when permissions array is empty", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "EmptyPerms",
    description: "",
    scope: "global",
    permissions: [],
  });
  assert.equal(status, 400);
});

test("GET /api/v1/roles/:id — returns role by id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "FieldAgent",
    description: "",
    scope: "site",
    permissions: ["device:read"],
  });
  const id = (created as { id: string }).id;
  const { status, body } = await get(h.baseUrl, `/api/v1/roles/${id}`, h.readerCred);
  assert.equal(status, 200);
  assert.equal((body as { name: string }).name, "FieldAgent");
});

test("PUT /api/v1/roles/:id — updates permissions", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "Updatable",
    description: "",
    scope: "global",
    permissions: ["device:read"],
  });
  const id = (created as { id: string }).id;
  const { status, body } = await put(h.baseUrl, `/api/v1/roles/${id}`, h.adminCred, {
    permissions: ["device:read", "application:read"],
  });
  assert.equal(status, 200);
  const perms = (body as { permissions: string[] }).permissions;
  assert.ok(perms.includes("application:read"));
});

test("DELETE /api/v1/roles/:id — returns 204 and role is gone", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: created } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "ToDeleteRole",
    description: "",
    scope: "global",
    permissions: ["device:read"],
  });
  const id = (created as { id: string }).id;
  const { status } = await del(h.baseUrl, `/api/v1/roles/${id}`, h.adminCred);
  assert.equal(status, 204);
  const { status: getStatus } = await get(h.baseUrl, `/api/v1/roles/${id}`, h.adminCred);
  assert.equal(getStatus, 404);
});

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

test("POST /api/v1/devices — creates device", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Site",
    type: "site",
    parentId: "hq-placeholder",
  });
  const orgId = (org as { id: string }).id;
  const { status, body } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: orgId,
    kind: "tablet",
  });
  assert.equal(status, 201);
  assert.equal((body as { kind: string }).kind, "tablet");
  assert.equal((body as { status: string }).status, "provisioned");
});

test("POST /api/v1/devices — 400 on invalid kind", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: "some-org",
    kind: "rocket",
  });
  assert.equal(status, 400);
});

test("GET /api/v1/devices/:id — returns device", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Site",
    type: "site",
    parentId: "hq-placeholder",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: orgId,
    kind: "kiosk",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await get(h.baseUrl, `/api/v1/devices/${id}`, h.readerCred);
  assert.equal(status, 200);
  assert.equal((body as { kind: string }).kind, "kiosk");
});

test("PUT /api/v1/devices/:id — updates status", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Site",
    type: "site",
    parentId: "hq-placeholder",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: orgId,
    kind: "sensor",
  });
  const id = (created as { id: string }).id;
  const { status, body } = await put(h.baseUrl, `/api/v1/devices/${id}`, h.adminCred, {
    status: "active",
  });
  assert.equal(status, 200);
  assert.equal((body as { status: string }).status, "active");
});

test("DELETE /api/v1/devices/:id — returns 204", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Site",
    type: "site",
    parentId: "hq-placeholder",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: orgId,
    kind: "laptop",
  });
  const id = (created as { id: string }).id;
  const { status } = await del(h.baseUrl, `/api/v1/devices/${id}`, h.adminCred);
  assert.equal(status, 204);
  const { status: getStatus } = await get(h.baseUrl, `/api/v1/devices/${id}`, h.adminCred);
  assert.equal(getStatus, 404);
});

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

test("POST /api/v1/applications — creates application", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Owner Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { status, body } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, {
    key: "my-portal",
    name: "My Portal",
    category: "portal",
    ownerOrganizationId: orgId,
  });
  assert.equal(status, 201);
  assert.equal((body as { key: string }).key, "my-portal");
  assert.equal((body as { health: string }).health, "unknown");
});

test("POST /api/v1/applications — 409 on duplicate key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const payload = {
    key: "dup-portal",
    name: "Portal",
    category: "portal",
    ownerOrganizationId: orgId,
  };
  await post(h.baseUrl, "/api/v1/applications", h.adminCred, payload);
  const { status } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, payload);
  assert.equal(status, 409);
});

test("POST /api/v1/applications — 400 on invalid key format", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { status } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, {
    key: "INVALID KEY",
    name: "Bad App",
    category: "portal",
    ownerOrganizationId: orgId,
  });
  assert.equal(status, 400);
});

test("GET /api/v1/applications/:id — returns application", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, {
    key: "field-app",
    name: "Field App",
    category: "field",
    ownerOrganizationId: orgId,
  });
  const id = (created as { id: string }).id;
  const { status, body } = await get(h.baseUrl, `/api/v1/applications/${id}`, h.readerCred);
  assert.equal(status, 200);
  assert.equal((body as { name: string }).name, "Field App");
});

test("PUT /api/v1/applications/:id — updates health status", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, {
    key: "gov-app",
    name: "Gov App",
    category: "governance",
    ownerOrganizationId: orgId,
  });
  const id = (created as { id: string }).id;
  const { status, body } = await put(h.baseUrl, `/api/v1/applications/${id}`, h.adminCred, {
    health: "healthy",
  });
  assert.equal(status, 200);
  assert.equal((body as { health: string }).health, "healthy");
});

test("DELETE /api/v1/applications/:id — returns 204", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: created } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, {
    key: "to-delete-app",
    name: "App",
    category: "workflow",
    ownerOrganizationId: orgId,
  });
  const id = (created as { id: string }).id;
  const { status } = await del(h.baseUrl, `/api/v1/applications/${id}`, h.adminCred);
  assert.equal(status, 204);
  const { status: getStatus } = await get(h.baseUrl, `/api/v1/applications/${id}`, h.adminCred);
  assert.equal(getStatus, 404);
});

// ---------------------------------------------------------------------------
// Auth guard (sample — 401 without credential)
// ---------------------------------------------------------------------------

test("POST /api/v1/roles — 401 without credential", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/roles", null, {
    name: "X",
    description: "",
    scope: "global",
    permissions: ["device:read"],
  });
  assert.equal(status, 401);
});

test("PUT /api/v1/organizations/unknown — 401 without credential", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await put(h.baseUrl, "/api/v1/organizations/unknown", null, { name: "X" });
  assert.equal(status, 401);
});

// ---------------------------------------------------------------------------
// Fix #1: dependency checks before DELETE
// ---------------------------------------------------------------------------

test("DELETE /api/v1/organizations/:id — 409 when organization has dependent user", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org With User",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    displayName: "Alice",
    email: "alice@example.com",
    organizationId: orgId,
    roleIds: [],
  });
  const { status } = await del(h.baseUrl, `/api/v1/organizations/${orgId}`, h.adminCred);
  assert.equal(status, 409);
});

test("DELETE /api/v1/roles/:id — 409 when role is assigned to a user", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { body: role } = await post(h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "Assigned Role",
    description: "",
    scope: "organization",
    permissions: ["device:read"],
  });
  const rid = (role as { id: string }).id;
  await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    displayName: "Bob",
    email: "bob@example.com",
    organizationId: orgId,
    roleIds: [rid],
  });
  const { status } = await del(h.baseUrl, `/api/v1/roles/${rid}`, h.adminCred);
  assert.equal(status, 409);
});

// ---------------------------------------------------------------------------
// Fix #3: reference ID validation
// ---------------------------------------------------------------------------

test("POST /api/v1/users — 400 when organizationId does not exist", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    displayName: "Charlie",
    email: "charlie@example.com",
    organizationId: "non-existent-org",
    roleIds: [],
  });
  assert.equal(status, 400);
});

test("POST /api/v1/users — 400 when roleId does not exist", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { status } = await post(h.baseUrl, "/api/v1/users", h.adminCred, {
    displayName: "Dave",
    email: "dave@example.com",
    organizationId: orgId,
    roleIds: ["non-existent-role"],
  });
  assert.equal(status, 400);
});

test("POST /api/v1/devices — 400 when organizationId does not exist", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: "non-existent-org",
    kind: "tablet",
  });
  assert.equal(status, 400);
});

test("POST /api/v1/devices — 400 when assignedUserId does not exist", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { body: org } = await post(h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Org",
    type: "headquarters",
  });
  const orgId = (org as { id: string }).id;
  const { status } = await post(h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: orgId,
    kind: "tablet",
    assignedUserId: "non-existent-user",
  });
  assert.equal(status, 400);
});

test("POST /api/v1/applications — 400 when ownerOrganizationId does not exist", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/applications", h.adminCred, {
    key: "app-orphan",
    name: "Orphan App",
    category: "workflow",
    ownerOrganizationId: "non-existent-org",
  });
  assert.equal(status, 400);
});
