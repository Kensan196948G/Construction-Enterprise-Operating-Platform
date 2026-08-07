# Changelog

All notable changes to the Construction Enterprise Operating Platform are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.6.2] - 2026-08-07

Audit log tenant isolation release.

### Security

- **監査ログのテナント分離（G-18 / P1）** — 監査ログはプラットフォーム全体で
  1 本のハッシュ連鎖であるため、組織スコープ付き資格情報に `audit:read` を
  付与すると他テナントの actor / resource / metadata が閲覧可能だった。
  `recordAudit()` が解決済み context からテナントを `metadata` へ付与し、
  `GET /api/v1/governance/audit` と dashboard の `auditEvents` /
  `deniedAccessEvents` を自組織へ絞り込む。グローバル資格情報は全体可視の
  ままで、プラットフォーム全体の完全性検証は維持される。
  属性付与前の既存エントリはスコープ付き資格情報から不可視（fail-closed）。
  ハッシュ定義は不変のため既存エントリの検証性に影響なし。migration 不要。

### Changed

- `GET /api/v1/governance/audit` の OpenAPI 記述にテナント絞込み挙動を追記。

### Quality

- 監査テナント分離の回帰テスト 5 件を追加（231/231 pass）。修正を戻すと
  該当 3 件が fail することを確認済み（vacuous test でないことの実証）。
- `PLATFORM_VERSION` と Dockerfile の `org.opencontainers.image.version` ラベルの
  一致を検証する回帰テストを追加。バージョンの実体は `src/version.ts` /
  `package.json` / `Dockerfile` の 3 箇所にあるが、これまでテストは前 2 者しか
  照合しておらず、イメージラベルだけが古いまま出荷されうる状態だった（232/232 pass）。

## [0.6.1] - 2026-08-06

WebUI design refresh and hardening release.

### Added

- **Claude-inspired WebUI** — dashboard/governance pages redesigned with a warm
  paper palette, terracotta accent, serif headings, and generous whitespace.
- **External static assets** — `src/web/static/app.css` / `app.js` served from
  `/assets/*`; inline `<style>`/`<script>` blocks removed.
- **SSR session token** — dashboard/governance pages embed a short-lived JWT so
  client-side auto-refresh and audit/policy fetches are authenticated.

### Security

- **CSP hardened** — `unsafe-inline` removed: `default-src 'self'; style-src
'self'; script-src 'self'` (closes SEC-009 backlog item).
- Static assets served with `X-Content-Type-Options: nosniff` and short cache.

### Deploy

- Deployed to production at **https://ceop.mirai-dx-platform.com** (Docker on
  192.168.0.185 + Cloudflare Tunnel `ceop`, systemd `cloudflared-ceop.service`).
- SQLite migrations 001–005 applied; admin/viewer API keys provisioned and
  stored outside the repository (root-only files under `/home/kensan/.ceop/`).
- Daily backup (02:15 JST) and health/ready check (02:30 JST) scheduled via cron.

## [0.6.0] - 2026-08-06

Production readiness release: version unification, CRUD/auth audit coverage,
JWT revocation endpoint, schema consolidation, dependency audit fix, and
operations documentation for the first main-branch release.

### Added

#### Production Readiness (v0.6.0)

