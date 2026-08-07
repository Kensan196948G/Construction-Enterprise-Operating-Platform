/**
 * Integration tests for tenant scoping of the audit log.
 *
 * The audit log is a single platform-wide hash chain, so `audit:read` on an
 * organization-scoped credential used to expose every other tenant's actors,
 * resources and metadata. These tests pin the fail-closed behaviour: a scoped
 * credential sees only entries attributed to its own organization, a global
 * credential still sees the whole chain, and entries recorded before tenant
 * attribution existed are withheld from scoped credentials.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { createAuditEvent, auditEventId } from "../../domain/audit-event.ts";
import { createOrganization } from "../../domain/index.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

function unwrap<T>(r: { ok: boolean; value?: T }): T {
  if (!r.ok) throw new Error("factory failed");
  return r.value as T;
}

interface AuditEntryShape {
  readonly event: {
    readonly actor: string;
    readonly action: string;
    readonly metadata: Record<string, string>;
  };
}

interface AuditListBody {
  readonly entries: readonly AuditEntryShape[];
  readonly total: number;
}

const AUDIT_PERMS = [
  "audit:read",
  "user:read",
  "user:write",
  "organization:read",
  "governance:evaluate",
] as Permission[];

interface Harness {
  baseUrl: string;
  auditLog: AuditLog;
  orgACred: string;
  orgBCred: string;
  adminCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const now = new Date().toISOString() as IsoTimestamp;

  for (const id of ["org-a", "org-b"]) {
    await repositories.organizations.save(
      unwrap(
        createOrganization({
          id,
          name: id.toUpperCase(),
          type: "headquarters",
          status: "active",
          createdAt: now,
        }),
      ),
    );
  }

  const aKV = createApiKey("user-a", AUDIT_PERMS, apiKeyStore, "org-a");
  const bKV = createApiKey("user-b", AUDIT_PERMS, apiKeyStore, "org-b");
  const adminKV = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);

  const auditLog = new AuditLog();
  const container: AppContainer = {
    repositories,
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
    orgACred: `${aKV.key}:${aKV.secret}`,
    orgBCred: `${bKV.key}:${bKV.secret}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function req(
  method: string,
  baseUrl: string,
  path: string,
  auth: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** Create a user through the API so a real audit entry is recorded for that tenant. */
async function makeAuditableWrite(
  h: Harness,
  cred: string,
  orgId: string,
  email: string,
): Promise<void> {
  const r = await req("POST", h.baseUrl, "/api/v1/users", cred, {
    organizationId: orgId,
    displayName: email,
    email,
    status: "active",
    roleIds: [],
  });
  assert.equal(r.status, 201, `setup write failed: ${JSON.stringify(r.body)}`);
}

test("audit-scope: org-scoped credential sees only its own tenant's entries", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  await makeAuditableWrite(h, h.orgACred, "org-a", "a1@example.test");
  await makeAuditableWrite(h, h.orgBCred, "org-b", "b1@example.test");

  const asA = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.orgACred);
  assert.equal(asA.status, 200);
  const bodyA = asA.body as AuditListBody;
  assert.ok(bodyA.entries.length > 0, "org-a should see its own entries");
  for (const entry of bodyA.entries) {
    assert.equal(entry.event.metadata["organizationId"], "org-a");
    assert.notEqual(entry.event.actor, "user-b");
  }
  assert.equal(bodyA.total, bodyA.entries.length);

  const asB = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.orgBCred);
  const bodyB = asB.body as AuditListBody;
  for (const entry of bodyB.entries) {
    assert.equal(entry.event.metadata["organizationId"], "org-b");
  }

  // The two tenants' views must be disjoint.
  assert.equal(
    bodyA.entries.some((e) => e.event.actor === "user-b"),
    false,
  );
  assert.equal(
    bodyB.entries.some((e) => e.event.actor === "user-a"),
    false,
  );
});

