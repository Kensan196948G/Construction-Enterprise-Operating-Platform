# Security Review: Construction-Enterprise-Operating-Platform

## Scope

Repository-wide scan of the active runtime tree (99 files: src/, scripts/, Docker/compose, CI workflows, env template, OpenAPI). Threat model generated during Phase 1 (not externally provided). Parent-agent audit only: concurrency slots were fully occupied by sibling agents, so no ranking/file-review/validation/write-up sub-agents were dispatched; coverage is bounded accordingly and recorded in the work ledger.

- Scan mode: repository
- Target kind: git_worktree
- Target ID: dedd4e3fb917a3913ee7ffdfba58bb63cb58a3b8748f5e722820928748656d7a
- Revision: 87fb6102df5e0bc96af72208de9b611ed2ca86b0
- Snapshot digest: codex-security-snapshot/v1:sha256:806dfa4169510ceec5558cff53ef4ca065efc8246a505382bb0336ab3daf3b92
- Inventory strategy: repository
- Included paths: .
- Excluded paths: none
- Runtime or test status: Node v25.2.1 with --experimental-strip-types; app boots and HTTP reproduction ran successfully against in-memory repositories
- Artifacts reviewed: src/\*\*, scripts/\*\*, Dockerfile, docker-compose.yml, docker-compose.prod.yml, .env.example, .github/workflows/\*.yml, docs/openapi.yaml, package.json, pnpm-lock.yaml, state.json
- Scan context: Agent task payload arrived empty; security-scan role inferred from task name and team context (siblings: legacy_gap_analysis, ops_release_review).

Limitations and exclusions:
- Parent-agent-only review: usable worker slots were 3 of the 6 recommended, and all slots were occupied by sibling agents; no sub-agent sharding was used.
- Legacy-projects/\*\* excluded as reference trees (recorded in coverage.explicitExclusions).
- Test files reviewed as test-only surfaces; not read line-by-line (no runtime imports, no secrets).
- Deployment ingress/topology is outside the repository; exposure is inferred from Docker/compose.
- Excluded legacy-projects/\*\*: Reference/design trees, not runtime or build inputs; covered separately by sibling agent (legacy_gap_analysis)
- Excluded node_modules/\*\*, dist/\*\*, .git/\*\*: Vendored/build artifacts; lockfile reviewed, dist is generated
- Excluded \*\*/\*.test.ts: Test-only; verified not imported by runtime entrypoints; no hardcoded secrets
- Excluded examples/\*\*, .claude/\*\*: Dev/demo examples and agent config, not deployed
- Excluded README.md, CHANGELOG.md: Documentation; reviewed for claims, not runtime code

### Scan Summary

| Field | Value |
| --- | --- |
| Reportable findings | 2 |
| Severity mix | high: 1, medium: 1 |
| Confidence mix | high: 2 |
| Coverage | complete |
| Validation mode | realistic interface reproduction (live HTTP) + full-file code review |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

TypeScript coordination layer exposing an HTTP API (API-key HMAC + HS256 JWT auth), RBAC/ABAC governance core, tamper-evident audit log, and SQLite/file/in-memory persistence. Trust boundaries: untrusted HTTP clients, authenticated users/services, browsers, operators, persistence, and CI. Core invariants: authn/authz gates, deny-overrides, tenant boundaries, audit integrity, secret handling, bounded DoS surfaces.

### Assets

- API keys and JWTs
- platform data (orgs/users/roles/devices/apps/policies/workflows)
- governance decisions
- audit evidence
- operator configuration and secrets

### Trust Boundaries

- untrusted HTTP clients -\> gateway
- authenticated users -\> protected routes/policy engine
- browsers -\> SSR pages
- operators -\> env/config/CLI/storage
- persistence -\> repositories/audit
- developers/CI -\> source/lockfile/build

### Attacker Capabilities

- unauthenticated remote requests
- authenticated requests with granted permissions
- org/site-scoped credential misuse
- operator misconfiguration

### Security Objectives

- deny by default
- no cross-tenant access
- no privilege escalation
- tamper-evident audit
- no secret leakage
- bounded resource use

### Assumptions

- production requires CEOP_SQLITE_FILE and CEOP_JWT_SECRET
- rate limiter keys on socket.remoteAddress with trusted proxy SNAT
- no upload/email/outbound fetch features yet

## Findings