- **Version single-source-of-truth** — `src/version.ts` + `PLATFORM_VERSION` guard test; `package.json`, `/api/v1/info`, OpenAPI, SSR UI, and Docker labels unified to `0.6.0`.
- **OpenAPI license corrected** — previously declared `MIT`; now matches the proprietary/UNLICENSED status of the private repository (`LICENSE.md` added).
- **README CI badge fixed** — pointed at the correct GitHub repository.
- **Audit coverage for mutations** — every CRUD mutation (organizations/users/roles/devices/applications), policy CRUD, workflow CRUD, and authentication events (`auth:token`, `auth:revoke`) now append tamper-evident audit events with the authenticated actor (`src/api/audit.ts`).
- **JWT revocation endpoint** — `POST /api/v1/auth/revoke` revokes the caller's current JWT via the persistent revocation store (`auth:write` permission required).
- **Migration 004** — consolidates `workflows`/`revoked_jtis` into the migration set and rebuilds domain tables with foreign-key constraints (works on fresh and legacy databases; verified with `PRAGMA foreign_key_check`).
- **Dependency audit clean** — pnpm overrides resolve the 7 high-severity devDependency advisories (brace-expansion, js-yaml); `pnpm audit --audit-level=high` reports 0 vulnerabilities.
- **API response hardening** — JSON responses now carry `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Cache-Control: no-store`.
- **JWT claim validation** — tokens with `iat >= exp` are rejected as malformed.
- **Readiness probe** — `GET /health/ready` verifies the active persistence tier (in addition to liveness).
- **Audit log pagination** — `GET /api/v1/governance/audit` now supports `offset` and returns `total`/`limit`.
- **Global API rate limit** — `/api/v1/*` is limited per socket IP (default 300 req/min, configurable via `CEOP_RATE_LIMIT_MAX` / `CEOP_RATE_LIMIT_WINDOW_MS`).
- **Migration runner tests** — `applyMigrations()` is now importable and covered by integration tests (idempotency, schema, FK enforcement).
- **SQLite backup script** — `scripts/sqlite-backup.ts` writes a consistent `VACUUM INTO` snapshot and replaces the destination atomically.
- **Operations documentation** — Runbook, backup/restore, monitoring (SLI/SLO), operations ledger, and security response procedures under `docs/operations/`; root `AGENTS.md` and `SECURITY.md` added.
- **Tenant scoping** — API keys/JWTs may carry `organizationId`; org-scoped credentials can only list/read/create/update/delete entities in their own organization (cross-org access returns 404/403). Dashboard and list endpoints are org-filtered.
- **Privilege-escalation control** — role create/update and user role assignment require the grantor to already hold every granted permission (wildcard-aware); `user:write`/`role:write` alone can no longer mint `*:*`.
- **Migration 005** — `api_keys.organization_id` column; `provision-api-key.ts --organization-id` support.

#### M9 — Full Entity CRUD API (21 endpoints)

- **`src/api/routes/entity-crud.ts`** — complete Create/Read/Update/Delete for all 5 platform entities
  - `GET /api/v1/organizations/:id`, `POST`, `PUT`, `DELETE` — organization lifecycle
  - `GET /api/v1/users/:id`, `POST`, `PUT`, `DELETE` — user lifecycle; DELETE is **soft-delete** (status → `deactivated`) to preserve audit trail references
  - `GET /api/v1/roles`, `GET /api/v1/roles/:id`, `POST`, `PUT`, `DELETE` — role management; list endpoint was previously missing
  - `GET /api/v1/devices/:id`, `POST`, `PUT`, `DELETE` — device lifecycle; optional fields `assignedUserId`/`lastSeenAt` preserved on PUT when omitted
  - `GET /api/v1/applications/:id`, `POST`, `PUT`, `DELETE` — application lifecycle
  - Conflict detection (409) via repository lookup for duplicate email, role name, application key
  - All mutations validate through domain factory functions (`createOrganization`, `createUser`, etc.) — invariants always enforced
  - Permission model: `<resource>:read` for GET; `<resource>:write` for POST/PUT/DELETE

- **`src/api/routes/entity-crud.test.ts`** — 34 integration tests (entities + auth guards)
  - Covers: create (201), conflict (409), validation (400), read (200/404), update (200), delete (204/200), permission denial (403), no-auth (401)
  - Users DELETE test verifies `status: "deactivated"` returned and record still accessible via GET

- **`src/api/routes/health.ts`** — `/api/v1/info` version updated to `0.5.0`

### Changed

- **Test count**: 112 → 146 (all pass)

