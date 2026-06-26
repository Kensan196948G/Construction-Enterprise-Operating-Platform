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

// ---------------------------------------------------------------------------
// Migration definitions
// ---------------------------------------------------------------------------

interface Migration {
  readonly version: string;
  readonly description: string;
  readonly up: string; // SQL executed inside a transaction
}

const MIGRATIONS: readonly Migration[] = [
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
];

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function resolveDbPath(): string {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--db" && argv[i + 1]) return argv[i + 1] as string;
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
  db.exec("BEGIN");
  try {
    db.exec(m.up);
    db.prepare(
      "INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)",
    ).run(m.version, m.description, new Date().toISOString());
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

ensureMigrationsTable(db);
const applied = appliedVersions(db);

let ran = 0;
for (const m of MIGRATIONS) {
  if (applied.has(m.version)) {
    console.error(`[migrate] ✓ ${m.version} already applied — ${m.description}`);
    continue;
  }
  console.error(`[migrate] ➜ applying ${m.version} — ${m.description}`);
  try {
    runMigration(db, m);
    ran++;
    console.error(`[migrate] ✓ ${m.version} OK`);
  } catch (e) {
    console.error(`[migrate] ✗ ${m.version} FAILED (rolled back):`, e);
    db.close();
    process.exit(2);
  }
}

db.close();
console.error(`[migrate] Done. ${ran} migration(s) applied.`);
