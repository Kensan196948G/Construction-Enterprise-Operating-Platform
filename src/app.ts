/**
 * Application bootstrap.
 *
 * `createApp()` wires the in-memory repositories, audit log, API key store,
 * and demo seed data into an {@link AppContainer}.  `start()` creates the HTTP
 * server and begins accepting connections on the requested port (default 3000).
 */

import type { IsoTimestamp } from "./domain/common.ts";
import { createOrganization } from "./domain/organization.ts";
import { createUser } from "./domain/user.ts";
import { createRole } from "./domain/role.ts";
import { createDevice } from "./domain/device.ts";
import { createApplication } from "./domain/application.ts";
import { createPolicy } from "./domain/policy.ts";
import { createIsoRecord } from "./domain/iso.ts";
import { AuditLog } from "./governance/audit-log.ts";
import { SqliteAuditLog } from "./governance/sqlite-audit-log.ts";
import { createInMemoryRepositories } from "./persistence/in-memory/index.ts";
import { createFileRepositories } from "./persistence/file/index.ts";
import { createSqliteRepositories, loadApiKeysFromSqlite } from "./persistence/sqlite/index.ts";
import { createSqliteApiKeyRepository } from "./persistence/sqlite/api-key-repository.ts";
import {
  createSqliteRevocationStore,
  openRevocationDatabase,
} from "./persistence/sqlite/revocation-store.ts";
import { createApiKey } from "./api/middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "./api/middleware/jwt.ts";
import { createServer } from "./api/server.ts";
import { loadGatewayServices } from "./api/gateway/config.ts";
import type { AppContainer } from "./api/types.ts";

