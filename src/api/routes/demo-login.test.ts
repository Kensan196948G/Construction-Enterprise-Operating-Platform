/** Integration tests for the demo-only browser login (MVP review). */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

function envDemoMode(): void {
  process.env["NODE_ENV"] = "development";
  process.env["CEOP_SEED_RICH_DEMO"] = "true";
}

function envProduction(): void {
  process.env["NODE_ENV"] = "production";
  process.env["CEOP_SEED_RICH_DEMO"] = "true";
  process.env["CEOP_METRICS_TOKEN"] = "e".repeat(64);
}

async function buildServer(): Promise<{ baseUrl: string; close(): Promise<void> }> {
  const apiKeyStore: ApiKeyStore = new Map();
  createApiKey(
    "demo-admin",
    ["*:*"] as unknown as readonly Permission[],
    apiKeyStore,
    undefined,
    "demo-key",
    "demo-secret",
  );
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: "d".repeat(64), ttlSeconds: 3600 }),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

test("demo login: form page renders and login sets an HttpOnly session cookie", async (t) => {
  envDemoMode();
  const h = await buildServer();
  t.after(async () => {
    await h.close();
    delete process.env["NODE_ENV"];
    delete process.env["CEOP_SEED_RICH_DEMO"];
  });

  const page = await fetch(`${h.baseUrl}/demo-login`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await page.text(), /CEOP デモログイン/);

  const login = await fetch(`${h.baseUrl}/api/v1/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: "demo-key", secret: "demo-secret" }),
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /ceop_demo_session=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  const cookie = setCookie.split(";")[0] ?? "";

  const dashboard = await fetch(`${h.baseUrl}/dashboard`, {
    headers: { Cookie: cookie },
  });
  assert.equal(dashboard.status, 200);

  const anonymous = await fetch(`${h.baseUrl}/dashboard`);
  assert.equal(anonymous.status, 401);
});

test("demo login: invalid credentials are rejected without a cookie", async (t) => {
  envDemoMode();
  const h = await buildServer();
  t.after(async () => {
    await h.close();
    delete process.env["NODE_ENV"];
    delete process.env["CEOP_SEED_RICH_DEMO"];
    delete process.env["CEOP_METRICS_TOKEN"];
  });

  const login = await fetch(`${h.baseUrl}/api/v1/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: "demo-key", secret: "wrong-secret" }),
  });
  assert.equal(login.status, 401);
  assert.equal(login.headers.get("set-cookie"), null);

  const malformed = await fetch(`${h.baseUrl}/api/v1/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: "demo-key" }),
  });
  assert.equal(malformed.status, 400);
});

test("demo login: logout clears the session cookie", async (t) => {
  envDemoMode();
  const h = await buildServer();
  t.after(async () => {
    await h.close();
    delete process.env["NODE_ENV"];
    delete process.env["CEOP_SEED_RICH_DEMO"];
  });

  const logout = await fetch(`${h.baseUrl}/api/v1/auth/demo-logout`, { method: "POST" });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
});

test("demo mode redirects unauthenticated browser page loads to /demo-login", async (t) => {
  envDemoMode();
  const h = await buildServer();
  t.after(async () => {
    await h.close();
    delete process.env["NODE_ENV"];
    delete process.env["CEOP_SEED_RICH_DEMO"];
  });

  const page = await fetch(`${h.baseUrl}/dashboard`, {
    headers: { Accept: "text/html" },
    redirect: "manual",
  });
  assert.equal(page.status, 302);
  assert.equal(page.headers.get("location"), "/demo-login");

  // API-style requests keep the existing 401 JSON contract.
  const api = await fetch(`${h.baseUrl}/dashboard`);
  assert.equal(api.status, 401);
});

test("demo login routes are not registered in production", async (t) => {
  envProduction();
  const h = await buildServer();
  t.after(async () => {
    await h.close();
    delete process.env["NODE_ENV"];
    delete process.env["CEOP_SEED_RICH_DEMO"];
  });

  const page = await fetch(`${h.baseUrl}/demo-login`);
  assert.equal(page.status, 404);
  const login = await fetch(`${h.baseUrl}/api/v1/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: "demo-key", secret: "demo-secret" }),
  });
  assert.equal(login.status, 404);

  // Production never redirects page loads to the demo login.
  const dashboardPage = await fetch(`${h.baseUrl}/dashboard`, {
    headers: { Accept: "text/html" },
    redirect: "manual",
  });
  assert.equal(dashboardPage.status, 401);
});