### Security

- Full mutation audit trail (actor from authenticated context, never request body).
- JWT revocation API + revocation audit events.
- Migration 004 foreign-key enforcement for existing and fresh databases.
- Baseline security headers on all JSON API responses.
- `iat < exp` JWT claim validation.
- `pnpm audit` high-severity findings resolved (devDependencies).
- Global per-IP rate limiting on `/api/v1/*`.
- Organization-scoped authorization (tenant isolation) for entities and dashboard.
- Anti-escalation checks on role grants and user role assignment.

---

## [0.5.0] - 2026-06-27

Fifth milestone release: CodeRabbit critical/high security hardening (M7.5) and
production deployment tooling (M8) — Docker Compose prod config, SQLite schema
migration runner, and CLI API key provisioning.

### Added

#### M8 — Production Deployment Tooling

- **`docker-compose.prod.yml`** — production-grade Docker Compose configuration
  - Named volume `ceop-data:/data` backs the SQLite database across container restarts.
  - `CEOP_JWT_SECRET` required at startup; missing value causes container exit.
  - `CEOP_LOG_DEMO_CREDS` hardcoded `"false"` — credentials are never logged in prod.
  - Resource limits: 1 CPU / 256 MiB memory, 64 MiB reservation.
  - `json-file` log driver with 10 MiB / 3-file rotation.

- **`scripts/migrate.ts`** — idempotent SQLite schema migration runner
  - `schema_migrations` tracking table (version, description, applied_at).
  - Defined migrations: `001` (domain entity tables from M7), `002` (`api_keys` table for CLI-provisioned credentials).
  - Each migration wrapped in `BEGIN` / `COMMIT` / `ROLLBACK` — failures roll back cleanly.
  - Re-runs are safe: already-applied versions are skipped with a `✓ already applied` message.
  - Exit codes: 0 = success, 1 = argument/config error, 2 = migration failure.
  - Usage: `node --experimental-strip-types scripts/migrate.ts [--db /data/ceop.db]`

- **`scripts/provision-api-key.ts`** — CLI API key provisioning tool
  - Generates 128-bit random `keyId` and 256-bit random `secret` via `node:crypto`.
  - Computes `HMAC-SHA256(keyId, secret)` and stores only the hash in `api_keys` table.
  - Raw secret printed once to stdout as `KEY_ID=…`, `KEY_SECRET=…`, `CREDENTIAL=…:…`.
  - Credential cannot be recovered after exit; deliver via a secrets manager.
  - Exit codes: 0 = success, 1 = validation error, 2 = database error.
  - Usage: `node --experimental-strip-types scripts/provision-api-key.ts --subject <s> --permissions "p:read,q:write" [--db <path>]`

- **`.env.example`** — updated with all production environment variables
  - Documents `CEOP_JWT_SECRET`, `CEOP_SQLITE_FILE`, `CEOP_SEED_DEMO`, `CEOP_LOG_DEMO_CREDS`.
  - Includes generation command for JWT secret (`openssl rand -hex 32`).
  - Stale placeholders (`API_KEY`, `DATABASE_URL`) removed.

- **`.gitignore`** exception rule — `!scripts/provision-api-key.ts` added so the
  provisioning script is tracked despite the `*key*` wildcard pattern.

#### M7.5 — Security Hardening (CodeRabbit C-1 / H-1 / Major findings)

- **C-1 Critical — ABAC deny-bypass via attribute spread** (`src/governance/policy-engine.ts`)
  - `buildLookup()` previously spread `request.attributes` AFTER the authoritative
    `subject`, `resource`, `action` fields, allowing a caller to pass
    `attributes: { subject: "admin" }` and overwrite the authenticated subject in the
    ABAC lookup map, silently bypassing all subject-scoped deny policies.
  - Fix: spread order reversed — authoritative fields are now written LAST:
    `{ ...request.attributes, subject, resource, action }`.

