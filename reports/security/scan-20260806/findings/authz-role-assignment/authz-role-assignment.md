# Role Assignment Without Grantor Authority

## Executive Summary

The user and role CRUD endpoints validate that referenced roles and
permissions are syntactically valid, but never check that the caller is
authorized to grant them. A subject holding `user:write` and `role:write` —
without any admin permission — can create a role containing `*:*` and assign
it to any user, including themselves. Governance decisions (`POST
/api/v1/governance/evaluate`, the role-based dashboard, and any future
consumer of the governance core) then treat that user as fully privileged.

I reviewed revision `87fb6102` and reproduced the full sequence through the
HTTP interface with a key that carried only `user:read`, `user:write`,
`role:read`, `role:write`, and `governance:evaluate`. The governance engine
returned `allow` for `user:write` with the reason `granted by role permission:
*:*`.

## Background

Authorization in this codebase is two-layered. Route-level guards check
permission strings from the API key or JWT record:

```ts
export function hasPermission(ctx, resource, action): boolean {
  return (
    ctx?.permissions.some(
      (p) =>
        p === `${resource}:${action}` ||
        p === `${resource}:*` ||
        p === `*:${action}` ||
        p === "*:*",
    ) ?? false
  );
}
```

The governance core separately resolves a subject's permissions from their
role bindings (`resolvePermissions` in `src/governance/policy-engine.ts`) and
combines them with ABAC policies under deny-overrides. The platform's stated
purpose is to be the governance gate for the enterprise, so the user-role
model is security-critical configuration.

The create handlers accept role/permission data straight from the JSON body:

```ts
const result = createRole({
  id: str(req.body, "id") ?? randomUUID(),
  name,
  description: str(req.body, "description") ?? "",
  scope: (str(req.body, "scope") ?? "organization") as RoleScope,
  permissions: strArr(req.body, "permissions") ?? [],
});
```

`createRole` validates the permission string format (`toPermission`) and
requires at least one permission. It does not — and cannot — know whether the
caller may grant those permissions, because the caller's authority is never
passed into the domain layer.

## Vulnerability Details

The vulnerable sequence is three ordinary HTTP requests:

1. `POST /api/v1/roles` with `permissions: ["*:*"]`. The guard is
   `hasPermission(ctx, "role", "write")`, which any role manager passes. The
   response is `201`.
2. `PUT /api/v1/users/<attacker-user>` with `roleIds: ["<created-role>"]`.
   The guard is `hasPermission(ctx, "user", "write")`; the handler checks only
   that the referenced role exists. The response is `200`.
3. `POST /api/v1/governance/evaluate` with `roleIds: ["<created-role>"]` (or
   any consumer that resolves the user's roles) now sees `*:*`.

The same missing check applies to `POST /api/v1/users` (the creator chooses
the new user's roleIds), `PUT /api/v1/roles/:id` (permissions can be replaced
with any set), and the soft-delete/status transitions in the user handler.
There is no `grantor-holds-granted` comparison anywhere: not in the route
layer, not in the domain factories, and not in the persistence layer.

The impact boundary is the governance authorization model itself. The HTTP
route guards do *not* re-resolve roles from the user store — they read the
API key/JWT permission record — so a freshly assigned role does not by itself
upgrade the subject's API key. The tampered role model does, however, change
every governance decision computed from `roleIds`: dashboard visibility,
evaluation results, audit metadata, and any downstream service that calls the
governance API for access decisions. In a deployment that trusts those
decisions, this is an admin-equivalent grant.

## Exploitability Analysis

The realistic attacker is a delegated user/role administrator: an org manager
who may manage people and roles but must not grant `*:*`. The API's permission
design implicitly promises that separation (`role:write` exists as a distinct
token from `user:write`), but enforcement stops at the resource name.

The strongest route is self-assignment: with `user:write`, the attacker updates
their own `roleIds` to include the admin role they just created. This requires
no collusion and no second account. From the governance engine's perspective,
they are now `*:*`.

A second route is targeted privilege planting: assign the role to another user
or to a service account, which matters if a downstream component later
provisions API keys or consumes governance decisions for that subject.

A useful dead end to document: assigning the role does not mint a new API key,
and JWT permissions are copied from the API-key record at exchange time
(`src/api/routes/auth.ts`). So the finding does not immediately escalate the
HTTP route guards; it corrupts the authorization state that the governance
core is supposed to protect. That distinction is what keeps this at medium
rather than critical in a default deployment — but it also means the impact
grows with every consumer that trusts governance decisions, which is the
platform's stated direction.

## Proof of Concept

The PoC (`poc/poc.ts`) boots the real stack, provisions a key with
`user:write`/`role:write` (no admin permission), and runs:

```sh
node --experimental-strip-types poc/poc.ts
```

Relevant output from my run:

```
c1_create_role_star_star_status: 201
c1_create_role_star_star_body: permissions: ["*:*"], scope: "global"
c1_assign_admin_role_status: 200
c1_governance_evaluate_after_assign: {
  decision: "allow",
  reason: "granted by role permission: *:*"
}
```

The PoC is safe: in-memory repositories, loopback port, server closed at the
end.

## Remediation

The invariant to restore: **a grantor may only assign roles or permissions
whose effective authority is a subset of the grantor's own authority (or an
explicitly delegated grant).**

A minimal fix in the route layer before saving:

```ts
const granted = new Set(role.permissions);
const held = new Set(ctx.permissions);
const allHeld = [...granted].every((p) =>
  held.has(p) || held.has("*:*") || held.has("*:" + p.split(":")[1]) || held.has(p.split(":")[0] + ":*")
);
if (!allHeld) { forbidden(res, "granting permissions beyond your authority"); return; }
```

The same subset check belongs in `PUT /api/v1/users/:id` and
`POST /api/v1/users` for `roleIds`, comparing the target roles' permissions
against the grantor's, and in `PUT /api/v1/roles/:id` for permission
replacement. Scope must be checked too: an org-scoped grantor must not create
or assign a `global` role.

Regression tests should assert that a `user:write`/`role:write` key without
admin permissions receives `403` when creating a `*:*` role or assigning it,
and that the governance engine never sees the planted grant. Tests should
cover wildcard-holding admins (allowed) and org-scoped grantors (denied for
global roles).

## Summary

The platform's governance model can be rewritten by any delegated user/role
administrator, because the grant path never verifies grantor authority. I
reproduced the full create-assign-evaluate sequence over HTTP. The fix is a
subset check at the grant boundary plus scope compatibility, with regression
tests on both sides of the boundary.