// ---------------------------------------------------------------------------
// Timestamp helper — new Date().toISOString() is always valid ISO 8601.
// ---------------------------------------------------------------------------

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/** Panic-on-validation-failure helper used only during deterministic seeding. */
function mustOk<T>(label: string, result: { ok: boolean; value?: T; error?: unknown }): T {
  if (!result.ok) {
    throw new Error(`[seed] ${label} validation failed: ${JSON.stringify(result.error)}`);
  }
  // result.ok is true so value is present.
  return result.value as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Construct a fully-wired application container with demo seed data.
 * Every call returns an independent container with its own in-memory stores.
 */
export async function createApp(): Promise<AppContainer> {
  // Persistence tier (priority: SQLite > file > in-memory).
  // CEOP_SQLITE_FILE: path to SQLite DB file (e.g. /data/ceop.db)
  // CEOP_DATA_DIR: directory for JSON file repositories
  const sqliteFile = process.env["CEOP_SQLITE_FILE"];
  const dataDir = process.env["CEOP_DATA_DIR"];
  const repositories = sqliteFile
    ? createSqliteRepositories(sqliteFile)
    : dataDir
      ? await createFileRepositories(dataDir)
      : createInMemoryRepositories();

  const auditLog = sqliteFile ? new SqliteAuditLog(sqliteFile) : new AuditLog();
  const apiKeyStore: AppContainer["apiKeyStore"] = new Map();

  // In SQLite mode, load provisioned API keys from the api_keys table.
  // Keys are created via scripts/provision-api-key.ts after running migrations.
  if (sqliteFile) {
    loadApiKeysFromSqlite(sqliteFile, apiKeyStore);
  } else if (process.env["NODE_ENV"]?.toLowerCase() === "production") {
    throw new Error(
      "CEOP_SQLITE_FILE must be set in production: SQLite is required for persistent API key management",
    );
  }
  const apiKeyRepository = sqliteFile ? createSqliteApiKeyRepository(sqliteFile) : undefined;

  // JWT issuer: generate a fresh ephemeral secret per process (suitable for single-node).
  // For multi-node deployments, set CEOP_JWT_SECRET in the environment.
  const configuredJwtSecret = process.env["CEOP_JWT_SECRET"];
  if (process.env["NODE_ENV"]?.toLowerCase() === "production" && !configuredJwtSecret) {
    throw new Error("CEOP_JWT_SECRET must be set in production");
  }
  const jwtSecret = configuredJwtSecret ?? generateJwtSecret();

  // In SQLite mode, persist revoked JTIs so they survive process restarts.
  // The revocation table is stored in the same database file for simplicity.
  const revocationStore = sqliteFile
    ? createSqliteRevocationStore(openRevocationDatabase(sqliteFile))
    : undefined;

  const jwtIssuer = createJwtIssuer({
    secret: jwtSecret,
    ttlSeconds: 3600,
    ...(revocationStore !== undefined ? { revocationStore } : {}),
  });

  const isProduction = process.env["NODE_ENV"]?.toLowerCase() === "production";
  const seedDemo = process.env["CEOP_SEED_DEMO"] === "true";
  if (isProduction && seedDemo) {
    throw new Error("CEOP_SEED_DEMO must not be set in production (NODE_ENV=production)");
  }
  const inMemory = !sqliteFile && !dataDir;
  if (isProduction && inMemory) {
    throw new Error(
      "Persistent storage must be configured in production: set CEOP_SQLITE_FILE or CEOP_DATA_DIR",
    );
  }
  if (inMemory || seedDemo) {
    const createdAt = nowTs();

    // ── 1. Organisation ───────────────────────────────────────────────────────

    const org = mustOk(
      "headquarters org",
      createOrganization({
        id: "org-hq",
        name: "Kensan Construction HQ",
        type: "headquarters",
        status: "active",
        createdAt,
      }),
    );
    await repositories.organizations.save(org);

    const siteBranch = mustOk(
      "site branch org",
      createOrganization({
        id: "org-site-01",
        name: "Kensan Site Branch 01",
        type: "site",
        status: "active",
        parentId: "org-hq",
        createdAt,
      }),
    );
    await repositories.organizations.save(siteBranch);

    // ── 2. Roles ──────────────────────────────────────────────────────────────

    const adminRole = mustOk(
      "admin role",
      createRole({
        id: "role-admin",
        name: "Platform Administrator",
        description: "Full platform access for governance administrators.",
        scope: "global",
        permissions: ["*:*"],
      }),
    );
    await repositories.roles.save(adminRole);

    const viewerRole = mustOk(
      "viewer role",
      createRole({
        id: "role-viewer",
        name: "Read-Only Viewer",
        description: "Read-only access to applications and devices.",
        scope: "organization",
        permissions: ["application:read", "device:read", "audit:read"],
      }),
    );
    await repositories.roles.save(viewerRole);

    // ── 3. Users ──────────────────────────────────────────────────────────────

    const adminUser = mustOk(
      "admin user",
      createUser({
        id: "user-admin",
        organizationId: "org-hq",
        displayName: "Platform Admin",
        email: "admin@kensan-construction.example",
        status: "active",
        roleIds: ["role-admin"],
        createdAt,
      }),
    );
    await repositories.users.save(adminUser);

    const viewerUser = mustOk(
      "viewer user",
      createUser({
        id: "user-viewer",
        organizationId: "org-hq",
        displayName: "Dashboard Viewer",
        email: "viewer@kensan-construction.example",
        status: "active",
        roleIds: ["role-viewer"],
        createdAt,
      }),
    );
    await repositories.users.save(viewerUser);

    // ── 4. Policies ───────────────────────────────────────────────────────────

    const allowPortalPolicy = mustOk(
      "allow portal policy",
      createPolicy({
        id: "policy-allow-portal",
        name: "Allow Portal Read Access",
        effect: "allow",
        actions: ["read"],
        resources: ["application", "device"],
      }),
    );
    await repositories.policies.save(allowPortalPolicy);

    const denyGuestAuditPolicy = mustOk(
      "deny guest audit policy",
      createPolicy({
        id: "policy-deny-guest-audit",
        name: "Deny Guest Audit Access",
        effect: "deny",
        actions: ["read"],
        resources: ["audit"],
        conditions: [{ attribute: "subject", equals: "guest" }],
      }),
    );
    await repositories.policies.save(denyGuestAuditPolicy);

    // ── 5. Applications ───────────────────────────────────────────────────────

    const portalApp = mustOk(
      "enterprise portal app",
      createApplication({
        id: "app-portal",
        key: "enterprise-portal",
        name: "Enterprise Portal",
        category: "portal",
        health: "healthy",
        ownerOrganizationId: "org-hq",
      }),
    );
    await repositories.applications.save(portalApp);

    const fieldApp = mustOk(
      "field os app",
      createApplication({
        id: "app-field",
        key: "field-os",
        name: "Field OS",
        category: "field",
        health: "degraded",
        ownerOrganizationId: "org-site-01",
      }),
    );
    await repositories.applications.save(fieldApp);

    // ── 6. Device ─────────────────────────────────────────────────────────────

    const tablet = mustOk(
      "site tablet",
      createDevice({
        id: "device-tablet-01",
        organizationId: "org-site-01",
        kind: "tablet",
        status: "active",
        assignedUserId: "user-viewer",
        lastSeenAt: createdAt,
      }),
    );
    await repositories.devices.save(tablet);

    // ── 7. API keys ───────────────────────────────────────────────────────────

    const adminCred = createApiKey("user-admin", [...adminRole.permissions], apiKeyStore);
    const viewerCred = createApiKey(
      "user-viewer",
      [...viewerRole.permissions],
      apiKeyStore,
      "org-hq",
    );

    // Stable credential for browser E2E (non-production only). The auth
    // middleware still hashes it; the secret never leaves the process.
    const e2eKeyId = process.env["CEOP_E2E_API_KEY_ID"];
    const e2eSecret = process.env["CEOP_E2E_API_KEY_SECRET"];
    if (e2eKeyId !== undefined && e2eSecret !== undefined) {
      createApiKey(
        "e2e-admin",
        [...adminRole.permissions],
        apiKeyStore,
        "org-hq",
        e2eKeyId,
        e2eSecret,
      );
    }

    const e2eViewerKeyId = process.env["CEOP_E2E_VIEWER_API_KEY_ID"];
    const e2eViewerSecret = process.env["CEOP_E2E_VIEWER_API_KEY_SECRET"];
    if (e2eViewerKeyId !== undefined && e2eViewerSecret !== undefined) {
      createApiKey(
        "e2e-viewer",
        [...viewerRole.permissions],
        apiKeyStore,
        "org-hq",
        e2eViewerKeyId,
        e2eViewerSecret,
      );
    }

    // ── 8. ISO demo records ─────────────────────────────────────────────────

    const demoQualityPlan = mustOk(
      "demo quality plan",
      createIsoRecord({
        id: "iso-demo-quality-plan",
        kind: "quality-plan",
        organizationId: "org-hq",
        projectId: "project-demo-1",
        title: "品質計画（デモ）",
        payload: { planNo: "QP-DEMO-001" },
        createdBy: "user-admin",
        createdAt,
      }),
    );
    await repositories.isoRecords.save(demoQualityPlan);

    const demoAsset = mustOk(
      "demo asset",
      createIsoRecord({
        id: "iso-demo-asset",
        kind: "asset",
        organizationId: "org-hq",
        title: "橋梁A（デモ）",
        payload: { assetType: "structure", name: "橋梁A" },
        createdBy: "user-admin",
        createdAt,
      }),
    );
    await repositories.isoRecords.save(demoAsset);

    const demoCorrective = mustOk(
      "demo corrective action",
      createIsoRecord({
        id: "iso-demo-corrective",
        kind: "corrective-action",
        organizationId: "org-hq",
        title: "是正処置（デモ）",
        payload: { sourceType: "audit_finding", description: "監査指摘対応" },
        createdBy: "user-admin",
        createdAt,
      }),
    );
    await repositories.isoRecords.save(demoCorrective);

    // Explicit opt-in only — never log secret material by default.
    // Blocked outside interactive terminals to prevent credentials leaking into CI logs.
    if (process.env["CEOP_LOG_DEMO_CREDS"] === "true") {
      if (!process.stderr.isTTY) {
        throw new Error("CEOP_LOG_DEMO_CREDS can only be used from an interactive terminal");
      }
      console.error(
        "[app] demo API keys (use as: Authorization: Bearer <key>:<secret>)\n" +
          `  admin  key=${adminCred.key}  secret=${adminCred.secret}\n` +
          `  viewer key=${viewerCred.key}  secret=${viewerCred.secret}`,
      );
    }
  } // end demo seeding

  const gatewayServicesResult = loadGatewayServices();
  if (!gatewayServicesResult.ok) {
    throw new Error(
      `[app] invalid gateway configuration: ${JSON.stringify(gatewayServicesResult.error)}`,
    );
  }

  return {
    repositories,
    auditLog,
    apiKeyStore,
    ...(apiKeyRepository !== undefined ? { apiKeyRepository } : {}),
    storageTier: sqliteFile ? "sqlite" : dataDir ? "file" : "in-memory",
    jwtIssuer,
    gatewayServices: gatewayServicesResult.value,
  };
}

/**
 * Bootstrap the application and start the HTTP server.
 *
 * @param port - TCP port to listen on (default: 3000).
 */
export async function start(port = 3000): Promise<void> {
  const container = await createApp();
  const server = createServer(
    { port, ...(container.gatewayServices ? { gatewayServices: container.gatewayServices } : {}) },
    container,
  );

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      console.error(`[app] Construction Enterprise Operating Platform listening on port ${port}`);
      console.error(`[app] Health: http://localhost:${port}/health`);
      console.error(`[app] Info:   http://localhost:${port}/api/v1/info`);
      resolve();
    });
  });

  // Graceful shutdown on SIGTERM / SIGINT.
  const shutdown = (): void => {
    console.error("[app] shutting down…");
    server.close(() => {
      process.exit(0);
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  // Node 22+ terminates the process on unhandled rejections by default.
  // These handlers ensure a diagnostic message is logged before exit so
  // the cause of a crash is visible in Docker / journald stderr, and they
  // attempt a graceful server.close() so the container exits cleanly.
  process.on("unhandledRejection", (reason: unknown) => {
    console.error("[app] FATAL: unhandled rejection:", reason);
    server.close(() => process.exit(1));
    // If close() hangs (e.g. keep-alive), force exit after 5 seconds.
    setTimeout(() => process.exit(1), 5_000);
  });
  process.on("uncaughtException", (err: Error) => {
    console.error("[app] FATAL: unhandled exception:", err);
    server.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 5_000);
  });
}