- **H-1 High — JWT revocation not implemented** (`src/api/middleware/jwt.ts`)
  - `JwtIssuer` interface now exposes `revoke(jti: string): void` and `ttlSeconds`.
  - `createJwtIssuer` maintains a `Map<string, number>` of revoked JTIs keyed to their
    pruning timestamp (expiry Unix second).
  - `verify()` prunes expired revocation entries before checking, then rejects any token
    whose `jti` is in the revocation map with a new `"revoked"` result kind.
  - JWT secret minimum length check: `Buffer.byteLength(secret, "utf8") < 32` throws on
    construction, preventing weak secrets at configuration time.
  - Full payload validation: `sub` (non-empty string), `permissions` (string array),
    `iat` / `exp` (`Number.isSafeInteger`), `jti` (non-empty string).

- **Major #1 — Module-level `rateLimiter` singleton** (`src/api/routes/auth.ts`)
  - Instance creation moved inside `createAuthRoutes()` factory to allow per-request
    isolation in tests and prevent shared state across server instances.

- **Major #2/3/4 — Seeding and credential leakage in `app.ts`**
  - Production fail-fast: `NODE_ENV=production` without `CEOP_JWT_SECRET` throws on startup.
  - Demo seeding now gated on `inMemory || CEOP_SEED_DEMO=true`; persistent stores are never
    polluted by demo data on restart.
  - Demo credential logging requires explicit opt-in via `CEOP_LOG_DEMO_CREDS=true`.

- **Major #5 — Write race condition in `BaseFileRepository`** (`src/persistence/file/base-file-repository.ts`)
  - `#writeQueue: Promise<void>` Promise-chain mutex serializes all `save()` calls;
    concurrent writes no longer race on the shared `.tmp` file.

- **Major #6 — Non-array JSON silently empties the store**
  - `#load()` now throws if the parsed JSON is not an array, and validates that every
    entry has a string `id` field; corrupted files surface immediately.

- **Major #7/8 — Rate limiter unbounded bucket map + no input validation** (`src/api/middleware/rate-limiter.ts`)
  - `MAX_BUCKETS = 10_000` cap prevents memory exhaustion from IP enumeration attacks.
  - `pruneStale()` periodically evicts expired buckets when the cap is reached.
  - `Number.isSafeInteger()` guards on `windowMs` and `maxRequests` constructor arguments.

- **Major #9/10 — JWT secret length and incomplete payload validation** (see H-1 entry above)

- **Major #11/12/13 — Router information leakage + `readJsonBody` settle race** (`src/api/router.ts`)
  - 500 responses suppress `e.message`; only `"unexpected error"` is returned to clients.
  - Access log records `path` only (query string no longer logged — prevents credential leak
    in URLs like `/api?token=…`).
  - `readJsonBody` uses a `settled` guard and explicit `close` event handler to prevent
    double-resolve across all Node.js event edge cases.

- **M-2 — `JwtIssuer` interface incompleteness** — `ttlSeconds` and `revoke` added (see H-1).
- **M-4 — `"unknown"` fallback for missing `remoteAddress`** (`src/api/routes/auth.ts`)
  — null `remoteAddress` now returns `400 Bad Request` instead of silently rate-limiting
  under a shared `"unknown"` key.

### Tests

- 112/112 tests pass (unchanged from v0.4.0 — no net regression from security hardening).

---

## [0.4.0] - 2026-06-27

Fourth milestone release: SQLite-backed persistence layer using `node:sqlite` experimental API.

### Added

- **SQLite persistence base** (`src/persistence/sqlite/base-sqlite-repository.ts`)
  - `BaseSqliteRepository<T>` — generic JSON-in-column SQLite repository.
  - 2-column strategy: `data TEXT NOT NULL` (full JSON) + indexed helper columns for O(log n) queries.
  - WAL journal mode + foreign key enforcement enabled on every `openDatabase()` call.
  - `createRequire(import.meta.url)` bridge for loading untyped `node:sqlite` in ESM context.
  - All public methods are `async` to satisfy the `Repository<T, Id>` port contract.

