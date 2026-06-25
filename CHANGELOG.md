# Changelog

All notable changes to the Construction Enterprise Operating Platform are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-25

First foundation release: a verifiable coordination layer for the platform.

### Added

- **Domain model** — the eight core domains (`organization`, `user`, `role`, `device`,
  `application`, `workflow`, `policy`, `audit-event`) with branded ids, exhaustive
  enums, and exception-free `Result`-based validation.
- **Governance Core**
  - `evaluateAccess` — access decisions with deny-overrides precedence
    (explicit deny > explicit allow > RBAC grant > default deny) plus ABAC conditions.
  - `AuditLog` — append-only, SHA-256 hash-chained audit trail with tamper detection.
- **Role-based dashboard** — `buildDashboard`, a pure read-model that filters
  governance / app-health / device / pending-approval data by viewer permission and
  reports withheld record counts (no silent redaction).
- **Adapter ports** — `CmdbPort`, `ItsmPort`, `ImsPort`, `LegalOpsPort`, `BcpPort`,
  `DocumentPort` integration contracts, with an in-memory `DocumentPort` reference adapter.
- **Tooling** — strict TypeScript, ESLint (flat config), Prettier, `node:test`,
  GitHub Actions CI, and a runnable `examples/quickstart.ts` demo.

### Quality

- typecheck, lint, build green; 31 unit + integration tests passing.

### Notes

- Runtime has **no production dependencies**; it runs on Node v22.6+ native TypeScript.
- Not yet production-ready: persistence, API gateway, and concrete adapters land in M4.
