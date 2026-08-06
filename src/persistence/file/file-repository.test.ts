/**
 * Integration tests for file-backed repositories (M6).
 *
 * Each test uses an isolated temporary directory created with mkdtemp so writes
 * are never shared between tests or left in the source tree.  The tmp directory
 * is removed in an `after` hook even when the test fails.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BaseFileRepository, ensureDataDir } from "./base-file-repository.ts";
import { createFileRepositories } from "./index.ts";
import { createOrganization } from "../../domain/organization.ts";
import { createUser } from "../../domain/user.ts";
import { createRole } from "../../domain/role.ts";
import type { IsoTimestamp } from "../../domain/common.ts";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "ceop-test-"));
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

// ---------------------------------------------------------------------------
// BaseFileRepository: raw CRUD
// ---------------------------------------------------------------------------

test("file-repo: starts empty when file does not exist (ENOENT)", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  // Use a concrete subclass wrapper for testing.
  class TestRepo extends BaseFileRepository<{ id: string; name: string }> {
    constructor(d: string) { super(d, "items.json"); }
  }
  const repo = new TestRepo(dir);
  const all = await repo.findAll();
  assert.deepEqual(all, []);
});

test("file-repo: save then findById returns the entity", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  class TestRepo extends BaseFileRepository<{ id: string; value: number }> {
    constructor(d: string) { super(d, "items.json"); }
  }
  const repo = new TestRepo(dir);

  await repo.save({ id: "item-1", value: 42 });
  const found = await repo.findById("item-1");
  assert.deepEqual(found, { id: "item-1", value: 42 });
});

test("file-repo: findById returns null for unknown id", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  class TestRepo extends BaseFileRepository<{ id: string }> {
    constructor(d: string) { super(d, "items.json"); }
  }
  const repo = new TestRepo(dir);
  const found = await repo.findById("nonexistent");
  assert.equal(found, null);
});

test("file-repo: findAll returns all saved entities", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  class TestRepo extends BaseFileRepository<{ id: string; n: number }> {
    constructor(d: string) { super(d, "items.json"); }
  }
  const repo = new TestRepo(dir);

  await repo.save({ id: "a", n: 1 });
  await repo.save({ id: "b", n: 2 });
  await repo.save({ id: "c", n: 3 });

  const all = await repo.findAll();
  assert.equal(all.length, 3);
  const ids = all.map((x) => x.id).sort();
  assert.deepEqual(ids, ["a", "b", "c"]);
});

test("file-repo: save overwrites existing entity with same id", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  class TestRepo extends BaseFileRepository<{ id: string; value: string }> {
    constructor(d: string) { super(d, "items.json"); }
  }
  const repo = new TestRepo(dir);

  await repo.save({ id: "x", value: "original" });
  await repo.save({ id: "x", value: "updated" });
  const found = await repo.findById("x");
  assert.equal(found?.value, "updated");
  assert.equal((await repo.findAll()).length, 1);
});

test("file-repo: delete removes the entity", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  class TestRepo extends BaseFileRepository<{ id: string }> {
    constructor(d: string) { super(d, "items.json"); }
  }
  const repo = new TestRepo(dir);

  await repo.save({ id: "del-me" });
  await repo.delete("del-me");
  assert.equal(await repo.findById("del-me"), null);
  assert.equal((await repo.findAll()).length, 0);
});

test("file-repo: data persists across repository instances", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  class TestRepo extends BaseFileRepository<{ id: string; label: string }> {
    constructor(d: string) { super(d, "items.json"); }
  }

  const repo1 = new TestRepo(dir);
  await repo1.save({ id: "persist-1", label: "hello" });

  // New instance, fresh cache — must reload from disk.
  const repo2 = new TestRepo(dir);
  const found = await repo2.findById("persist-1");
  assert.deepEqual(found, { id: "persist-1", label: "hello" });
});

// ---------------------------------------------------------------------------
// ensureDataDir
// ---------------------------------------------------------------------------

test("ensureDataDir: creates nested directories", async () => {
  const base = await makeTmpDir();
  after(() => rm(base, { recursive: true, force: true }));

  const nested = join(base, "a", "b", "c");
  await ensureDataDir(nested);

  class TestRepo extends BaseFileRepository<{ id: string }> {
    constructor() { super(nested, "t.json"); }
  }
  const repo = new TestRepo();
  await repo.save({ id: "x" });
  assert.deepEqual(await repo.findById("x"), { id: "x" });
});

// ---------------------------------------------------------------------------
// Concrete domain repositories (via createFileRepositories)
// ---------------------------------------------------------------------------

test("file-repo: Organization save and findById", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  const repos = await createFileRepositories(dir);
  const now = nowTs();
  const orgResult = createOrganization({
    id: "org-test-1",
    name: "Test HQ",
    type: "headquarters",
    status: "active",
    createdAt: now,
  });
  assert.ok(orgResult.ok);
  const org = orgResult.value;
  await repos.organizations.save(org);

  const found = await repos.organizations.findById(org.id);
  assert.ok(found !== null);
  assert.equal(found.name, "Test HQ");
});

test("file-repo: Organization findHeadquarters", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  const repos = await createFileRepositories(dir);
  const now = nowTs();

  const hqResult = createOrganization({ id: "org-hq", name: "HQ", type: "headquarters", status: "active", createdAt: now });
  const siteResult = createOrganization({ id: "org-site", name: "Site", type: "site", status: "active", createdAt: now, parentId: "org-hq" });
  assert.ok(hqResult.ok && siteResult.ok);
  await repos.organizations.save(hqResult.value);
  await repos.organizations.save(siteResult.value);

  const hqs = await repos.organizations.findHeadquarters();
  assert.equal(hqs.length, 1);
  assert.equal(hqs[0]?.id, "org-hq");
});

test("file-repo: User findByEmail", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  const repos = await createFileRepositories(dir);
  const now = nowTs();

  const userResult = createUser({
    id: "u-1",
    organizationId: "org-hq",
    displayName: "Alice",
    email: "alice@example.com",
    status: "active",
    roleIds: [],
    createdAt: now,
  });
  assert.ok(userResult.ok);
  await repos.users.save(userResult.value);

  const found = await repos.users.findByEmail("alice@example.com");
  assert.ok(found !== null);
  assert.equal(found.displayName, "Alice");

  const notFound = await repos.users.findByEmail("nobody@example.com");
  assert.equal(notFound, null);
});

test("file-repo: Role findByName", async () => {
  const dir = await makeTmpDir();
  after(() => rm(dir, { recursive: true, force: true }));

  const repos = await createFileRepositories(dir);

  const roleResult = createRole({
    id: "role-admin",
    name: "Administrator",
    description: "Full access",
    scope: "global",
    permissions: ["*:*"],
  });
  assert.ok(roleResult.ok);
  await repos.roles.save(roleResult.value);

  const found = await repos.roles.findByName("Administrator");
  assert.ok(found !== null);
  assert.equal(found.id, "role-admin");

  const notFound = await repos.roles.findByName("NonExistent");
  assert.equal(notFound, null);
});