- **Six domain SQLite repositories** (`src/persistence/sqlite/index.ts`)
  - `SqliteUserRepository` — extra columns: `email` (unique index), `org_id`
  - `SqliteOrganizationRepository` — extra columns: `type`, `parent_id` (nullable)
  - `SqliteRoleRepository` — extra column: `name` (unique index)
  - `SqliteDeviceRepository` — extra column: `org_id`
  - `SqliteApplicationRepository` — extra columns: `app_key` (unique index), `owner_org_id`
  - `SqlitePolicyRepository` — extra column: `effect`
  - `createSqliteRepositories(dbPath)` factory — shared `DatabaseSync` instance across all six repos.

- **Persistence tier selection in `app.ts`**
  - Priority: `CEOP_SQLITE_FILE` → `CEOP_DATA_DIR` → In-Memory.
  - `CEOP_SQLITE_FILE=/data/ceop.db` enables SQLite mode (production-recommended).

- **15 SQLite integration tests** (`src/persistence/sqlite/sqlite-repository.test.ts`)
  - Isolated per-group `:memory:` databases for unit-level CRUD tests.
  - File-based database test verifying WAL persistence across `openDatabase()` calls.
  - Total test count: 112 (up from 97).

### Changed

- `app.ts` — persistence tier selection updated to check `CEOP_SQLITE_FILE` first.

---

### Security (2026-06-27)

- **Rate-limit bypass via spoofable X-Forwarded-For header** — `clientKey()` in
  `src/api/routes/auth.ts` previously trusted the `X-Forwarded-For` / `X-Real-IP`
  request headers, which any client can set to rotate through fake IPs and bypass
  the per-IP rate limiter. The function now uses the TCP-layer `socket.remoteAddress`
  (populated from `req.socket.remoteAddress` in the router, exposed as
  `ApiRequest.remoteAddress`) which cannot be forged by the client. When running
  behind a reverse proxy, configure the proxy to SNAT so Node.js sees the real client
  IP on the socket.

---

## [0.3.0] - 2026-06-27

Third milestone release: JWT session auth, POSIX-atomic file persistence, and
comprehensive security hardening (Critical + High + Medium + Low findings from
CodeRabbit, Codex, and internal review).

### Added

- **JWT authentication** (`src/api/middleware/jwt.ts`)
  - `generateJwtSecret()` — 48-byte cryptographically random hex string.
  - `createJwtIssuer(config)` — HS256 JWT issuer/verifier; `timingSafeEqual` on
    HMAC comparison; 1-hour expiry; `jti` (random 8-byte hex) for replay detection.
  - `JwtVerifyResult` discriminated union: `ok` / `expired` / `invalid` / `malformed`.

- **Rate limiter** (`src/api/middleware/rate-limiter.ts`)
  - Sliding-window rate limiter using `Map<string, number[]>`.
  - Lazy cleanup: expired timestamps are pruned on each `check()` call.
  - `RateLimiter.reset()` clears all buckets (used in tests).

