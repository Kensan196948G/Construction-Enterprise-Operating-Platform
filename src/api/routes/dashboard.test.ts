/**
 * Authorization integration tests for dashboard list endpoints.
 *
 * Spins up a real HTTP server on a random OS-assigned port so the tests exercise
 * the full middleware/router/handler chain — the same path a real client traverses.
 * Each test gets an isolated server instance; `server.close()` is called in every
 * `after` hook to guarantee port cleanup even on assertion failure.
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
// Shared test harness
// ---------------------------------------------------------------------------

interface Harness {
  baseUrl: string;
  adminCredential: string;
  viewerCredential: string;
  unauthenticated: null;
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
      name: "Viewer",
      description: "",
      scope: "global",
      permissions: ["application:read", "device:read", "audit:read"],
    }),
  );

  // Admin: full wildcard permission
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);

  // Viewer: read-only on applications and devices only (not organizations or users)
  const viewerKV = createApiKey("viewer-subject", resolvePermissions([viewerRole]), apiKeyStore);

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
    adminCredential: `${adminKV.key}:${adminKV.secret}`,
    viewerCredential: `${viewerKV.key}:${viewerKV.secret}`,
    unauthenticated: null,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function get(
  baseUrl: string,
  path: string,
  credential: string | null,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (credential !== null) {
    headers["Authorization"] = `Bearer ${credential}`;
  }
  const res = await fetch(`${baseUrl}${path}`, { headers });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// GET /api/v1/organizations  — requires organization:read (admin only)
// ---------------------------------------------------------------------------

test("GET /api/v1/organizations — admin receives 200", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/organizations", h.adminCredential);
  assert.equal(status, 200);
});

test("GET /api/v1/organizations — viewer receives 403", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/organizations", h.viewerCredential);
  assert.equal(status, 403);
  assert.equal((body as { error: string }).error, "Forbidden");
});

test("GET /api/v1/organizations — unauthenticated receives 401", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/organizations", null);
  assert.equal(status, 401);
});

// ---------------------------------------------------------------------------
// GET /api/v1/users  — requires user:read (admin only)
// ---------------------------------------------------------------------------

test("GET /api/v1/users — admin receives 200", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/users", h.adminCredential);
  assert.equal(status, 200);
});

test("GET /api/v1/users — viewer receives 403", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/users", h.viewerCredential);
  assert.equal(status, 403);
  assert.equal((body as { error: string }).error, "Forbidden");
});

test("GET /api/v1/users — unauthenticated receives 401", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/users", null);
  assert.equal(status, 401);
});

// ---------------------------------------------------------------------------
// GET /api/v1/applications  — requires application:read (admin + viewer)
// ---------------------------------------------------------------------------

test("GET /api/v1/applications — admin receives 200", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/applications", h.adminCredential);
  assert.equal(status, 200);
});

test("GET /api/v1/applications — viewer receives 200", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/applications", h.viewerCredential);
  assert.equal(status, 200);
});

test("GET /api/v1/applications — unauthenticated receives 401", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/applications", null);
  assert.equal(status, 401);
});

// ---------------------------------------------------------------------------
// GET /api/v1/devices  — requires device:read (admin + viewer)
// ---------------------------------------------------------------------------

test("GET /api/v1/devices — admin receives 200", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/devices", h.adminCredential);
  assert.equal(status, 200);
});

test("GET /api/v1/devices — viewer receives 200", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/devices", h.viewerCredential);
  assert.equal(status, 200);
});

test("GET /api/v1/devices — unauthenticated receives 401", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/devices", null);
  assert.equal(status, 401);
});

// ---------------------------------------------------------------------------
// Response shape sanity check
// ---------------------------------------------------------------------------

test("GET /api/v1/organizations — response includes count and organizations array", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/organizations", h.adminCredential);
  assert.equal(status, 200);
  const b = body as { organizations: unknown[]; count: number };
  assert.ok(Array.isArray(b.organizations), "organizations should be an array");
  assert.equal(typeof b.count, "number");
  assert.equal(b.count, b.organizations.length);
});
