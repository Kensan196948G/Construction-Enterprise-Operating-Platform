/**
 * Integration tests for the global API rate limiter.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { AppContainer } from "../types.ts";

test("rate-limit: /api/v1/* is limited per socket IP while /health stays open", async (t) => {
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore: new Map(),
  };
  const server = createServer(
    { port: 0, rateLimit: { maxRequests: 2, windowMs: 60_000 } },
    container,
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  );
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;

  const first = await fetch(`${base}/api/v1/info`);
  assert.equal(first.status, 200);
  const second = await fetch(`${base}/api/v1/info`);
  assert.equal(second.status, 200);
  const third = await fetch(`${base}/api/v1/info`);
  assert.equal(third.status, 429);
  assert.equal(third.headers.get("x-ratelimit-limit"), "2");
  assert.equal(third.headers.get("x-ratelimit-remaining"), "0");

  // Public non-API health endpoints must not be blocked by the API limiter.
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
});
