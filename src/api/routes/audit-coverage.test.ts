/**
 * Integration tests for audit coverage of mutating routes and JWT revocation.
 *
 * The platform's governance promise depends on every mutation leaving a
 * tamper-evident audit trail. These tests assert that CRUD mutations and
 * authentication events are recorded and that the log remains verifiable.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { createRole } from "../../domain/index.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

interface Harness {
  baseUrl: string;
  adminCred: string;
  auditLog: AuditLog;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const adminRole = createRole({
    id: "r-admin-audit",
    name: "Audit Admin",
    description: "",
    scope: "global",
    permissions: ["*:*"],
  });
  if (!adminRole.ok) throw new Error("admin role invalid");
  const adminKV = createApiKey("admin-audit", resolvePermissions([adminRole.value]), apiKeyStore);

  const auditLog = new AuditLog();
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog,
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: generateJwtSecret() }),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    auditLog,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function req(
  method: string,
  baseUrl: string,
  path: string,
  auth: string | null,
  body?: unknown,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth !== null) headers["Authorization"] = `Bearer ${auth}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json, headers: res.headers };
}

test("audit: CRUD mutation is recorded with authenticated actor", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req("POST", h.baseUrl, "/api/v1/organizations", h.adminCred, {
    name: "Audited Org",
    type: "headquarters",
  });
  assert.equal(res.status, 201);

  const actions = h.auditLog.entries.map((e) => e.event.action);
  assert.ok(actions.includes("organization:create"), `expected organization:create in ${actions}`);
  const entry = h.auditLog.entries.find((e) => e.event.action === "organization:create");
  assert.equal(entry?.event.actor, "admin-audit");
  assert.equal(entry?.event.outcome, "success");
  assert.equal(h.auditLog.verify().valid, true);
});

test("audit: token issuance is recorded and JWT revocation invalidates the token", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const tokenRes = await req("POST", h.baseUrl, "/api/v1/auth/token", null, {
    credential: h.adminCred,
  });
  assert.equal(tokenRes.status, 200);
  const token = (tokenRes.body as { token: string }).token;

  assert.ok(
    h.auditLog.entries.some((e) => e.event.action === "auth:token"),
    "auth:token should be audited",
  );

  const revokeRes = await req("POST", h.baseUrl, "/api/v1/auth/revoke", token);
  assert.equal(revokeRes.status, 200);
  assert.equal((revokeRes.body as { revoked: boolean }).revoked, true);
  assert.ok(
    h.auditLog.entries.some((e) => e.event.action === "auth:revoke"),
    "auth:revoke should be audited",
  );

  const after = await req("GET", h.baseUrl, "/api/v1/dashboard", token);
  assert.equal(after.status, 401, "revoked JWT must be rejected");
  assert.equal(h.auditLog.verify().valid, true);
});

test("audit: API responses include baseline security headers", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req("GET", h.baseUrl, "/health", null);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.equal(res.headers.get("cache-control"), "no-store");
});