test("audit-scope: global credential still sees the whole chain", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  await makeAuditableWrite(h, h.orgACred, "org-a", "a2@example.test");
  await makeAuditableWrite(h, h.orgBCred, "org-b", "b2@example.test");

  const asAdmin = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.adminCred);
  assert.equal(asAdmin.status, 200);
  const body = asAdmin.body as AuditListBody;
  const actors = new Set(body.entries.map((e) => e.event.actor));
  assert.ok(actors.has("user-a"), "admin should see org-a activity");
  assert.ok(actors.has("user-b"), "admin should see org-b activity");
  assert.equal(body.total, h.auditLog.size);
});

test("audit-scope: entries without tenant attribution are withheld from scoped credentials", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  // Simulates an entry sealed before tenant attribution existed.
  h.auditLog.append(
    unwrap(
      createAuditEvent({
        id: auditEventId("legacy-entry-0001"),
        at: new Date().toISOString() as IsoTimestamp,
        actor: "legacy-actor",
        action: "user:create",
        resource: "legacy-user",
        outcome: "success",
        metadata: {},
      }),
    ),
  );

  const asA = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.orgACred);
  const bodyA = asA.body as AuditListBody;
  assert.equal(
    bodyA.entries.some((e) => e.event.actor === "legacy-actor"),
    false,
    "untagged entries must fail closed for scoped credentials",
  );

  const asAdmin = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.adminCred);
  const bodyAdmin = asAdmin.body as AuditListBody;
  assert.ok(
    bodyAdmin.entries.some((e) => e.event.actor === "legacy-actor"),
    "global credentials retain full-chain visibility for integrity verification",
  );
});

test("audit-scope: tenant attribution keeps the hash chain verifiable", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  await makeAuditableWrite(h, h.orgACred, "org-a", "a3@example.test");
  await makeAuditableWrite(h, h.orgBCred, "org-b", "b3@example.test");

  const report = h.auditLog.verify();
  assert.equal(report.valid, true, "adding a metadata key must not break tamper evidence");
});

test("audit-scope: dashboard counters are tenant-scoped", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  await makeAuditableWrite(h, h.orgACred, "org-a", "a4@example.test");
  await makeAuditableWrite(h, h.orgBCred, "org-b", "b4@example.test");
  await makeAuditableWrite(h, h.orgBCred, "org-b", "b5@example.test");

  const asA = await req("GET", h.baseUrl, "/api/v1/dashboard", h.orgACred);
  assert.equal(asA.status, 200);
  const govA = (asA.body as { governance: { auditEvents: number } }).governance;

  const asAdmin = await req("GET", h.baseUrl, "/api/v1/dashboard", h.adminCred);
  const govAdmin = (asAdmin.body as { governance: { auditEvents: number } }).governance;

  assert.ok(
    govA.auditEvents < govAdmin.auditEvents,
    `scoped viewer must not see the platform-wide count (scoped=${govA.auditEvents}, global=${govAdmin.auditEvents})`,
  );
  assert.equal(govAdmin.auditEvents, h.auditLog.size);
});

test("audit-scope: token issuance is attributed to the credential's tenant", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: h.orgACred }),
  });
  assert.equal(res.status, 200);

  const tokenEvent = h.auditLog.entries.find((e) => e.event.action === "auth:token");
  assert.ok(tokenEvent, "token issuance must be audited");
  assert.equal(tokenEvent.event.metadata["organizationId"], "org-a");

  const asA = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.orgACred);
  const bodyA = asA.body as AuditListBody;
  assert.ok(
    bodyA.entries.some((e) => e.event.action === "auth:token"),
    "org-scoped viewer must see its own token issuance",
  );
});

test("audit-scope: governance evaluate is attributed to the caller's tenant", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req("POST", h.baseUrl, "/api/v1/governance/evaluate", h.orgACred, {
    subject: "user-a",
    resource: "application",
    action: "read",
    roleIds: [],
    attributes: {},
  });
  assert.equal(res.status, 200);

  const evaluateEvent = h.auditLog.entries.find((e) => e.event.action === "governance:evaluate");
  assert.ok(evaluateEvent, "evaluate must be audited");
  assert.equal(evaluateEvent.event.metadata["organizationId"], "org-a");

  const asA = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.orgACred);
  const bodyA = asA.body as AuditListBody;
  assert.ok(
    bodyA.entries.some((e) => e.event.action === "governance:evaluate"),
    "org-scoped viewer must see its own evaluation events",
  );
});
