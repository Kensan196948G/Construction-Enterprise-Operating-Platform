import { test } from "node:test";
import assert from "node:assert/strict";

import {
  type IsoTimestamp,
  type Result,
  createApplication,
  createAuditEvent,
  createDevice,
  createOrganization,
  createPolicy,
  createRole,
  createUser,
  createWorkflow,
  toIsoTimestamp,
  toPermission,
} from "./index.ts";

/** Unwrap a Result in tests, failing loudly on the error branch. */
function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

const AT: IsoTimestamp = unwrap(toIsoTimestamp("2026-06-25T00:00:00.000Z"));

test("toIsoTimestamp rejects malformed timestamps", () => {
  assert.equal(toIsoTimestamp("not-a-date").ok, false);
  assert.equal(toIsoTimestamp("2026-06-25T00:00:00.000Z").ok, true);
});

test("createOrganization accepts a valid headquarters", () => {
  const org = unwrap(
    createOrganization({
      id: "org-hq",
      name: "HQ",
      type: "headquarters",
      status: "active",
      createdAt: AT,
    }),
  );
  assert.equal(org.name, "HQ");
  assert.equal(org.parentId, undefined);
});

test("createOrganization rejects a headquarters that has a parent", () => {
  const result = createOrganization({
    id: "org-hq",
    name: "HQ",
    type: "headquarters",
    status: "active",
    parentId: "org-root",
    createdAt: AT,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.error.some((i) => i.path === "parentId"));
  }
});

test("createUser rejects an invalid email", () => {
  const result = createUser({
    id: "u1",
    organizationId: "org-hq",
    displayName: "Alice",
    email: "not-an-email",
    status: "active",
    roleIds: ["role-admin"],
    createdAt: AT,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.error.some((i) => i.path === "email"));
  }
});

test("toPermission validates resource:action shape", () => {
  assert.equal(toPermission("application:read").ok, true);
  assert.equal(toPermission("*:*").ok, true);
  assert.equal(toPermission("audit:*").ok, true);
  assert.equal(toPermission("Application:Read").ok, false);
  assert.equal(toPermission("no-colon").ok, false);
});

test("createRole rejects empty permission sets and invalid tokens", () => {
  assert.equal(
    createRole({ id: "r", name: "R", description: "", scope: "global", permissions: [] }).ok,
    false,
  );
  const bad = createRole({
    id: "r",
    name: "R",
    description: "",
    scope: "global",
    permissions: ["BAD TOKEN"],
  });
  assert.equal(bad.ok, false);
});

test("createDevice forbids a retired device that stays assigned", () => {
  const result = createDevice({
    id: "d1",
    organizationId: "org-hq",
    kind: "tablet",
    status: "retired",
    assignedUserId: "u1",
  });
  assert.equal(result.ok, false);
});

test("createApplication enforces kebab-case keys", () => {
  assert.equal(
    createApplication({
      id: "a1",
      key: "Enterprise_Portal",
      name: "Portal",
      category: "portal",
      health: "healthy",
      ownerOrganizationId: "org-hq",
    }).ok,
    false,
  );
  const app = unwrap(
    createApplication({
      id: "a1",
      key: "enterprise-portal",
      name: "Portal",
      category: "portal",
      health: "healthy",
      ownerOrganizationId: "org-hq",
    }),
  );
  assert.equal(app.key, "enterprise-portal");
});

test("createWorkflow rejects duplicate step keys", () => {
  const result = createWorkflow({
    id: "w1",
    name: "Approval",
    type: "approval",
    status: "active",
    steps: [
      { key: "submit", name: "Submit", requiredPermission: "workflow:submit" },
      { key: "submit", name: "Submit again", requiredPermission: "workflow:submit" },
    ],
  });
  assert.equal(result.ok, false);
});

test("createPolicy defaults conditions to an empty list", () => {
  const policy = unwrap(
    createPolicy({
      id: "p1",
      name: "P",
      effect: "allow",
      actions: ["read"],
      resources: ["application"],
    }),
  );
  assert.deepEqual(policy.conditions, []);
});

test("createAuditEvent requires a known outcome and non-empty actor", () => {
  assert.equal(
    createAuditEvent({
      id: "e1",
      at: AT,
      actor: "",
      action: "read",
      resource: "app",
      outcome: "success",
    }).ok,
    false,
  );
  const event = unwrap(
    createAuditEvent({
      id: "e1",
      at: AT,
      actor: "u1",
      action: "read",
      resource: "app",
      outcome: "success",
    }),
  );
  assert.equal(event.outcome, "success");
  assert.deepEqual(event.metadata, {});
});
