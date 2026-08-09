/** Performance smoke: concurrent public requests must all succeed quickly. */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { AppContainer } from "../types.ts";

test("concurrent public requests all succeed within the smoke budget", async (t) => {
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore: new Map(),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const startedAt = Date.now();
  const results = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      fetch(`${baseUrl}${i % 2 === 0 ? "/health" : "/metrics"}`).then((r) => r.status),
    ),
  );
  const elapsedMs = Date.now() - startedAt;
  assert.ok(
    results.every((status) => status === 200),
    "all concurrent requests must return 200",
  );
  assert.ok(elapsedMs < 5_000, `smoke budget exceeded: ${elapsedMs}ms`);
});
