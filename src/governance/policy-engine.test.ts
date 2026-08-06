import { test } from "node:test";
import assert from "node:assert/strict";

import { type Result, createPolicy, createRole } from "../domain/index.ts";
import { type AccessRequest, evaluateAccess, resolvePermissions } from "./policy-engine.ts";

function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

const adminRole = unwrap(
  createRole({
    id: "role-admin",
    name: "Administrator",
    description: "full access",
    scope: "global",
    permissions: ["*:*"],
  }),
);

const viewerRole = unwrap(
  createRole({
    id: "role-viewer",
    name: "Viewer",
    description: "read-only on applications",
    scope: "organization",
    permissions: ["application:read"],
  }),
);

const baseRequest: AccessRequest = { subject: "u1", resource: "application", action: "read" };

test("resolvePermissions flattens and de-duplicates role permissions", () => {
  const permissions = resolvePermissions([viewerRole, viewerRole, adminRole]);
  assert.deepEqual([...permissions].sort(), ["*:*", "application:read"]);
});

test("default deny when nothing grants the request", () => {
  const decision = evaluateAccess({ request: baseRequest, permissions: [], policies: [] });
  assert.equal(decision.decision, "deny");
  assert.match(decision.reason, /default deny/);
});

test("RBAC permission grants access", () => {
  const decision = evaluateAccess({
    request: baseRequest,
    permissions: resolvePermissions([viewerRole]),
    policies: [],
  });
  assert.equal(decision.decision, "allow");
  assert.match(decision.reason, /role permission/);
});

test("wildcard permission grants any resource and action", () => {
  const decision = evaluateAccess({
    request: { subject: "u1", resource: "policy", action: "update" },
    permissions: resolvePermissions([adminRole]),
    policies: [],
  });
  assert.equal(decision.decision, "allow");
});

test("an explicit deny policy overrides an allow policy and RBAC grant", () => {
  const allowPolicy = unwrap(
    createPolicy({
      id: "p-allow",
      name: "allow read",
      effect: "allow",
      actions: ["read"],
      resources: ["application"],
    }),
  );
  const denyPolicy = unwrap(
    createPolicy({
      id: "p-deny",
      name: "deny read",
      effect: "deny",
      actions: ["read"],
      resources: ["application"],
    }),
  );
  const decision = evaluateAccess({
    request: baseRequest,
    permissions: resolvePermissions([adminRole]),
    policies: [allowPolicy, denyPolicy],
  });
  assert.equal(decision.decision, "deny");
  assert.deepEqual(decision.matchedPolicyIds, ["p-deny"]);
});

test("policy conditions gate the match against request attributes", () => {
  const sitePolicy = unwrap(
    createPolicy({
      id: "p-site",
      name: "allow on matching site",
      effect: "allow",
      actions: ["read"],
      resources: ["application"],
      conditions: [{ attribute: "siteId", equals: "site-42" }],
    }),
  );

  const onSite = evaluateAccess({
    request: { ...baseRequest, attributes: { siteId: "site-42" } },
    permissions: [],
    policies: [sitePolicy],
  });
  assert.equal(onSite.decision, "allow");

  const offSite = evaluateAccess({
    request: { ...baseRequest, attributes: { siteId: "site-99" } },
    permissions: [],
    policies: [sitePolicy],
  });
  assert.equal(offSite.decision, "deny");
});
