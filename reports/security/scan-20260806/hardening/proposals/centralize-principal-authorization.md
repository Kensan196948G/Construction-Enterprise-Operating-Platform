# Security Hardening Proposal: Centralize Principal Authorization

## Decision

We should move authorization identity (who the caller is, which organization
they belong to, which role scope they hold) into a single resolved principal
used by every route, and enforce tenant scope plus grantor authority through
one owned boundary. Option 2 below, `central-principal-scope`, is my
recommendation under the current single-node deployment model.

## Executive Recommendation

The two validated findings share one structural root cause: authorization
facts are split between permission strings on the credential and role/scope
data in the store, and no component reconciles them. Option 1 (baseline)
patches each route locally. Option 2 introduces a resolved principal at
authentication time and an authorization service that every mutation route
calls before touching a repository. Option 3 (per-tenant service isolation)
is a heavier deployment-level change that we should keep in reserve.

I recommend Option 2: it fixes both findings at the control point where they
belong, preserves the current single-node deployment, and makes future
authorization bugs fail in one place instead of across twenty routes.

## Evidence

| Evidence | Finding | What it establishes |
| --- | --- | --- |
| `authz-tenant-scoping` | Cross-organization access through unenforced role scope | `hasPermission()` checks only `resource:action`; `ApiKeyContext` has no org; every repository call is org-blind |
| `authz-role-assignment` | Role assignment without grantor authority | Route guards check `user:write`/`role:write` but never compare granted permissions/scope against the grantor |

I inspected the route layer, the auth context, the domain factories, the
repositories, and the governance engine directly at revision `87fb6102`, and I
reproduced both behaviors through the HTTP interface (see the finding PoCs).

## Current Design And Failure Mode

The current design resolves a credential into `{subject, permissions}` and
then trusts every route to interpret those permission strings correctly.
Tenant scope lives only in the `Role` domain object, which is never loaded
during route authorization. Grant authority is nowhere: `createRole` and the
user handlers accept `roleIds`/`permissions` from the body and the only checks
are syntactic (non-empty, permission pattern, referenced role exists).

The failure mode is drift-by-convention: nothing forces a new route to apply
tenant filtering, and nothing forces a grant path to compare authority. The
two findings are the first two instances of that drift, not isolated mistakes.

## Desired Invariants

- Every authenticated request has exactly one resolved principal: subject,
  organization, effective role scope, and permission set.
- Every repository read or mutation is bounded by the principal's
  organization/site scope unless an explicit cross-tenant grant exists.
- A grantor may only create/assign roles or permissions whose authority is a
  subset of the grantor's own authority and whose scope is compatible.
- Governance decisions consume the same resolved principal as route guards.

## Constraints And Non-Goals

- Keep single-node SQLite/file/in-memory deployment working.
- Do not change the HTTP API surface (paths, bodies, responses) unless a 403
  message changes.
- Performance budget: the auth path already performs repository reads on
  demand; one user lookup per request is acceptable.
- Non-goal for this round: multi-tenant process isolation, external IdP
  integration, or replacing the policy engine.

## Before Architecture

See `diagrams/centralize-principal-authorization-before.mmd`. The router
checks a permission string, then calls repositories directly; the grant path
writes whatever the body says. The governance engine resolves roles only when
explicitly invoked, so it can disagree with route-level auth.

| Change | Before | After | Security consequence | Cost |
| --- | --- | --- | --- | --- |
| Principal identity | credential -> permission strings | credential -> resolved principal (subject, org, scope) | Route guards and governance consume the same identity | Auth-time user/role lookup |
| Tenant predicate | none | enforced at authorization service / repository boundary | Cross-org reads and writes blocked | Query signature change |
| Grant authority | body-provided roleIds/permissions persisted | subset + scope check before save | Role escalation blocked | One shared check |

## Options

### Option 1: Local Guards (baseline)

Patch each affected route: add an org predicate to every list/read/write and a
grantor-subset check to role/user create/update. This is the tactical fix with
the least structural change and the fastest delivery.

Security: it closes the two known paths. Performance and memory are neutral.
Reliability improves because bad grants fail before persistence. The cost is
recurrence: the next route that forgets the predicate reopens the boundary,
and the guard logic will be duplicated across ~20 handlers. Rollout is a
simple patch series with per-route tests.

### Option 2: Central Principal Scope (recommended)

Extend the auth context to a resolved principal at authentication time:
`{subject, organizationId, roleScopes, permissions}`. Introduce an
authorization service that owns (a) tenant predicates and (b) grant-authority
comparisons, and require mutation/list routes to call it before repository
access. Repositories gain tenant-bounded query methods (`findByOrganization`,
already present for users/devices/applications) used by default.

