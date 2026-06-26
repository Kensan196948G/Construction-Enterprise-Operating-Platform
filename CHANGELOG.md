# Changelog

All notable changes to the Construction Enterprise Operating Platform are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Security

- **Timing attack (Critical)** — HMAC hash comparison in `auth.ts` now uses
  `crypto.timingSafeEqual` instead of `!==` to prevent timing side-channel attacks.
- **DoS — body size (High)** — `router.ts` enforces a 1 MiB request-body limit; oversized
  bodies are rejected before buffering to prevent heap exhaustion.
- **Missing authorization on audit log (High)** — `GET /api/v1/governance/audit` now requires
  `audit:read` (or `*:*` / `*:read`) permission; unauthenticated callers receive 403.
- **Missing authorization on policy listing (High)** — `GET /api/v1/governance/policies` now
  requires `policy:read` permission.
- **Silent audit failure (High)** — governance evaluate no longer silently discards audit event
  creation errors; failures are logged for investigation.
- **Content-Security-Policy (High)** — SSR pages now include `Content-Security-Policy: default-src 'self'`.
- **Demo key logging (High)** — API key credential printing in `app.ts` is gated behind
  `NODE_ENV !== "production"` to prevent secret leakage in production logs.

---

## [0.2.0] - 2026-06-27

Second milestone release: HTTP API Gateway, Server-Side Rendered frontend, persistence layer,
and Docker production packaging.

### Added

- **HTTP API Gateway** (`src/api/`)
  - `Router` — lightweight path-parameter router on `node:http` primitives (no framework).
  - `createServer()` — CORS-aware HTTP server factory wiring all route groups.
  - `GET /health` — public liveness probe for load balancers and Kubernetes probes.
  - `GET /api/v1/info` — build info (name, version, environment).
  - `GET /api/v1/dashboard` — role-filtered dashboard JSON via Governance Core.
  - `GET /api/v1/organizations` — organisation listing.
  - `GET /api/v1/users` — user listing.
  - `GET /api/v1/applications` — application listing.
  - `GET /api/v1/devices` — device listing.
  - `GET /api/v1/governance/policies` — policy listing.
  - `GET /api/v1/governance/audit` — tamper-evident audit log (`?limit` up to 200).
  - `POST /api/v1/governance/evaluate` — RBAC+ABAC access decision endpoint; every
    evaluation is automatically recorded to the audit log.

- **API key authentication middleware** (`src/api/middleware/auth.ts`)
  - `Bearer keyId:secret` credential format; secrets stored as HMAC-SHA256 only (never plaintext).
  - Constant-time comparison to resist timing attacks.

- **Server-Side Rendered frontend** (`src/web/`)
  - `GET /` — 302 redirect to `/dashboard`.
  - `GET /dashboard` — HTML dashboard page (role-based, SSR, guest-scoped view).
  - `GET /governance` — HTML governance management page (policy list, SSR).
  - Security response headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

- **In-Memory Persistence Layer** (`src/persistence/in-memory/`)
  - Generic `InMemoryRepository<T>` implementing `findAll` / `findById` / `save` / `delete`.
  - Concrete repositories: `OrganizationRepository`, `UserRepository`, `RoleRepository`,
    `DeviceRepository`, `ApplicationRepository`, `PolicyRepository`.

- **Application bootstrap** (`src/app.ts`)
  - `createApp()` — wires repositories, audit log, API key store, and deterministic demo seed
    data into an `AppContainer`. Each call returns an independent in-memory container.
  - `start(port?)` — binds the HTTP server with graceful SIGTERM / SIGINT shutdown.

- **Production start script** (`scripts/start.ts`)
  - Launched via `node --experimental-strip-types scripts/start.ts` (no build step needed).
  - Reads `PORT`, `NODE_ENV`, `LOG_LEVEL`, `PLATFORM_NAME` from environment.

- **Docker packaging** (`Dockerfile`, `docker-compose.yml`)
  - Multi-stage build: `build` stage (tsc compile) + `runtime` stage (zero npm deps in image).
  - Non-root user (`ceop:ceop`, uid 1001) for least-privilege security.
  - `HEALTHCHECK` using curl against `/health`.
  - `docker-compose.yml` for local development with source volume mounts.

### Changed

- `src/index.ts` — public re-exports extended with `adapters` namespace (`v0.1.0` had
  `domain`, `governance`, `dashboard`; `v0.2.0` adds explicit `adapters` export).
- Package `version` bumped to `0.2.0`.

### Quality

- Test count increased from 31 to **45** (14 new API + server integration tests).
- typecheck, lint, build, and all 45 tests remain green.
- Docker image verified: multi-stage build compiles cleanly; runtime image has zero npm deps.

### Notes

- Persistence is still in-memory; a persistent store (PostgreSQL / SQLite) is planned for M6.
- API key lifecycle (rotation, expiry) is not yet implemented; demo keys are ephemeral per process.
- Concrete external adapters (CMDB, ITSM, etc.) are planned for M6.

---

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
