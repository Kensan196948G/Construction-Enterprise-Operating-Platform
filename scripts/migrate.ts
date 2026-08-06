/**
 * SQLite schema migration script for CEOP.
 *
 * Usage:
 *   node --experimental-strip-types scripts/migrate.ts [--db /data/ceop.db]
 *
 * What it does:
 *   1. Opens (or creates) the SQLite database at --db / CEOP_SQLITE_FILE.
 *   2. Creates a `schema_migrations` tracking table if it doesn't exist.
 *   3. Applies any pending migrations in version order (idempotent).
 *   4. Reports which migrations were run.
 *
 * Migration design:
 *   - Each migration has a version string (e.g. "001") and a description.
 *   - Migrations are wrapped in a transaction; if one fails the DB is
 *     rolled back and the script exits with code 2.
 *   - Already-applied migrations are skipped (idempotent re-runs are safe).
 *
 * To add a new migration: append an entry to the MIGRATIONS array below.
 * Never edit or remove existing migrations once they have been applied to
 * a production database.
 *
 * Exit codes:
 *   0 — all migrations applied (or already up-to-date)
 *   1 — argument / config error
 *   2 — migration failure (DB rolled back)
 */

import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Migration definitions
// ---------------------------------------------------------------------------

export interface Migration {
  readonly version: string;
  readonly description: string;
  readonly up: string; // SQL executed inside a transaction
  /**
   * Set to true when the migration rebuilds tables that participate in foreign
   * keys. `PRAGMA foreign_keys` cannot be changed inside a transaction, so the
   * runner disables enforcement before BEGIN and re-enables (with an integrity
   * check) after COMMIT.
   */
  readonly disableForeignKeys?: boolean;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: "001",
    description: "initial schema — domain entity tables (M7)",
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id      TEXT PRIMARY KEY,
        data    TEXT NOT NULL,
        email   TEXT NOT NULL,
        org_id  TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE        INDEX IF NOT EXISTS idx_users_org   ON users(org_id);