- **Token exchange endpoint** (`src/api/routes/auth.ts`)
  - `POST /api/v1/auth/token` — accepts `{ credential: "keyId:secret" }` and
    returns `{ token, expiresIn: 3600, subject }`.
  - Public route (no Bearer header required); rate-limited at 10 req/min per IP.
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` response headers.

- **Bearer JWT support in Router** (`src/api/router.ts`)
  - Tokens containing `:` → API key path (existing behaviour).
  - Tokens without `:` → JWT verify path; `JwtPayload` mapped to `ApiKeyContext`.
  - `RouterOptions.jwtIssuer` optional field; Router backward-compatible with
    `Map<string, ApiKeyRecord>` (tests still pass a plain Map).

- **POSIX-atomic file repositories** (`src/persistence/file/`)
  - `BaseFileRepository<T>` — lazy-load JSON cache; atomic write via
    `writeFile(tmpPath) → rename(tmpPath, filePath)` (crash-safe; no partial writes).
  - Six concrete repositories: `FileUserRepository`, `FileOrganizationRepository`,
    `FileRoleRepository`, `FileDeviceRepository`, `FileApplicationRepository`,
    `FilePolicyRepository` — each delegates id-typed methods to the base class.
  - `createFileRepositories(dataDir)` factory — creates the directory tree with
    `ensureDataDir()` and wires all six repositories.
  - `CEOP_DATA_DIR` env var in `src/app.ts` — when set, activates file-backed
    persistence instead of the default in-memory repositories.
  - `CEOP_JWT_SECRET` env var — when set, overrides the auto-generated JWT secret
    so secrets persist across process restarts.

- **ApiRequest.remoteAddress** (`src/api/types.ts`)
  - TCP-layer remote address populated by the router from `req.socket.remoteAddress`.
  - Used by the auth route for rate-limiting; prevents X-Forwarded-For spoofing.

### Security — Round 3 (CodeRabbit + Codex findings — 2026-06-27)

- **Dashboard list endpoints missing authorization (Critical)** — `GET /api/v1/organizations`,
  `GET /api/v1/users`, `GET /api/v1/applications`, and `GET /api/v1/devices` now enforce
  per-permission guards via a shared `hasPermission()` helper. Organization and user listings
  require `organization:read` / `user:read` (admin only); application and device listings
  require `application:read` / `device:read` (admin + viewer). Unauthenticated callers receive
  401; authenticated callers without the required permission receive 403.
- **ABAC conditions broken for top-level request fields (High)** — `conditionsHold` in
  `policy-engine.ts` merged `request.subject`, `resource`, and `action` into the attribute
  lookup map so policies using `conditions: [{ attribute: "subject", equals: "guest" }]` now
  correctly gate access.
- **ITSM spread order bug — caller id/status could override generated values (High)**.
- **CMDB adapter returns live references (High)** — `getItem()` / `listItems()` return
  shallow clones.
- **Invalid ISO timestamp acceptance (High)** — `toIsoTimestamp()` performs round-trip check.
- **CSP blocks inline styles/scripts (Medium)**, **health class prefix mismatch (Medium)**,
  **audit outcome class injection (Medium)**, **hasPermission not shared (Medium)**,
  **document adapter `missingVariables` inconsistency (Low)**, and additional low-severity
  fixes.

### Security — Round 2 (code-review findings — 2026-06-27)

- **keyId enumeration via error message (Low→fixed)**, **NODE_ENV case sensitivity (High)**,
  **body/JSON error separation (Medium)**, **missing governance:evaluate permission (Medium)**,
  **wildcard permission coverage gap (Medium)**, **CSP form-action/base-uri/frame-ancestors
  (Medium/Low)**, **Cache-Control no-store (Low)**.

### Security — Round 1 (2026-06-27)

- **Timing attack (Critical)** — HMAC comparison uses `timingSafeEqual`.
- **DoS — body size (High)** — 1 MiB request-body limit.
- **Missing authorization on audit log and policy listing (High ×2)**.
- **Silent audit failure (High)**, **CSP header (High)**, **demo key logging (High)**,
  **audit actor spoofing (High)**.

### Fixed

- **TypeScript exactOptionalPropertyTypes compliance** — four categories resolved:
  - `src/api/router.ts`: private field `#jwtIssuer?: JwtIssuer` → `: JwtIssuer | undefined`.
  - `src/api/server.ts`: conditional spread to avoid passing `{ jwtIssuer: undefined }`.
  - `src/persistence/file/file-repository.test.ts`: `IsoTimestamp` import + `nowTs()` return
    type; removed incorrect `_brand` (single underscore) casts.
  - `src/persistence/file/index.ts`: `override` keyword on all 12 `findById`/`delete` methods.

