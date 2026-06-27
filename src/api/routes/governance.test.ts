/**
 * Integration tests for governance API endpoints.
 *
 * Covers Policy CRUD (POST, GET/:id, PUT, DELETE), pagination on the list
 * endpoint, and authorization guards for policy:read / policy:write.
 * Each test gets its own isolated HTTP server on a random OS-assigned port.
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
// Harness
// ---------------------------------------------------------------------------

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
  noPermCred: string;
  noCred: null;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();

  const adminRole = unwrap(
    createRole({ id: "r-admin", name: "Admin", description: "", scope: "global", permissions: ["*:*"] }),
  );
  const readerRole = unwrap(
    createRole({
      id: "r-reader",
      name: "PolicyReader",
      description: "",
      scope: "global",
      permissions: ["policy:read", "governance:evaluate"],
    }),
  );
  // Has no policy:read or governance:evaluate — used to assert 403 paths
  const noPermRole = unwrap(
    createRole({
      id: "r-noperm",
      name: "NoPolicy",
      description: "",
      scope: "global",
      permissions: ["organization:read"],
    }),
  );

  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const readerKV = createApiKey("reader-subject", resolvePermissions([readerRole]), apiKeyStore);
  const noPermKV = createApiKey("noperm-subject", resolvePermissions([noPermRole]), apiKeyStore);

  const container = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore,
  };

  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    readerCred: `${readerKV.key}:${readerKV.secret}`,
    noPermCred: `${noPermKV.key}:${noPermKV.secret}`,
    noCred: null,
    close: () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
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
const put = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  req("PUT", baseUrl, path, cred, body);
const del = (baseUrl: string, path: string, cred: string | null) => req("DELETE", baseUrl, path, cred);

const POLICY_PAYLOAD = {
  id: "p-allow-org-read",
  name: "Allow org read",
  effect: "allow",
  actions: ["read"],
  resources: ["organization"],
  conditions: [],
};

// ---------------------------------------------------------------------------
// POST /api/v1/governance/policies
// ---------------------------------------------------------------------------

test("POST /api/v1/governance/policies — 201 with admin key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  assert.equal(status, 201);
  const b = body as { id: string; name: string; effect: string };
  assert.equal(b.id, "p-allow-org-read");
  assert.equal(b.name, "Allow org read");
  assert.equal(b.effect, "allow");
});

test("POST /api/v1/governance/policies — 403 with reader key (no write permission)", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/governance/policies", h.readerCred, POLICY_PAYLOAD);
  assert.equal(status, 403);
});

test("POST /api/v1/governance/policies — 401 without credentials", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/governance/policies", h.noCred, POLICY_PAYLOAD);
  assert.equal(status, 401);
});

test("POST /api/v1/governance/policies — 400 on missing required fields", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, {
    id: "p-bad",
    // name is empty string → validation fails
    name: "",
    effect: "allow",
    actions: ["read"],
    resources: ["org"],
    conditions: [],
  });
  assert.equal(status, 400);
  const b = body as { error: string };
  assert.equal(b.error, "Bad Request");
});

test("POST /api/v1/governance/policies — 400 on invalid effect", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, {
    ...POLICY_PAYLOAD,
    effect: "grant",
  });
  assert.equal(status, 400);
});

// ---------------------------------------------------------------------------
// GET /api/v1/governance/policies/:id
// ---------------------------------------------------------------------------

test("GET /api/v1/governance/policies/:id — 200 returns the policy", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { status, body } = await get(h.baseUrl, `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`, h.adminCred);
  assert.equal(status, 200);
  const b = body as { id: string; name: string };
  assert.equal(b.id, "p-allow-org-read");
  assert.equal(b.name, "Allow org read");
});

test("GET /api/v1/governance/policies/:id — 200 with reader key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { status } = await get(h.baseUrl, `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`, h.readerCred);
  assert.equal(status, 200);
});

test("GET /api/v1/governance/policies/:id — 404 for unknown id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/governance/policies/nonexistent", h.adminCred);
  assert.equal(status, 404);
  const b = body as { error: string };
  assert.equal(b.error, "Not Found");
});

test("GET /api/v1/governance/policies/:id — 403 without read permission", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/governance/policies/any", h.noPermCred);
  assert.equal(status, 403);
});

// ---------------------------------------------------------------------------
// PUT /api/v1/governance/policies/:id
// ---------------------------------------------------------------------------

test("PUT /api/v1/governance/policies/:id — 200 updates name and actions", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { status, body } = await put(
    h.baseUrl,
    `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`,
    h.adminCred,
    { name: "Updated Name", actions: ["read", "write"] },
  );
  assert.equal(status, 200);
  const b = body as { name: string; actions: string[] };
  assert.equal(b.name, "Updated Name");
  assert.deepEqual(b.actions, ["read", "write"]);
});

test("PUT /api/v1/governance/policies/:id — preserves effect when not provided", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { body } = await put(
    h.baseUrl,
    `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`,
    h.adminCred,
    { name: "New Name" },
  );
  const b = body as { effect: string };
  assert.equal(b.effect, "allow");
});

test("PUT /api/v1/governance/policies/:id — 404 for unknown id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await put(h.baseUrl, "/api/v1/governance/policies/ghost", h.adminCred, { name: "x" });
  assert.equal(status, 404);
});

test("PUT /api/v1/governance/policies/:id — 403 with reader key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { status } = await put(
    h.baseUrl,
    `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`,
    h.readerCred,
    { name: "Hack" },
  );
  assert.equal(status, 403);
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/governance/policies/:id
// ---------------------------------------------------------------------------

test("DELETE /api/v1/governance/policies/:id — 204 removes the policy", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { status } = await del(h.baseUrl, `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`, h.adminCred);
  assert.equal(status, 204);
  const { status: getStatus } = await get(
    h.baseUrl,
    `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`,
    h.adminCred,
  );
  assert.equal(getStatus, 404);
});

test("DELETE /api/v1/governance/policies/:id — 404 for unknown id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await del(h.baseUrl, "/api/v1/governance/policies/ghost", h.adminCred);
  assert.equal(status, 404);
});

test("DELETE /api/v1/governance/policies/:id — 403 with reader key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  const { status } = await del(
    h.baseUrl,
    `/api/v1/governance/policies/${POLICY_PAYLOAD.id}`,
    h.readerCred,
  );
  assert.equal(status, 403);
});

// ---------------------------------------------------------------------------
// GET /api/v1/governance/policies — list with pagination
// ---------------------------------------------------------------------------

test("GET /api/v1/governance/policies — returns empty list initially", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/governance/policies", h.adminCred);
  assert.equal(status, 200);
  const b = body as { policies: unknown[]; total: number; count: number; limit: number; offset: number };
  assert.deepEqual(b.policies, []);
  assert.equal(b.total, 0);
  assert.equal(b.count, 0);
  assert.equal(b.offset, 0);
});

test("GET /api/v1/governance/policies — returns created policies", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, POLICY_PAYLOAD);
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, {
    ...POLICY_PAYLOAD,
    id: "p-deny-write",
    name: "Deny write",
    effect: "deny",
  });
  const { status, body } = await get(h.baseUrl, "/api/v1/governance/policies", h.adminCred);
  assert.equal(status, 200);
  const b = body as { policies: unknown[]; total: number };
  assert.equal(b.total, 2);
  assert.equal(b.policies.length, 2);
});

test("GET /api/v1/governance/policies?limit=1 — paginates correctly", async () => {
  const h = await buildHarness();
  after(() => h.close());
  for (let i = 0; i < 3; i++) {
    await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, {
      ...POLICY_PAYLOAD,
      id: `p-${i}`,
      name: `Policy ${i}`,
    });
  }
  const { status, body } = await get(h.baseUrl, "/api/v1/governance/policies?limit=1&offset=0", h.adminCred);
  assert.equal(status, 200);
  const b = body as { policies: unknown[]; total: number; count: number; limit: number; offset: number };
  assert.equal(b.total, 3);
  assert.equal(b.count, 1);
  assert.equal(b.limit, 1);
  assert.equal(b.offset, 0);
  assert.equal(b.policies.length, 1);
});

test("GET /api/v1/governance/policies?offset=2 — returns tail items", async () => {
  const h = await buildHarness();
  after(() => h.close());
  for (let i = 0; i < 3; i++) {
    await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, {
      ...POLICY_PAYLOAD,
      id: `p-pg-${i}`,
      name: `Policy ${i}`,
    });
  }
  const { body } = await get(h.baseUrl, "/api/v1/governance/policies?limit=10&offset=2", h.adminCred);
  const b = body as { policies: unknown[]; total: number; count: number; offset: number };
  assert.equal(b.total, 3);
  assert.equal(b.count, 1);
  assert.equal(b.offset, 2);
});

test("GET /api/v1/governance/policies — 403 without read permission", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/governance/policies", h.noPermCred);
  assert.equal(status, 403);
});

// ---------------------------------------------------------------------------
// POST /api/v1/governance/evaluate
// ---------------------------------------------------------------------------

test("POST /api/v1/governance/evaluate — deny when no policies", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/governance/evaluate", h.adminCred, {
    subject: "user-1",
    resource: "document",
    action: "read",
    roleIds: [],
  });
  assert.equal(status, 200);
  const b = body as { decision: string };
  assert.equal(b.decision, "deny");
});

test("POST /api/v1/governance/evaluate — allow after creating allow policy", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/governance/policies", h.adminCred, {
    id: "p-eval-allow",
    name: "Eval Allow",
    effect: "allow",
    actions: ["read"],
    resources: ["document"],
    conditions: [],
  });
  const { status, body } = await post(h.baseUrl, "/api/v1/governance/evaluate", h.adminCred, {
    subject: "user-1",
    resource: "document",
    action: "read",
    roleIds: [],
  });
  assert.equal(status, 200);
  const b = body as { decision: string };
  assert.equal(b.decision, "allow");
});

test("POST /api/v1/governance/evaluate — 400 when subject missing", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/governance/evaluate", h.adminCred, {
    resource: "doc",
    action: "read",
    roleIds: [],
  });
  assert.equal(status, 400);
});

test("POST /api/v1/governance/evaluate — 403 without evaluate permission", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/governance/evaluate", h.noPermCred, {
    subject: "u", resource: "r", action: "a", roleIds: [],
  });
  assert.equal(status, 403);
});
