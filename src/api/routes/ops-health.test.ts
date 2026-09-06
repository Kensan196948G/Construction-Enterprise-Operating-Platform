// FILE: src/api/routes/ops-health.test.ts
/**
 * Integration tests for the ops health dashboard (Issue #89):
 *   - GET /api/v1/ops/health   — aggregated JSON snapshot
 *   - GET /ops-health          — SSR shell
 *   - GET /api/assets/ops-health.js — the page's client script
 *
 * CEOP_HEALTH_LOG/CEOP_HEALTH_STATE are pointed at a scratch directory for
 * every test so the suite never reads the real cron probe's log on a host
 * that also runs it (see src/monitoring/ops-health.test.ts for the same
 * concern at the unit level).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

interface Harness {
  baseUrl: string;
  adminCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const admin = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);

  const container: AppContainer = {
    repositories,
    auditLog: new AuditLog(),
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: generateJwtSecret() }),
    storageTier: "in-memory",
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${admin.key}:${admin.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

/** Run `fn` with the health-probe log/state env vars pointed at an empty scratch dir. */
async function withScratchHealthProbeEnv<T>(fn: () => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "ceop-ops-health-route-"));
  const previousLog = process.env["CEOP_HEALTH_LOG"];
  const previousState = process.env["CEOP_HEALTH_STATE"];
  process.env["CEOP_HEALTH_LOG"] = join(dir, "health.log");
  process.env["CEOP_HEALTH_STATE"] = join(dir, "health-probe.state");
  try {
    return await fn();
  } finally {
    if (previousLog === undefined) delete process.env["CEOP_HEALTH_LOG"];
    else process.env["CEOP_HEALTH_LOG"] = previousLog;
    if (previousState === undefined) delete process.env["CEOP_HEALTH_STATE"];
    else process.env["CEOP_HEALTH_STATE"] = previousState;
    await rm(dir, { recursive: true, force: true });
  }
}

test("GET /api/v1/ops/health rejects anonymous callers", async (t) => {
  const harness = await buildHarness();
  t.after(harness.close);
  const res = await fetch(`${harness.baseUrl}/api/v1/ops/health`);
  assert.equal(res.status, 401);
});

test("GET /api/v1/ops/health returns a real aggregated snapshot for an authenticated caller", async (t) => {
  const harness = await buildHarness();
  t.after(harness.close);
  await withScratchHealthProbeEnv(async () => {
    const res = await fetch(`${harness.baseUrl}/api/v1/ops/health`, {
      headers: { Authorization: `Bearer ${harness.adminCred}` },
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      process: { pid: number; nodeVersion: string };
      database: { tier: string; status: string };
      healthProbe: { configured: boolean };
      gateway: { configured: boolean; services: unknown[] };
    };
    assert.equal(body.process.pid, process.pid);
    assert.equal(body.process.nodeVersion, process.version);
    assert.equal(body.database.tier, "in-memory");
    assert.equal(body.database.status, "connected");
    // No probe files were written in this scratch dir — must not be
    // fabricated as if the probe were configured.
    assert.equal(body.healthProbe.configured, false);
    assert.equal(body.gateway.configured, false);
    assert.deepEqual(body.gateway.services, []);
  });
});

test("GET /ops-health rejects anonymous access", async (t) => {
  const harness = await buildHarness();
  t.after(harness.close);
  const res = await fetch(`${harness.baseUrl}/ops-health`);
  assert.equal(res.status, 401);
});

test("GET /ops-health renders for an authenticated caller with an embedded JWT, never localStorage", async (t) => {
  const harness = await buildHarness();
  t.after(harness.close);
  const res = await fetch(`${harness.baseUrl}/ops-health`, {
    headers: { Authorization: `Bearer ${harness.adminCred}` },
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  assert.equal(
    res.headers.get("content-security-policy"),
    "default-src 'self'; style-src 'self'; script-src 'self' https://static.cloudflareinsights.com; img-src 'self' data:; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'",
  );
  const body = await res.text();
  assert.match(body, /運用ヘルス/);
  assert.match(body, /id="ceopToken" value="[^"]+"/);
  assert.match(body, /api\/assets\/ops-health\.js/);
  assert.doesNotMatch(body, /localStorage/);
});

test("GET /api/assets/ops-health.js is served publicly with security headers", async (t) => {
  const harness = await buildHarness();
  t.after(harness.close);
  const res = await fetch(`${harness.baseUrl}/api/assets/ops-health.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /javascript/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});
