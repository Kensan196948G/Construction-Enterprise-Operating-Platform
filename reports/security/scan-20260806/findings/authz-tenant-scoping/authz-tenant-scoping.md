# Cross-Organization Access Through Unenforced Role Scope

## Executive Summary

Construction Enterprise Operating Platform exposes an HTTP API whose permission
checks compare only `resource:action` strings. The domain model declares
`global`, `organization`, and `site` role scopes, and the seed data ships an
organization-scoped site-manager role, but nothing in the request path ever
consults that scope. As a result, an authenticated user holding, say,
`device:read`/`device:write` can list, create, update, and delete devices for
every organization in the deployment — and the same pattern repeats for users,
workflows, applications, policies, and audit records.

I reviewed revision `87fb6102` directly and reproduced the cross-organization
read and write through the real HTTP server on a loopback port with a
non-admin, org-scope-style API key. I did not run this against a live
deployment; the reproduction used the application's own in-memory repositories
and seeded organizations.

## Background

The platform is a TypeScript coordination layer with a `node:http` router
(`src/api/router.ts`), API-key and JWT authentication
(`src/api/middleware/auth.ts`, `src/api/middleware/jwt.ts`), and a domain model
whose `Role` carries a `scope` field:

```ts
export const ROLE_SCOPES = ["global", "organization", "site"] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];
```

The seed data in `src/persistence/seed.ts` describes the intended deployment
shape: a Site Manager with `scope: "organization"` and `device:write`,
`workflow:write`, and `audit:read`, plus a Field Operator with `scope: "site"`
and read permissions. So the product clearly models the idea that a manager at
one organization must not see or change another organization's field devices.

The authenticated context, however, is only:

```ts
export interface ApiKeyContext {
  readonly keyId: string;
  readonly subject: string;
  readonly permissions: readonly Permission[];
}
```

There is no `organizationId`, no role scope, and no user-lookup at the
authorization layer.

## Vulnerability Details

Every protected route funnels through `hasPermission` in
`src/api/routes/governance.ts`:

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

This is the closest control, and it is the whole control: permission strings
only. The list endpoint for devices is representative:

```ts
router.get("/api/v1/devices", async (req, ctx, res) => {
  if (!hasPermission(ctx, "device", "read")) { ... 403 ... }
  const all = await container.repositories.devices.findAll();
  const pg = paginate(all, parsePagination(req.query));
  writeJson(res, 200, { devices: pg.items, ... });
});
```

`findAll()` returns every record in the store. The create/update/delete
handlers behave the same way: they check `device:write`, then call
`repositories.devices.findById(...)` / `save()` / `delete()` without any
organization predicate. The write handlers do validate that an `assignedUserId`
belongs to the device's organization, but that is an entity-internal reference
check, not a caller-scoping check.

The same org-blind pattern is present in:

- `src/api/routes/dashboard.ts` — `GET /api/v1/organizations`, `/users`,
  `/applications`, `/devices`
- `src/api/routes/entity-crud.ts` — users, roles, organizations, devices,
  applications
- `src/api/routes/workflows.ts` — workflow list/CRUD
- `src/api/routes/governance.ts` — audit log and policy endpoints

## Exploitability Analysis

The minimal attacker is any authenticated subject whose API key or JWT carries
a resource permission, even when the role that granted that permission was
scoped to a single organization or site. The seed site-manager role is exactly
this shape. From there the exploit is ordinary API usage:

1. `GET /api/v1/devices` returns every organization's devices (verified).
2. `POST /api/v1/devices` with `organizationId: "org-hq"` creates a record in
   an organization the caller was not scoped to (verified, HTTP 201).
3. `PUT /api/v1/devices/<id>` mutates that cross-organization record
   (verified, HTTP 200).

The same route set exposes users, workflows, applications, policies, and the
audit trail. An org-scoped user manager with `user:read` can enumerate every
user in the deployment; with `user:write` they can change any user's status or
role bindings. An org-scoped operator with `audit:read` can read the
compliance audit trail of every organization.

One alternative route to the same boundary is the dashboard: the SSR page and
`/api/v1/dashboard` filter by permission, not by organization, so a site
manager sees health and status data for all orgs. The dashboard's hidden-count
transparency reports records withheld by *permission*, never by tenant.

The strongest counterargument is that the API may be intended as
single-tenant in some deployments. That reading is hard to reconcile with the
existence of `RoleScope`, the org-validated references in the write handlers,
and the seed site-manager role; the code has the vocabulary of tenant
boundaries but no enforcement. If multi-organization use is intended at all,
this is a direct cross-tenant data exposure and tampering primitive.

## Proof of Concept

The PoC (`poc/poc.ts`) boots the real application stack on `127.0.0.1:4871`,
provisions a key with only `device:read`, `device:write`, `application:read`,
`workflow:read`, `workflow:write`, and `audit:read`, then performs:

```sh
node --experimental-strip-types poc/poc.ts
```

Representative output from my run:

```
c2_devices_before_orgs: [ { id: "device-tablet-01", organizationId: "org-site-01" } ]
c2_create_device_in_org_hq_status: 201
c2_update_device_in_org_hq_status: 200
c2_create_user_in_org_site_status: 201
c2_users_visible: user-admin(org-hq), user-viewer(org-hq), user-site-x(org-site-01)
```

The PoC is safe to run locally: it uses the in-memory repositories, binds a
loopback port, and closes the server afterwards. It does not touch the
repository tree or any persistent store.

## Remediation

The invariant to restore: **a request's effective authority must include the
subject's organization/site scope, and every repository read or mutation must
be bounded by that scope.**

The smallest coherent fix is to make the authenticated context carry the
caller's resolved organization (and role scope), then thread a tenant predicate
through every route:

```ts
interface ApiKeyContext {
  readonly keyId: string;
  readonly subject: string;
  readonly permissions: readonly Permission[];
  readonly organizationId?: OrganizationId; // resolved at auth time
}
```

and filter in the repositories or a shared helper:

```ts
const all = await repositories.devices.findByOrganization(ctx.organizationId);
```

Regression tests should exercise a scoped key against two seeded
organizations and assert that list/create/update/delete cannot cross the
boundary. The same tests should cover users, workflows, applications, and the
audit endpoint, and should be run for both API-key and JWT credentials.

## Summary

The platform models tenant boundaries but never enforces them. Any
authenticated subject with a resource permission can read and mutate records
across every organization, which turns an org-scoped manager into a
platform-wide data and state-change actor. I reproduced the read and write
paths over HTTP; the fix requires adding an organization dimension to the
authenticated principal and to every repository query, then locking it in with
cross-organization regression tests.
