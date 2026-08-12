/**
 * Integration tests for the daily report console UI (/daily-reports).
 *
 * The page is an SSR entry point for field staff, so three properties are
 * pinned here: anonymous access is rejected, callers without
 * `daily-report:read` are rejected, and an authorised caller receives the
 * page with a short-lived JWT embedded in a hidden input (never localStorage).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

const UI_PATH = "/daily-reports";

interface Harness {
  baseUrl: string;
  adminCred: string;
  noPermCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const admin = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);
  const noPerm = createApiKey("no-perm", ["user:read"] as Permission[], apiKeyStore);

  const container: AppContainer = {
    repositories,
    auditLog: new AuditLog(),
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: generateJwtSecret() }),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${admin.key}:${admin.secret}`,
    noPermCred: `${noPerm.key}:${noPerm.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function getUi(baseUrl: string, cred?: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${baseUrl}${UI_PATH}`, {
    headers: cred !== undefined ? { Authorization: `Bearer ${cred}` } : {},
  });
  return { status: res.status, body: await res.text() };
}

test("daily-reports UI rejects anonymous access", async () => {
  const harness = await buildHarness();
  try {
    const result = await getUi(harness.baseUrl);
    assert.equal(result.status, 401);
  } finally {
    await harness.close();
  }
});

test("daily-reports UI rejects callers without daily-report:read", async () => {
  const harness = await buildHarness();
  try {
    const result = await getUi(harness.baseUrl, harness.noPermCred);
    assert.equal(result.status, 403);
  } finally {
    await harness.close();
  }
});

test("daily-reports UI renders for an authorised caller with an embedded JWT", async () => {
  const harness = await buildHarness();
  try {
    const result = await getUi(harness.baseUrl, harness.adminCred);
    assert.equal(result.status, 200);
    assert.match(result.body, /日報管理/);
    assert.match(result.body, /id="ceopToken" value="[^"]+"/);
    assert.match(result.body, /api\/assets\/daily-reports\.js/);
    assert.doesNotMatch(result.body, /localStorage/);
  } finally {
    await harness.close();
  }
});
