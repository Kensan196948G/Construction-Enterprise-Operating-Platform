/**
 * Runnable SDK example — exercises the generated TypeScript client (sdk/)
 * against a real (in-process) CEOP API server.
 *
 *   node examples/sdk-usage.ts   (Node v22.6+, native TypeScript)
 *
 * The SDK itself is generated from docs/openapi.yaml:
 *
 *   pnpm run sdk:gen
 *
 * It boots a throwaway server on an ephemeral port, provisions an
 * admin-scoped API key, then drives a full organization CRUD round trip
 * through `CeopClient` — the same client an external service or frontend
 * would use against a deployed CEOP instance.
 */
import { createServer } from "../src/api/server.ts";
import { createApiKey } from "../src/api/middleware/auth.ts";
import { createInMemoryRepositories } from "../src/persistence/in-memory/index.ts";
import { AuditLog } from "../src/governance/audit-log.ts";
import { resolvePermissions } from "../src/governance/policy-engine.ts";
import { createRole } from "../src/domain/index.ts";
import type { ApiKeyStore } from "../src/api/types.ts";
import { CeopClient } from "../sdk/index.ts";

function must<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!result.ok) {
    throw new Error(`validation failed: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

// 1. Boot a throwaway server (in-memory persistence) on an ephemeral port.
const apiKeyStore: ApiKeyStore = new Map();
const adminRole = must(
  createRole({
    id: "r-admin",
    name: "Admin",
    description: "",
    scope: "global",
    permissions: ["*:*"],
  }),
);
const credential = createApiKey("sdk-demo", resolvePermissions([adminRole]), apiKeyStore);

const server = createServer(
  { port: 0 },
  { repositories: createInMemoryRepositories(), auditLog: new AuditLog(), apiKeyStore },
);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (address === null || typeof address === "string") throw new Error("server did not bind a port");

try {
  // 2. Point the generated client at it. `token` accepts either a JWT from
  //    POST /api/v1/auth/token or a raw "keyId:secret" API key credential.
  const client = new CeopClient({
    baseUrl: `http://127.0.0.1:${address.port}`,
    token: `${credential.key}:${credential.secret}`,
  });

  console.log("health =>", await client.getHealth());

  // 3. Full CRUD round trip, fully typed end to end.
  const created = await client.createOrganization({
    name: "Acme Construction",
    type: "headquarters",
  });
  console.log("created organization =>", created.id, created.name);

  const listed = await client.listOrganizations({ limit: 10 });
  console.log("organizations on record =>", listed.total);

  const fetched = await client.getOrganization(created.id);
  console.log("fetched organization status =>", fetched.status);

  const updated = await client.updateOrganization(created.id, { status: "suspended" });
  console.log("updated organization status =>", updated.status);

  await client.deleteOrganization(created.id);
  console.log("deleted organization =>", created.id);
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