### Quality

- Test count increased from 45 to **97** (39 new: JWT middleware ×15, rate limiter ×7,
  auth route ×5, file repository ×12).
- typecheck, lint, build, and all 97 tests remain green.

### Notes

- File repositories are suitable for single-node deployments; for multi-node or high-load
  use cases, replace with PostgreSQL / SQLite WAL adapters (ports are defined in
  `src/persistence/ports.ts`).
- JWT secret defaults to a per-process random value; set `CEOP_JWT_SECRET` for persistence.
- Concrete external adapters (CMDB, ITSM, etc.) are planned for M7.

---

## [0.2.0] - 2026-06-27

### Security / Quality — Round 3 (CodeRabbit + Codex findings — 2026-06-27)

- **Dashboard list endpoints missing authorization (Critical)** — `GET /api/v1/organizations`,
  `GET /api/v1/users`, `GET /api/v1/applications`, and `GET /api/v1/devices` now enforce
  per-permission guards via a shared `hasPermission()` helper. Organization and user listings
  require `organization:read` / `user:read` (admin only); application and device listings
  require `application:read` / `device:read` (admin + viewer). Unauthenticated callers receive
  401; authenticated callers without the required permission receive 403.
- **ABAC conditions broken for top-level request fields (High)** — `conditionsHold` in
  `policy-engine.ts` merged `request.subject`, `resource`, and `action` into the attribute
  lookup map so policies using `conditions: [{ attribute: "subject", equals: "guest" }]` now
  correctly gate access. Previously only `request.attributes` was checked.
- **ITSM spread order bug — caller id/status could override generated values (High)** —
  `InMemoryItsmAdapter.createIncident()` now spreads input first, then overwrites `id` and
  `status` with generated values, ensuring callers cannot inject a pre-set id or bypass
  `"open"` status.
- **CMDB adapter returns live references (High)** — `getItem()` and `listItems()` now return
  shallow clones (`{ ...item, attributes: { ...item.attributes } }`) so callers cannot mutate
  the internal store state.
- **Invalid ISO timestamp acceptance (High)** — `toIsoTimestamp()` in `domain/common.ts` now
  performs a round-trip check: `new Date(value).toISOString() !== value` rejects dates like
  `"2026-02-30T00:00:00.000Z"` that JavaScript silently normalizes to a different date.
- **CSP blocks inline styles/scripts in SSR templates (Medium)** — `sendHtml()` in `web.ts`
  added `style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'` because
  `default-src 'self'` does not cover inline `<style>` and `<script>` blocks.
- **Health class prefix mismatch (Medium)** — `renderer.ts` and `index.html` corrected
  `app-health-dot` class from `${health}` to `health-${health}` (e.g. `health-healthy`) to
  match the CSS selectors `.health-healthy`, `.health-degraded`, `.health-down`.
- **Audit outcome class injection (Medium)** — `index.html` now allowlists outcome values
  (`success | denied | error`) before inserting them as CSS class names, preventing arbitrary
  class injection from audit log data.
- **hasPermission helper not shared (Medium)** — `hasPermission()` exported from
  `governance.ts` and imported in `dashboard.ts`; single source of truth for wildcard
  permission matching across all route modules.
- **document adapter `missingVariables` inconsistency (Low)** — uses
  `Object.prototype.hasOwnProperty.call` consistently with `render()`, preventing
  prototype-chain pollution from keys like `constructor` or `toString`.
- **Governance page missing API key input (Low)** — `governance.html` now includes an API key
  field; `runEvaluate()` reads it and sends `Authorization: Bearer <key>` so the policy
  evaluation form is usable without browser dev tools.
- **Healthcheck accepts only 200 (Low)** — `scripts/healthcheck.ts` now accepts any 2xx
  response (`statusCode >= 200 && statusCode < 300`) for forward-compatibility with 204/206.
