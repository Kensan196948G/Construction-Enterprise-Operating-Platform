/** Unit tests for the access-inventory domain (RBAC audit aggregation). */

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildAccessInventory } from "./access-inventory.ts";
import { createRole } from "./role.ts";
import { createUser } from "./user.ts";

const NOW = "2026-08-10T08:00:00.000Z";

function mustRole(input: Parameters<typeof createRole>[0]) {
  const r = createRole(input);
  assert.ok(r.ok, "role should be valid");
  if (!r.ok) throw new Error("unreachable");
  return r.value;
}

function mustUser(input: Parameters<typeof createUser>[0]) {
  const r = createUser(input);
  assert.ok(r.ok, "user should be valid");
  if (!r.ok) throw new Error("unreachable");
  return r.value;
}

test("buildAccessInventory resolves roles into permissions per user", () => {
  const admin = mustRole({
    id: "r-admin",
    name: "Admin",
    description: "",
    scope: "global",
    permissions: ["*:*"],
  });
  const auditor = mustRole({
    id: "r-auditor",
    name: "Auditor",
    description: "",
    scope: "organization",
    permissions: ["audit:read", "user:read"],
  });

  const alice = mustUser({
    id: "u-alice",
    organizationId: "org-1",
    displayName: "Alice",
    email: "alice@example.com",
    status: "active",
    roleIds: ["r-admin"],
    createdAt: NOW as never,
  });
  const bob = mustUser({
    id: "u-bob",
    organizationId: "org-1",
    displayName: "Bob",
    email: "bob@example.com",
    status: "active",
    roleIds: ["r-auditor"],
    createdAt: NOW as never,
  });

  const report = buildAccessInventory([alice, bob], [admin, auditor], NOW as never);

  assert.equal(report.generatedAt, NOW);
  assert.equal(report.entries.length, 2);
  assert.equal(report.summary.totalUsers, 2);
  assert.equal(report.summary.totalRoles, 2);

  const aliceEntry = report.entries.find((e) => e.userId === "u-alice");
  assert.ok(aliceEntry);
  assert.deepEqual(aliceEntry?.permissions, ["*:*"]);
  assert.equal(aliceEntry?.roles.length, 1);
  assert.equal(aliceEntry?.roles[0]?.name, "Admin");
  assert.deepEqual(aliceEntry?.unresolvedRoleIds, []);

  const bobEntry = report.entries.find((e) => e.userId === "u-bob");
  assert.ok(bobEntry);
  assert.deepEqual(bobEntry?.permissions, ["audit:read", "user:read"]);

  assert.equal(report.summary.usersByPermission["*:*"], 1);
  assert.equal(report.summary.usersByPermission["audit:read"], 1);
  assert.equal(report.summary.usersByPermission["user:read"], 1);
});

test("buildAccessInventory de-duplicates permissions across multiple roles", () => {
  const roleA = mustRole({
    id: "r-a",
    name: "A",
    description: "",
    scope: "site",
    permissions: ["project:read", "photo:read"],
  });
  const roleB = mustRole({
    id: "r-b",
    name: "B",
    description: "",
    scope: "site",
    permissions: ["photo:read", "photo:write"],
  });
  const user = mustUser({
    id: "u-1",
    organizationId: "org-1",
    displayName: "Multi Role",
    email: "multi@example.com",
    status: "active",
    roleIds: ["r-a", "r-b"],
    createdAt: NOW as never,
  });

  const report = buildAccessInventory([user], [roleA, roleB], NOW as never);
  const entry = report.entries[0];
  assert.ok(entry);
  assert.deepEqual(entry.permissions, ["project:read", "photo:read", "photo:write"]);
  assert.equal(entry.roles.length, 2);
});

test("buildAccessInventory surfaces unresolved role ids without throwing", () => {
  const user = mustUser({
    id: "u-orphan",
    organizationId: "org-1",
    displayName: "Orphan",
    email: "orphan@example.com",
    status: "active",
    roleIds: ["r-deleted"],
    createdAt: NOW as never,
  });

  const report = buildAccessInventory([user], [], NOW as never);
  const entry = report.entries[0];
  assert.ok(entry);
  assert.deepEqual(entry.permissions, []);
  assert.deepEqual(entry.roles, []);
  assert.deepEqual(entry.unresolvedRoleIds, ["r-deleted"]);
  assert.equal(Object.keys(report.summary.usersByPermission).length, 0);
});

test("buildAccessInventory returns an empty report for no users", () => {
  const report = buildAccessInventory([], [], NOW as never);
  assert.equal(report.entries.length, 0);
  assert.equal(report.summary.totalUsers, 0);
  assert.equal(report.summary.totalRoles, 0);
  assert.deepEqual(report.summary.usersByPermission, {});
});
