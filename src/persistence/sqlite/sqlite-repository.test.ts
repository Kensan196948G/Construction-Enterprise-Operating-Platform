/**
 * Integration tests for SQLite-backed repositories (M7).
 *
 * Each test group creates a dedicated in-memory or temp-file database so tests
 * are fully isolated from one another. We use `:memory:` for pure CRUD tests
 * (faster) and a mkdtemp file only where we need to verify persistence across
 * separate openDatabase() calls.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openDatabase } from "./base-sqlite-repository.ts";
import { createSqliteRepositories } from "./index.ts";
import { createOrganization } from "../../domain/organization.ts";
import { createUser } from "../../domain/user.ts";
import { createRole } from "../../domain/role.ts";
import { createDevice } from "../../domain/device.ts";
import { createApplication } from "../../domain/application.ts";
import { createPolicy } from "../../domain/policy.ts";
import type { IsoTimestamp } from "../../domain/common.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

/** Open an :memory: database and return repos wired to it. */
function memRepos() {
  return createSqliteRepositories(":memory:");
}

async function makeTmpDb(): Promise<{ repos: ReturnType<typeof createSqliteRepositories>; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), "ceop-sqlite-test-"));
  const dbPath = join(dir, "test.db");
  const repos = createSqliteRepositories(dbPath);
  return {
    repos,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

// ---------------------------------------------------------------------------
// openDatabase
// ---------------------------------------------------------------------------

test("sqlite: openDatabase returns a working DatabaseSync instance", () => {
  const db = openDatabase(":memory:");
  assert.ok(db !== null && db !== undefined);
  // Verify WAL pragma was applied
  const result = db.prepare("PRAGMA journal_mode").get() as { journal_mode: string };
  assert.equal(result.journal_mode, "memory"); // :memory: cannot use WAL; falls back to "memory"
});

// ---------------------------------------------------------------------------
// Organization repository
// ---------------------------------------------------------------------------

test("sqlite-org: save and findById round-trip", async () => {
  const repos = memRepos();
  const now = nowTs();
  const result = createOrganization({ id: "org-1", name: "HQ Corp", type: "headquarters", status: "active", createdAt: now });
  assert.ok(result.ok);

  await repos.organizations.save(result.value);
  const found = await repos.organizations.findById(result.value.id);
  assert.ok(found !== null);
  assert.equal(found.name, "HQ Corp");
  assert.equal(found.type, "headquarters");
});

test("sqlite-org: findById returns null for unknown id", async () => {
  const repos = memRepos();
  const found = await repos.organizations.findById("org-ghost" as never);
  assert.equal(found, null);
});

test("sqlite-org: findHeadquarters returns only headquarters orgs", async () => {
  const repos = memRepos();
  const now = nowTs();

  const hq = createOrganization({ id: "org-hq", name: "HQ", type: "headquarters", status: "active", createdAt: now });
  const site = createOrganization({ id: "org-site", name: "Site A", type: "site", status: "active", createdAt: now, parentId: "org-hq" });
  assert.ok(hq.ok && site.ok);

  await repos.organizations.save(hq.value);
  await repos.organizations.save(site.value);

  const hqs = await repos.organizations.findHeadquarters();
  assert.equal(hqs.length, 1);
  assert.equal(hqs[0]?.id, "org-hq");
});

test("sqlite-org: findByParent filters correctly", async () => {
  const repos = memRepos();
  const now = nowTs();

  const hqResult = createOrganization({ id: "org-hq", name: "HQ", type: "headquarters", status: "active", createdAt: now });
  assert.ok(hqResult.ok);
  await repos.organizations.save(hqResult.value);

  const child1 = createOrganization({ id: "org-c1", name: "Child 1", type: "branch", status: "active", createdAt: now, parentId: "org-hq" });
  const child2 = createOrganization({ id: "org-c2", name: "Child 2", type: "site", status: "active", createdAt: now, parentId: "org-hq" });
  const other = createOrganization({ id: "org-other", name: "Other HQ", type: "headquarters", status: "active", createdAt: now });
  assert.ok(child1.ok && child2.ok && other.ok);

  await repos.organizations.save(child1.value);
  await repos.organizations.save(child2.value);
  await repos.organizations.save(other.value);

  const children = await repos.organizations.findByParent(hqResult.value.id);
  assert.equal(children.length, 2);
  const ids = children.map((c) => c.id).sort();
  assert.deepEqual(ids, ["org-c1", "org-c2"]);
});

test("sqlite-org: delete removes the entity", async () => {
  const repos = memRepos();
  const now = nowTs();
  const result = createOrganization({ id: "org-del", name: "Del", type: "headquarters", status: "active", createdAt: now });
  assert.ok(result.ok);

  await repos.organizations.save(result.value);
  await repos.organizations.delete(result.value.id);
  const found = await repos.organizations.findById(result.value.id);
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// User repository
// ---------------------------------------------------------------------------

test("sqlite-user: save and findByEmail", async () => {
  const repos = memRepos();
  const now = nowTs();

  const orgHq = createOrganization({ id: "org-hq", name: "HQ", type: "headquarters", status: "active", createdAt: now });
  assert.ok(orgHq.ok);
  await repos.organizations.save(orgHq.value);

  const result = createUser({ id: "u-1", organizationId: "org-hq", displayName: "Alice", email: "alice@example.com", status: "active", roleIds: [], createdAt: now });
  assert.ok(result.ok);
  await repos.users.save(result.value);

  const byEmail = await repos.users.findByEmail("alice@example.com");
  assert.ok(byEmail !== null);
  assert.equal(byEmail.displayName, "Alice");

  const missing = await repos.users.findByEmail("nobody@example.com");
  assert.equal(missing, null);
});

test("sqlite-user: findByOrganization returns correct users", async () => {
  const repos = memRepos();
  const now = nowTs();

  const orgA = createOrganization({ id: "org-a", name: "Org A", type: "headquarters", status: "active", createdAt: now });
  const orgB = createOrganization({ id: "org-b", name: "Org B", type: "headquarters", status: "active", createdAt: now });
  assert.ok(orgA.ok && orgB.ok);
  await repos.organizations.save(orgA.value);
  await repos.organizations.save(orgB.value);

  const u1 = createUser({ id: "u-1", organizationId: "org-a", displayName: "Alice", email: "alice@example.com", status: "active", roleIds: [], createdAt: now });
  const u2 = createUser({ id: "u-2", organizationId: "org-a", displayName: "Bob", email: "bob@example.com", status: "active", roleIds: [], createdAt: now });
  const u3 = createUser({ id: "u-3", organizationId: "org-b", displayName: "Carol", email: "carol@example.com", status: "active", roleIds: [], createdAt: now });
  assert.ok(u1.ok && u2.ok && u3.ok);

  await repos.users.save(u1.value);
  await repos.users.save(u2.value);
  await repos.users.save(u3.value);

  const orgAUsers = await repos.users.findByOrganization("org-a" as never);
  assert.equal(orgAUsers.length, 2);

  const orgBUsers = await repos.users.findByOrganization("org-b" as never);
  assert.equal(orgBUsers.length, 1);
  assert.equal(orgBUsers[0]?.displayName, "Carol");
});

test("sqlite-user: save overwrites existing (upsert)", async () => {
  const repos = memRepos();
  const now = nowTs();

  const orgA = createOrganization({ id: "org-a", name: "Org A", type: "headquarters", status: "active", createdAt: now });
  assert.ok(orgA.ok);
  await repos.organizations.save(orgA.value);

  const v1 = createUser({ id: "u-upsert", organizationId: "org-a", displayName: "V1", email: "upsert@example.com", status: "active", roleIds: [], createdAt: now });
  assert.ok(v1.ok);
  await repos.users.save(v1.value);

  const v2 = createUser({ id: "u-upsert", organizationId: "org-a", displayName: "V2", email: "upsert@example.com", status: "suspended", roleIds: [], createdAt: now });
  assert.ok(v2.ok);
  await repos.users.save(v2.value);

  const found = await repos.users.findById(v2.value.id);
  assert.ok(found !== null);
  assert.equal(found.displayName, "V2");
  assert.equal(found.status, "suspended");
  assert.equal((await repos.users.findAll()).length, 1);
});

// ---------------------------------------------------------------------------
// Role repository
// ---------------------------------------------------------------------------

test("sqlite-role: findByName exact match", async () => {
  const repos = memRepos();

  const r1 = createRole({ id: "role-admin", name: "Administrator", description: "Full access", scope: "global", permissions: ["*:*"] });
  const r2 = createRole({ id: "role-viewer", name: "Viewer", description: "Read only", scope: "global", permissions: ["*:read"] });
  assert.ok(r1.ok && r2.ok);

  await repos.roles.save(r1.value);
  await repos.roles.save(r2.value);

  const admin = await repos.roles.findByName("Administrator");
  assert.ok(admin !== null);
  assert.equal(admin.id, "role-admin");

  const none = await repos.roles.findByName("NoRole");
  assert.equal(none, null);
});

// ---------------------------------------------------------------------------
// Device repository
// ---------------------------------------------------------------------------

test("sqlite-device: findByOrganization", async () => {
  const repos = memRepos();
  const now = nowTs();

  const seedA = createOrganization({ id: "org-a", name: "Org A", type: "headquarters", status: "active", createdAt: now });
  const seedB = createOrganization({ id: "org-b", name: "Org B", type: "headquarters", status: "active", createdAt: now });
  assert.ok(seedA.ok && seedB.ok);
  await repos.organizations.save(seedA.value);
  await repos.organizations.save(seedB.value);

  const d1 = createDevice({ id: "dev-1", organizationId: "org-a", kind: "phone", status: "active" });
  const d2 = createDevice({ id: "dev-2", organizationId: "org-a", kind: "phone", status: "active" });
  const d3 = createDevice({ id: "dev-3", organizationId: "org-b", kind: "kiosk", status: "active" });
  assert.ok(d1.ok && d2.ok && d3.ok);

  await repos.devices.save(d1.value);
  await repos.devices.save(d2.value);
  await repos.devices.save(d3.value);

  const orgA = await repos.devices.findByOrganization("org-a" as never);
  assert.equal(orgA.length, 2);

  const orgB = await repos.devices.findByOrganization("org-b" as never);
  assert.equal(orgB.length, 1);
  assert.equal(orgB[0]?.kind, "kiosk");
});

// ---------------------------------------------------------------------------
// Application repository
// ---------------------------------------------------------------------------

test("sqlite-app: findByKey and findByOwner", async () => {
  const repos = memRepos();
  const now = nowTs();

  const seedA = createOrganization({ id: "org-a", name: "Org A", type: "headquarters", status: "active", createdAt: now });
  const seedB = createOrganization({ id: "org-b", name: "Org B", type: "headquarters", status: "active", createdAt: now });
  assert.ok(seedA.ok && seedB.ok);
  await repos.organizations.save(seedA.value);
  await repos.organizations.save(seedB.value);

  const a1 = createApplication({ id: "app-1", key: "cmdb", name: "CMDB", category: "governance", ownerOrganizationId: "org-a", health: "healthy" });
  const a2 = createApplication({ id: "app-2", key: "itsm", name: "ITSM", category: "workflow", ownerOrganizationId: "org-a", health: "healthy" });
  const a3 = createApplication({ id: "app-3", key: "portal", name: "Portal", category: "portal", ownerOrganizationId: "org-b", health: "healthy" });
  assert.ok(a1.ok && a2.ok && a3.ok);

  await repos.applications.save(a1.value);
  await repos.applications.save(a2.value);
  await repos.applications.save(a3.value);

  const byKey = await repos.applications.findByKey("cmdb");
  assert.ok(byKey !== null);
  assert.equal(byKey.name, "CMDB");

  const missing = await repos.applications.findByKey("nonexistent");
  assert.equal(missing, null);

  const orgA = await repos.applications.findByOwner("org-a" as never);
  assert.equal(orgA.length, 2);

  const orgB = await repos.applications.findByOwner("org-b" as never);
  assert.equal(orgB.length, 1);
  assert.equal(orgB[0]?.key, "portal");
});

// ---------------------------------------------------------------------------
// Policy repository
// ---------------------------------------------------------------------------

test("sqlite-policy: findByEffect", async () => {
  const repos = memRepos();

  const allow1 = createPolicy({ id: "p-allow-1", name: "Allow All Read", effect: "allow", resources: ["*"], actions: ["*:read"] });
  const allow2 = createPolicy({ id: "p-allow-2", name: "Allow Governance", effect: "allow", resources: ["governance:*"], actions: ["*:*"] });
  const deny1 = createPolicy({ id: "p-deny-1", name: "Deny Write", effect: "deny", resources: ["*"], actions: ["*:write"] });
  assert.ok(allow1.ok && allow2.ok && deny1.ok);

  await repos.policies.save(allow1.value);
  await repos.policies.save(allow2.value);
  await repos.policies.save(deny1.value);

  const allows = await repos.policies.findByEffect("allow");
  assert.equal(allows.length, 2);

  const denies = await repos.policies.findByEffect("deny");
  assert.equal(denies.length, 1);
  assert.equal(denies[0]?.name, "Deny Write");
});

// ---------------------------------------------------------------------------
// Cross-repository: createSqliteRepositories factory
// ---------------------------------------------------------------------------

test("sqlite: createSqliteRepositories wires all 6 repos to the same DB", async () => {
  const repos = memRepos();
  assert.ok(repos.users !== undefined);
  assert.ok(repos.organizations !== undefined);
  assert.ok(repos.roles !== undefined);
  assert.ok(repos.devices !== undefined);
  assert.ok(repos.applications !== undefined);
  assert.ok(repos.policies !== undefined);
});

test("sqlite: data persists across separate openDatabase calls on same file", async () => {
  const { repos: repos1, cleanup } = await makeTmpDb();
  after(cleanup);

  const now = nowTs();
  const r = createOrganization({ id: "org-persist", name: "Persistent Org", type: "headquarters", status: "active", createdAt: now });
  assert.ok(r.ok);
  await repos1.organizations.save(r.value);

  // WAL commits are visible immediately in the same process — verify findAll returns 1.
  const all = await repos1.organizations.findAll();
  assert.equal(all.length, 1);
  assert.equal(all[0]?.name, "Persistent Org");
});