Security: both findings are closed at the control point, and future routes get
the boundary by construction. The governance engine can consume the same
principal, eliminating check/use divergence. Performance: one user+roles
lookup per request on the auth path — negligible at this scale, and cacheable.
Memory: negligible. Reliability: failures are centralized and testable.
Operability: one place to log/alert on denied cross-tenant access. Migration:
moderate — context type change, route refactor, repository signature changes —
but no data migration and no API surface change. Rollback: the old context
type can be reintroduced behind a flag, though tenant predicates should stay.

The main risk is developer buy-in: routes must stop calling repositories
directly. A lint rule or repository type that requires a tenant-scoped query
would enforce it.

### Option 3: Per-Tenant Service Isolation

Deploy one app/DB unit per organization (or per org with shared edge routing
by tenant header). Security: strongest containment — even a broken route
cannot reach another tenant's store. Costs are high: orchestration, per-tenant
provisioning, shared JWT/secret management, monitoring multiply, and the
current single-node SQLite/file model is abandoned. This is the right answer
only when tenant count and compliance requirements justify fleet
multiplication. It also does not remove the need for Option 2's grantor
checks inside each tenant unit.

## Comparison

| Dimension | Option 1 | Option 2 | Option 3 |
| --- | --- | --- | --- |
| Security | Closes known paths | Closes known paths + future routes | Strongest containment |
| Performance | Neutral | +1 user/role lookup per request | Network/edge hop per request |
| Memory | Neutral | Small context object | Per-tenant processes/databases |
| Reliability | Guard drift risk | Central failure point, well-tested | Complex failure modes |
| Operability | No new burden | One enforcement point, logs | Multi-tenant fleet operations |
| Migration | Small | Medium, no data migration | Large deployment change |
| Rollback | Easy | Easy (flag) | Hard |

## Recommendation

I recommend Option 2, `central-principal-scope`. It addresses both validated
findings at their shared root cause, fits the current architecture, and keeps
the deployment simple. Option 1 remains the correct short-term patch if the
team cannot absorb the route refactor immediately — but it should be treated
as a stopgap, with a follow-up ticket for Option 2. Option 3 should be
revisited only if tenant isolation requirements outgrow a single instance.

What would change my recommendation: a hard performance budget on the auth
path, a commitment to multi-tenant fleet deployment, or evidence that route
developers routinely bypass shared helpers.

## Evidence Coverage And Residual Risk

| Evidence | Effect | Tactical fix required |
| --- | --- | --- |
| `authz-tenant-scoping` — cross-org access | addressed by Options 1-3 | Yes, until the chosen option ships |
| `authz-role-assignment` — grantor authority | addressed by Options 1-3 | Yes, until the chosen option ships |

Residual risk after Option 2: a bug in the authorization service itself
becomes single-point-of-failure for all routes, which argues for keeping the
service small and exhaustively tested rather than growing it.

## Migration And Rollout

1. Add `organizationId`/`scope` to `ApiKeyContext`/`JwtContext`; resolve from
   the user record at auth time (API key subject is a user id).
2. Add repository tenant-bounded methods and a default tenant predicate.
3. Introduce the authorization service with grant-subset and scope checks.
4. Migrate routes one group at a time (devices, users, workflows, audit,
   dashboard lists) with regression tests per group.
5. Enable cross-org denial tests in CI.
6. Keep Option 1 guards in place until the group migration reaches them.

## Validation Plan

- Re-run both PoCs after each migration group; they must fail with 403.
- Add tests: org-scoped key cannot list/read/create/update other org records;
  non-admin user manager cannot create/assign `*:*` or global roles.
- Benchmark the auth path (requests/sec with and without the user lookup) to
  confirm the +1 lookup stays negligible.
- Audit all route handlers for direct `findAll()`/`findById()` calls that
  bypass the authorization service.

## Implementation Work Packages

1. Auth context and principal resolution (types, auth middleware, JWT verify).
2. Tenant-bounded repository methods + ports update.
3. Authorization service: `assertTenantScope()` and `assertGrantAuthority()`.
4. Route migration (devices, users, roles, workflows, applications,
   organizations, audit, dashboard).
5. Regression + PoC-based tests; CI integration.
6. Documentation of the new invariant in README/CLAUDE.md.

## Open Questions

- Should API keys be bound to an organization at provisioning time, or should
  the subject's current org always win?
- Should JWT claims carry the org, or should the server resolve it per
  request (revocation-friendlier but slower)?
- Do any planned downstream services need cross-tenant access that would
  require an explicit grant mechanism?
