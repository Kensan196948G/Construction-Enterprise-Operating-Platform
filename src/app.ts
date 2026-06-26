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
import { AuditLog } from "./governance/audit-log.ts";
import { createInMemoryRepositories } from "./persistence/in-memory/index.ts";
import { createFileRepositories } from "./persistence/file/index.ts";
import { createSqliteRepositories } from "./persistence/sqlite/index.ts";
import { createApiKey } from "./api/middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "./api/middleware/jwt.ts";
import { createServer } from "./api/server.ts";
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

  const auditLog = new AuditLog();
  const apiKeyStore: AppContainer["apiKeyStore"] = new Map();

  // JWT issuer: generate a fresh ephemeral secret per process (suitable for single-node).
  // For multi-node deployments, set CEOP_JWT_SECRET in the environment.
  const jwtSecret = process.env["CEOP_JWT_SECRET"] ?? generateJwtSecret();
  const jwtIssuer = createJwtIssuer({ secret: jwtSecret, ttlSeconds: 3600 });

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
  const viewerCred = createApiKey("user-viewer", [...viewerRole.permissions], apiKeyStore);

  // Only print demo credentials in non-production environments.
  // In production, provision keys via an out-of-band admin command; never log secret material.
  if (process.env["NODE_ENV"]?.toLowerCase() !== "production") {
    console.error(
      "[app] demo API keys (use as: Authorization: Bearer <key>:<secret>)\n" +
        `  admin  key=${adminCred.key}  secret=${adminCred.secret}\n` +
        `  viewer key=${viewerCred.key}  secret=${viewerCred.secret}`,
    );
  }

  return { repositories, auditLog, apiKeyStore, jwtIssuer };
}

/**
 * Bootstrap the application and start the HTTP server.
 *
 * @param port - TCP port to listen on (default: 3000).
 */
export async function start(port = 3000): Promise<void> {
  const container = await createApp();
  const server = createServer({ port }, container);

  server.listen(port, () => {
    console.error(`[app] Construction Enterprise Operating Platform listening on port ${port}`);
    console.error(`[app] Health: http://localhost:${port}/health`);
    console.error(`[app] Info:   http://localhost:${port}/api/v1/info`);
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
}
