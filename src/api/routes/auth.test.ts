/**
 * Integration tests for POST /api/v1/auth/token.
 *
 * Spins up a real HTTP server on a random port (port 0) so the tests exercise
 * the full middleware chain — rate limiter, body parsing, API key validation,
 * and JWT issuance.
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

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

interface AuthHarness {
  baseUrl: string;
  credential: string;
  subject: string;
  jwtIssuer: ReturnType<typeof createJwtIssuer>;
  close(): Promise<void>;
}

async function buildAuthHarness(): Promise<AuthHarness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const perms: readonly Permission[] = ["application:read" as Permission];
  const subject = "test-subject";
  const kv = createApiKey(subject, perms, apiKeyStore);

  const jwtIssuer = createJwtIssuer({ secret: generateJwtSecret() });

  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore,
    jwtIssuer,
  };

  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    credential: `${kv.key}:${kv.secret}`,
    subject,
    jwtIssuer,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      ),
  };
}

async function post(
  baseUrl: string,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const responseBody = await res.json().catch(() => null);
  return { status: res.status, body: responseBody, headers: res.headers };
}

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------

test("POST /api/v1/auth/token — valid credential returns 200 with JWT", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { status, body } = await post(h.baseUrl, "/api/v1/auth/token", {
    credential: h.credential,
  });

  assert.equal(status, 200);
  const b = body as { token: string; expiresIn: number; subject: string };
  assert.equal(typeof b.token, "string");
  assert.ok(b.token.split(".").length === 3, "token should be JWT with 3 parts");
  assert.equal(b.expiresIn, 3600);
  assert.equal(b.subject, h.subject);
});

test("POST /api/v1/auth/token — returned JWT is verifiable", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { body } = await post(h.baseUrl, "/api/v1/auth/token", {
    credential: h.credential,
  });

  const { token } = body as { token: string };
  const result = h.jwtIssuer.verify(token);
  assert.ok(result.ok);
  assert.equal(result.payload.sub, h.subject);
});

test("POST /api/v1/auth/token — response includes X-RateLimit headers", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { headers } = await post(h.baseUrl, "/api/v1/auth/token", {
    credential: h.credential,
  });

  assert.ok(headers.get("x-ratelimit-limit") !== null, "X-RateLimit-Limit should be present");
  assert.ok(headers.get("x-ratelimit-remaining") !== null, "X-RateLimit-Remaining should be present");
  assert.ok(headers.get("x-ratelimit-reset") !== null, "X-RateLimit-Reset should be present");
});

// ---------------------------------------------------------------------------
// Auth failure
// ---------------------------------------------------------------------------

test("POST /api/v1/auth/token — invalid credential returns 401", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { status, body } = await post(h.baseUrl, "/api/v1/auth/token", {
    credential: "bad-key:bad-secret",
  });

  assert.equal(status, 401);
  assert.equal((body as { error: string }).error, "Unauthorized");
});

test("POST /api/v1/auth/token — malformed credential (no colon) returns 401", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { status } = await post(h.baseUrl, "/api/v1/auth/token", {
    credential: "notanapikey",
  });

  assert.equal(status, 401);
});

// ---------------------------------------------------------------------------
// Bad request
// ---------------------------------------------------------------------------

test("POST /api/v1/auth/token — missing credential field returns 400", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { status } = await post(h.baseUrl, "/api/v1/auth/token", {});

  assert.equal(status, 400);
});

test("POST /api/v1/auth/token — numeric credential field returns 400", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { status } = await post(h.baseUrl, "/api/v1/auth/token", { credential: 42 });

  assert.equal(status, 400);
});

// ---------------------------------------------------------------------------
// JWT returned from /auth/token can authorize a protected route
// ---------------------------------------------------------------------------

test("POST /api/v1/auth/token — JWT can be used as Bearer on protected route", async (t) => {
  const h = await buildAuthHarness();
  t.after(() => h.close());

  const { body: tokenBody } = await post(h.baseUrl, "/api/v1/auth/token", {
    credential: h.credential,
  });
  const { token } = tokenBody as { token: string };

  const appsRes = await fetch(`${h.baseUrl}/api/v1/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(appsRes.status, 200, `expected 200 from JWT-authenticated request, got ${appsRes.status}`);
});
