import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { createApiKey } from "../../src/api/middleware/auth.ts";
import { createServer } from "../../src/api/server.ts";
import { toPermission } from "../../src/domain/role.ts";
import { AuditLog } from "../../src/governance/audit-log.ts";
import { createInMemoryRepositories } from "../../src/persistence/in-memory/index.ts";

const MALFORMED_JSON = ["{", "[1,", '{"x":NaN}', '{"x":"\\uZZZZ"}', "null trailing"];

test("QA-FUZZ-001: malformed JSON is rejected deterministically and the server remains healthy", async (t) => {
  const apiKeyStore = new Map();
  const permission = toPermission("project:write");
  assert.ok(permission.ok);
  const key = createApiKey("fuzz-test", [permission.value], apiKeyStore);
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: new AuditLog(), apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  for (const body of MALFORMED_JSON) {
    const response = await fetch(`${baseUrl}/api/v1/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}:${key.secret}`,
        "Content-Type": "application/json",
      },
      body,
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Bad Request",
      message: "request body must be valid JSON",
    });
  }
  assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
});