- **Router throws 500 on malformed URL encoding (Low)** — `router.ts` wraps `#match()` in a
  try-catch to convert `URIError` from malformed `%xx` sequences into HTTP 400 Bad Request.
- **`demo` script missing `--experimental-strip-types` (Low)** — `package.json` updated so
  `pnpm run demo` can execute the `.ts` entry point directly.
- **New HTTP integration tests for dashboard authorization** — `src/api/routes/dashboard.test.ts`
  added 13 tests covering admin-only (organizations, users) and viewer-accessible (applications,
  devices) endpoints, plus unauthenticated 401 responses and response-shape assertions.

### Security — Round 2 (code-review findings — 2026-06-27)

- **keyId enumeration via error message (Low→fixed)** — `auth.ts` now returns a unified
  `"invalid credentials"` message for both missing keyId and wrong secret, preventing callers
  from distinguishing the two cases and enumerating valid key IDs.
- **NODE_ENV case sensitivity (High)** — `app.ts` now uses `.toLowerCase()` so
  `"Production"` and `"PRODUCTION"` are treated identically to `"production"`.
- **Body size vs JSON parse error conflation (Medium)** — `router.ts` now returns
  `"request body exceeds 1 MiB limit"` (413-style message) vs
  `"request body must be valid JSON"` for distinct failure modes.
- **Missing governance:evaluate permission (Medium)** — `POST /api/v1/governance/evaluate`
  now requires `governance:evaluate` (or wildcard) permission; viewer-only keys receive 403.
- **Wildcard permission coverage gap (Medium)** — `audit:*` and `policy:*` resource-level
  wildcards now correctly grant `audit:read` and `policy:read` respectively, via a shared
  `hasPermission(ctx, resource, action)` helper that handles `r:a`, `r:*`, `*:a`, and `*:*`.
- **CSP `form-action` missing (Medium)** — `form-action 'self'` added; `default-src` does not
  cover form submission targets per CSP Level 3 specification.
- **CSP `base-uri` missing (Low→fixed)** — `base-uri 'none'` prevents `<base>` tag injection
  from redirecting all relative URLs to an external origin.
- **CSP `frame-ancestors` missing (Low→fixed)** — `frame-ancestors 'self'` added alongside
  `X-Frame-Options: SAMEORIGIN` for defense-in-depth against browsers that ignore the legacy header.
- **Missing `Cache-Control` (Low→fixed)** — SSR pages now include `Cache-Control: no-store`
  to prevent sensitive dashboard content from being stored in browser or proxy caches.

### Security — Round 1 (2026-06-27)

- **Timing attack (Critical)** — HMAC hash comparison in `auth.ts` now uses
  `crypto.timingSafeEqual` instead of `!==` to prevent timing side-channel attacks.
- **DoS — body size (High)** — `router.ts` enforces a 1 MiB request-body limit; oversized
  bodies are rejected before buffering to prevent heap exhaustion.
- **Missing authorization on audit log (High)** — `GET /api/v1/governance/audit` now requires
  `audit:read` (or wildcard) permission; unauthenticated callers receive 403.
- **Missing authorization on policy listing (High)** — `GET /api/v1/governance/policies` now
  requires `policy:read` permission.
- **Silent audit failure (High)** — governance evaluate no longer silently discards audit event
  creation errors; failures are logged for investigation.
- **Content-Security-Policy (High)** — SSR pages now include `Content-Security-Policy` header.
- **Demo key logging (High)** — API key credential printing in `app.ts` is gated behind
  `NODE_ENV !== "production"` to prevent secret leakage in production logs.
- **Audit actor spoofing (High)** — `POST /api/v1/governance/evaluate` uses `ctx.subject`
  (authenticated API key) as the audit actor rather than the request body's `subject` field.

### 初版リリース内容

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