      CREATE TABLE IF NOT EXISTS organizations (
        id        TEXT PRIMARY KEY,
        data      TEXT NOT NULL,
        type      TEXT NOT NULL,
        parent_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_orgs_type   ON organizations(type);
      CREATE INDEX IF NOT EXISTS idx_orgs_parent ON organizations(parent_id);

      CREATE TABLE IF NOT EXISTS roles (
        id   TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        name TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

      CREATE TABLE IF NOT EXISTS devices (
        id     TEXT PRIMARY KEY,
        data   TEXT NOT NULL,
        org_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(org_id);

      CREATE TABLE IF NOT EXISTS applications (
        id           TEXT PRIMARY KEY,
        data         TEXT NOT NULL,
        app_key      TEXT NOT NULL,
        owner_org_id TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_key   ON applications(app_key);
      CREATE        INDEX IF NOT EXISTS idx_apps_owner ON applications(owner_org_id);

      CREATE TABLE IF NOT EXISTS policies (
        id     TEXT PRIMARY KEY,
        data   TEXT NOT NULL,
        effect TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_policies_effect ON policies(effect);
    `,
  },
  {
    version: "002",
    description: "api_keys table for CLI-provisioned credentials (M8)",
    up: `
      CREATE TABLE IF NOT EXISTS api_keys (
        key_id      TEXT PRIMARY KEY,
        subject     TEXT NOT NULL,
        permissions TEXT NOT NULL,
        secret_hash TEXT NOT NULL,
        created_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_subject ON api_keys(subject);
    `,
  },
  {
    version: "003",
    description: "audit_log table for tamper-evident hash-chain persistence (M11)",
    up: `
      CREATE TABLE IF NOT EXISTS audit_log (
        sequence  INTEGER PRIMARY KEY,
        event_id  TEXT    NOT NULL UNIQUE,
        at        TEXT    NOT NULL,
        actor     TEXT    NOT NULL,
        action    TEXT    NOT NULL,
        resource  TEXT    NOT NULL,
        outcome   TEXT    NOT NULL,
        prev_hash TEXT    NOT NULL,
        hash      TEXT    NOT NULL,
        data      TEXT    NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit_log (actor);
      CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_log (action);
      CREATE INDEX IF NOT EXISTS idx_audit_at       ON audit_log (at);
      CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log (resource);
    `,
  },
  {
    version: "004",
    description: "schema consolidation: workflows/revoked_jtis tables + FK constraints on domain tables (v0.6.0)",
    disableForeignKeys: true,
    up: `
      CREATE TABLE IF NOT EXISTS workflows (
        id            TEXT PRIMARY KEY,
        data          TEXT NOT NULL,
        workflow_type TEXT NOT NULL,
        status        TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workflows_type   ON workflows (workflow_type);
      CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows (status);

      CREATE TABLE IF NOT EXISTS revoked_jtis (
        jti         TEXT PRIMARY KEY,
        prunable_at INTEGER NOT NULL
      );

      -- Rebuild organizations with a self-referencing FK on parent_id.
      CREATE TABLE organizations_new (
        id        TEXT PRIMARY KEY,
        data      TEXT NOT NULL,
        type      TEXT NOT NULL,
        parent_id TEXT REFERENCES organizations(id)
      );
      INSERT INTO organizations_new (id, data, type, parent_id)
        SELECT id, data, type, parent_id FROM organizations;
      DROP TABLE organizations;
      ALTER TABLE organizations_new RENAME TO organizations;
      CREATE INDEX IF NOT EXISTS idx_orgs_type   ON organizations(type);
      CREATE INDEX IF NOT EXISTS idx_orgs_parent ON organizations(parent_id);

      -- Rebuild users with an FK on organizations(id).
      CREATE TABLE users_new (
        id     TEXT PRIMARY KEY,
        data   TEXT NOT NULL,
        email  TEXT NOT NULL,
        org_id TEXT NOT NULL REFERENCES organizations(id)
      );
      INSERT INTO users_new (id, data, email, org_id)
        SELECT id, data, email, org_id FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE        INDEX IF NOT EXISTS idx_users_org   ON users(org_id);

      -- Rebuild devices with an FK on organizations(id).
      CREATE TABLE devices_new (
        id     TEXT PRIMARY KEY,
        data   TEXT NOT NULL,
        org_id TEXT NOT NULL REFERENCES organizations(id)
      );
      INSERT INTO devices_new (id, data, org_id)
        SELECT id, data, org_id FROM devices;
      DROP TABLE devices;
      ALTER TABLE devices_new RENAME TO devices;
      CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(org_id);

      -- Rebuild applications with an FK on organizations(id).
      CREATE TABLE applications_new (
        id           TEXT PRIMARY KEY,
        data         TEXT NOT NULL,
        app_key      TEXT NOT NULL,
        owner_org_id TEXT NOT NULL REFERENCES organizations(id)
      );
      INSERT INTO applications_new (id, data, app_key, owner_org_id)
        SELECT id, data, app_key, owner_org_id FROM applications;
      DROP TABLE applications;
      ALTER TABLE applications_new RENAME TO applications;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_key   ON applications(app_key);
      CREATE        INDEX IF NOT EXISTS idx_apps_owner ON applications(owner_org_id);
    `,
  },
];

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function resolveDbPath(): string {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--db") {
      if (!argv[i + 1]) throw new Error("--db requires a non-empty path argument");
      return argv[i + 1] as string;
    }
  }
  return process.env["CEOP_SQLITE_FILE"] ?? "/data/ceop.db";
}

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

function ensureMigrationsTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at  TEXT NOT NULL
    )
  `);
}

function appliedVersions(db: DatabaseSync): Set<string> {
  const rows = db.prepare("SELECT version FROM schema_migrations").all() as {
    version: string;
  }[];
  return new Set(rows.map((r) => r.version));
}

function runMigration(db: DatabaseSync, m: Migration): void {
  if (m.disableForeignKeys === true) {
    db.exec("PRAGMA foreign_keys = OFF");
  }
  db.exec("BEGIN");
  try {
    db.exec(m.up);
    db.prepare(
      "INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)",
    ).run(m.version, m.description, new Date().toISOString());
    db.exec("COMMIT");
    if (m.disableForeignKeys === true) {
      const violations = db.prepare("PRAGMA foreign_key_check").all() as unknown[];
      if (violations.length > 0) {
        throw new Error(
          `foreign key violations after migration ${m.version}: ${JSON.stringify(violations)}`,
        );
      }
    }
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // No active transaction (already committed) — the post-commit FK check failed.
    }
    throw e;
  } finally {
    if (m.disableForeignKeys === true) {
      db.exec("PRAGMA foreign_keys = ON");
    }
  }
}

// ---------------------------------------------------------------------------
// Public runner + CLI main
// ---------------------------------------------------------------------------

/**
 * Apply all pending migrations to an open database.
 * Idempotent: already-applied versions are skipped.
 *
 * @returns the number of migrations applied in this run.
 * @throws if any migration fails (transaction is rolled back).
 */
export function applyMigrations(db: DatabaseSync): number {
  ensureMigrationsTable(db);
  const applied = appliedVersions(db);
  let ran = 0;
  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) {
      console.error(`[migrate] ✓ ${m.version} already applied — ${m.description}`);
      continue;
    }
    console.error(`[migrate] ➜ applying ${m.version} — ${m.description}`);
    runMigration(db, m);
    ran++;
    console.error(`[migrate] ✓ ${m.version} OK`);
  }
  console.error(`[migrate] Done. ${ran} migration(s) applied.`);
  return ran;
}

function main(): void {
  const dbPath = resolveDbPath();
  console.error(`[migrate] Opening database: ${dbPath}`);

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA foreign_keys=ON");
  } catch (e) {
    console.error("[migrate] Failed to open database:", e);
    process.exit(1);
  }

  try {
    applyMigrations(db);
  } catch (e) {
    console.error("[migrate] Migration failed:", e);
    db.close();
    process.exit(2);
  }

  db.close();
}

// Run as a CLI only when executed directly (not when imported by tests).
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
