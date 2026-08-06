# Security Hardening Review: Construction Enterprise Operating Platform

## Evidence Basis

This portfolio is derived from the completed security scan of revision
`87fb6102` (scan id `scan_ceop_87fb6102_20260806`). Two reportable findings:

- **Cross-organization access through unenforced role scope**
  (`authz-tenant-scoping`) — `hasPermission()` checks only `resource:action`
  tokens, and no endpoint applies the caller's organization/site scope.
- **Role assignment without grantor authority** (`authz-role-assignment`) —
  `roleIds` and `permissions` from request bodies are persisted without
  comparing them to the grantor's authority.

Both were reproduced over the real HTTP interface; PoCs live under
`artifacts/05_findings/*/poc/`.

## Constraints

Balanced profile: fix security without changing the public API or abandoning
the single-node SQLite/file/in-memory deployment model. No measured latency or
memory budget was supplied.

## Opportunity Portfolio

| Opportunity | Evidence | Options | Recommendation | Proposal |
| --- | --- | --- | --- | --- |
| Centralize principal authorization | Cross-org access (`authz-tenant-scoping`) + role assignment (`authz-role-assignment`) | 1. Local route guards (baseline) · 2. Central principal + authorization service · 3. Per-tenant service isolation | Option 2 (central principal scope) | [proposals/centralize-principal-authorization.md](proposals/centralize-principal-authorization.md) |

The two findings share a structural condition: authorization facts are split
between permission strings on the credential and role/scope data in the
store, and no component reconciles them. Fixing only the two observed routes
would leave the same drift available to the next route; resolving a complete
principal at the auth boundary and enforcing tenant scope and grant authority
through one service closes the class, not just the instances.

## Recommendation Summary

I recommend Option 2, `central-principal-scope`: extend the authenticated
context to carry the resolved subject, organization, and role scope, and make
all repository access and grant mutations go through an authorization service
that owns tenant predicates and grantor-subset checks. It addresses both
findings at the control point where they belong, keeps the deployment model,
and makes future authorization bugs fail in one place.

Option 1 (local guards) is the correct short-term patch if the route refactor
cannot land immediately, but it should be tracked as a stopgap. Option 3
(per-tenant isolation) is reserved for when tenant count or compliance
requirements justify fleet multiplication; it does not remove the need for
the grant checks.

What would change the recommendation: a hard auth-path performance budget, a
commitment to multi-tenant fleet deployment, or evidence that shared helpers
are routinely bypassed by route developers.

## Next Decisions

1. Approve the tactical patch set (Option 1) for immediate release, or go
   straight to the structural change (Option 2).
2. Decide whether API keys are bound to an organization at provisioning time
   or whether the subject's current org always wins.
3. Decide whether JWT claims carry the org or the server resolves it per
   request.
4. Re-run both PoCs after each migration group; they must return 403.