| Finding | Severity | Confidence | Detailed write-up |
| --- | --- | --- | --- |
| [Organization/site role scope is not enforced — scoped roles can read and mutate entities across all organizations](#finding-1) | high | high | [Open report](findings/authz-tenant-scoping/authz-tenant-scoping.md) |
| [Role and user mutation endpoints grant permissions without checking the grantor's authority](#finding-2) | medium | high | [Open report](findings/authz-role-assignment/authz-role-assignment.md) |

### Confidence Scale

| Label | Meaning |
| --- | --- |
| high | Direct evidence supports the finding with no material unresolved blocker. |
| medium | Evidence supports a plausible issue, but material runtime or reachability proof remains. |
| low | Evidence is incomplete and the item is retained only for explicit follow-up. |

<a id="finding-1"></a>

### [1] Organization/site role scope is not enforced — scoped roles can read and mutate entities across all organizations

| Field | Value |
| --- | --- |
| Severity | high |
| Confidence | high |
| Confidence rationale | Live HTTP reproduction against the real router and repositories plus a full route/repository inventory; no material counterevidence. |
| Category | authorization-bypass |
| CWE | CWE-284, CWE-862, CWE-639 |
| Affected lines | src/api/routes/governance.ts:33-47, src/api/types.ts:67-71, src/api/routes/dashboard.ts:81-89, src/api/routes/entity-crud.ts:342-347, src/api/routes/entity-crud.ts:349-387, src/api/routes/workflows.ts:92-115, src/persistence/ports.ts:25-30 |

#### Summary

See the [detailed technical write-up](findings/authz-tenant-scoping/authz-tenant-scoping.md).

#### Validation

See the [detailed technical write-up](findings/authz-tenant-scoping/authz-tenant-scoping.md).

#### Dataflow

See the [detailed technical write-up](findings/authz-tenant-scoping/authz-tenant-scoping.md).

#### Reachability

See the [detailed technical write-up](findings/authz-tenant-scoping/authz-tenant-scoping.md).

#### Severity

See the [detailed technical write-up](findings/authz-tenant-scoping/authz-tenant-scoping.md).

#### Remediation

See the [detailed technical write-up](findings/authz-tenant-scoping/authz-tenant-scoping.md).

<a id="finding-2"></a>

### [2] Role and user mutation endpoints grant permissions without checking the grantor's authority

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Live HTTP reproduction of the full create-assign-evaluate sequence plus full-file review of route, domain, and persistence layers. |
| Category | authorization-bypass |
| CWE | CWE-269, CWE-862 |
| Affected lines | src/api/routes/entity-crud.ts:189-197, src/api/routes/entity-crud.ts:233-235, src/api/routes/entity-crud.ts:284-290, src/api/routes/entity-crud.ts:314-315, src/api/routes/entity-crud.ts:162-210, src/api/routes/entity-crud.ts:212-239, src/api/routes/entity-crud.ts:276-303, src/api/routes/entity-crud.ts:305-319, src/governance/policy-engine.ts:32-44 |

#### Summary

See the [detailed technical write-up](findings/authz-role-assignment/authz-role-assignment.md).

#### Validation

See the [detailed technical write-up](findings/authz-role-assignment/authz-role-assignment.md).

#### Dataflow

See the [detailed technical write-up](findings/authz-role-assignment/authz-role-assignment.md).

#### Reachability

See the [detailed technical write-up](findings/authz-role-assignment/authz-role-assignment.md).

#### Severity

See the [detailed technical write-up](findings/authz-role-assignment/authz-role-assignment.md).

#### Remediation

See the [detailed technical write-up](findings/authz-role-assignment/authz-role-assignment.md).

## Structural Hardening

The scan also produced derived, unsealed design guidance based on the complete finding collection. These proposals describe options and tradeoffs; they do not indicate that any finding has been remediated.

[Open the structural hardening portfolio](hardening/hardening.md)

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Authentication (API key + JWT) | authn | No issue found | HMAC timing-safe compare; HS256 header/claims validation; jti revocation; production secret guard Evidence: artifacts/02_discovery/work_ledger.jsonl, artifacts/03_coverage/repository_coverage_ledger.md |
| Authorization — role/user grant boundary | authz/privilege | Reported | authz-role-assignment: grantor authority never checked on role/user mutations Evidence: artifacts/05_findings/authz-role-assignment/candidate_ledger.jsonl, artifacts/05_findings/authz-role-assignment/validation_report.md, artifacts/05_findings/authz-role-assignment/attack_path_analysis_report.md |
| Authorization — tenant/object isolation | authz/tenant | Reported | authz-tenant-scoping: role.scope decorative; endpoints org-blind Evidence: artifacts/05_findings/authz-tenant-scoping/candidate_ledger.jsonl, artifacts/05_findings/authz-tenant-scoping/validation_report.md, artifacts/05_findings/authz-tenant-scoping/attack_path_analysis_report.md |
| SQL/DDL injection | injection | No issue found | Prepared statements everywhere; identifiers allow-listed; static migrations Evidence: artifacts/02_discovery/work_ledger.jsonl, artifacts/03_coverage/repository_coverage_ledger.md |
| Command/code execution | RCE | Not applicable | No exec/eval/child_process sinks in runtime or scripts Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| SSRF/outbound network | network | Not applicable | No outbound HTTP client in runtime code Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Path traversal/file I/O | filesystem | No issue found | No HTTP-controlled paths reach fs; fixed filenames under operator env dirs Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| XSS/template injection | client | No issue found | Server/client escaping covers HTML text+attr; CSP present (unsafe-inline noted) Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Audit integrity | audit | No issue found | Hash chain + verify() cross-checks JSON and indexed columns; actor from authenticated subject Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Rate limiting/DoS | availability | No issue found | Sliding window per socket IP, 10k bucket cap, 1MiB body cap Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Secrets/config | secrets | No issue found | No hardcoded secrets; TTY guard; prod fail-fast; hashed API keys Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| CORS/CSRF/headers | web | No issue found | CORS opt-in; no cookie sessions; security headers + HSTS on SSR Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Supply chain/CI | build | No issue found | Frozen lockfile, zero runtime deps, pnpm audit gate, non-root container user Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Legacy reference tree | legacy | Not applicable | Excluded: not imported/deployed; sibling agent covers gap analysis Evidence: artifacts/03_coverage/repository_coverage_ledger.md |

## Open Questions And Follow Up

- Does deployment policy grant user:write/role:write to non-admin personnel?
  - Follow-up prompt: Review role provisioning policy and, if yes, re-rate authz-role-assignment as high and prioritize the grantor-subset fix.
- Is multi-organization tenancy on one instance the intended deployment?
  - Follow-up prompt: Confirm tenancy model; if yes, treat authz-tenant-scoping as high priority. RoleScope and seed roles suggest multi-tenant intent.
- The OpenAPI generator emits /api/v1/health while the router serves /health (checked-in docs/openapi.yaml is correct).
  - Follow-up prompt: Fix scripts/generate-openapi.ts:325 to emit /health and regenerate docs/openapi.yaml.
