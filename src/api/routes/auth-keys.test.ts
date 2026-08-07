/**
 * Integration tests for API key management (SEC-013):
 *   GET    /api/v1/auth/keys
 *   DELETE /api/v1/auth/keys/:keyId
 *
 * The management surface must be platform-level only (org-scoped credentials
 * are refused), must never leak the stored secret hash, and a revoked key must
 * stop authenticating immediately while the revocation itself stays auditable.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";
import type { Permission } from "../../domain/role.ts";

interface Harness {
  baseUrl: string;
  auditLog: AuditLog;
  adminCred: string;
  orgCred: string;
  noPermCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const authWrite = ["auth:write"] as Permission[];

  const admin = createApiKey("admin", authWrite, apiKeyStore);
  const org = createApiKey("org-admin", authWrite, apiKeyStore, "org-a");
  const viewer = createApiKey("viewer", ["dashboard:read"] as Permission[], apiKeyStore);

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
    auditLog,
    adminCred: `${admin.key}:${admin.secret}`,
    orgCred: `${org.key}:${org.secret}`,
    noPermCred: `${viewer.key}:${viewer.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function apiReq(
  method: string,
  baseUrl: string,
  path: string,
  auth: string,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${auth}` },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

test("auth-keys: list requires auth:write and never exposes the secret hash", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const ok = await apiReq("GET", h.baseUrl, "/api/v1/auth/keys", h.adminCred);
  assert.equal(ok.status, 200);
  const body = ok.body as { keys: Array<Record<string, unknown>> };
  assert.ok(Array.isArray(body.keys));
  assert.ok(body.keys.length >= 3, "all provisioned keys should be listed");
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /secretHash|secret_hash/, "secret hashes must never leak");
  assert.ok(
    body.keys.some((k) => k["organizationId"] === "org-a"),
    "org-scoped keys should carry their tenant in the listing",
  );

  const forbidden = await apiReq("GET", h.baseUrl, "/api/v1/auth/keys", h.orgCred);
  assert.equal(forbidden.status, 403, "org-scoped credentials must not manage platform keys");

  const noPerm = await apiReq("GET", h.baseUrl, "/api/v1/auth/keys", h.noPermCred);
  assert.equal(noPerm.status, 403);
});

test("auth-keys: revoke deletes the key, blocks its credential, and is audited", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const apiKeyStore: ApiKeyStore = new Map();
  const admin = createApiKey("admin", ["auth:write"] as Permission[], apiKeyStore);
  const targetKey = createApiKey("target", ["application:read"] as Permission[], apiKeyStore);
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
  const baseUrl = `http://127.0.0.1:${port}`;
  t.after(
    () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  );

  const targetCred = `${targetKey.key}:${targetKey.secret}`;
  const tokenBefore = await fetch(`${baseUrl}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: targetCred }),
  });
  assert.equal(tokenBefore.status, 200);

  const del = await apiReq(
    "DELETE",
    baseUrl,
    `/api/v1/auth/keys/${targetKey.key}`,
    `${admin.key}:${admin.secret}`,
  );
  assert.equal(del.status, 200);
  assert.deepEqual(del.body, { revoked: true, keyId: targetKey.key });

  const tokenAfter = await fetch(`${baseUrl}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: targetCred }),
  });
  assert.equal(tokenAfter.status, 401, "a revoked key must stop authenticating");

  const auditEntry = auditLog.entries.find((e) => e.event.action === "auth:key:delete");
  assert.ok(auditEntry, "key revocation must be recorded in the audit trail");
  assert.equal(auditEntry?.event.resource, targetKey.key);

  const missing = await apiReq(
    "DELETE",
    baseUrl,
    `/api/v1/auth/keys/${targetKey.key}`,
    `${admin.key}:${admin.secret}`,
  );
  assert.equal(missing.status, 404);
});
