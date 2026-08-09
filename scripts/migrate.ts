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
    description:
      "schema consolidation: workflows/revoked_jtis tables + FK constraints on domain tables (v0.6.0)",
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
  {
    version: "005",
    description: "api_keys.organization_id column for tenant-scoped credentials (v0.6.0)",
    up: `
      ALTER TABLE api_keys ADD COLUMN organization_id TEXT;
    `,
  },
  {
    version: "006",
    description: "workflow_instances table for Issue→Approval→Audit runs (integration L-02)",
    up: `
      CREATE TABLE IF NOT EXISTS workflow_instances (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        org_id      TEXT NOT NULL REFERENCES organizations(id),
        status      TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_org    ON workflow_instances (org_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances (status);
    `,
  },
  {
    version: "007",
    description: "ai_actions table for AI gateway governance (integration Y-09)",
    up: `
      CREATE TABLE IF NOT EXISTS ai_actions (
        id     TEXT PRIMARY KEY,
        data   TEXT NOT NULL,
        org_id TEXT,
        status TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ai_actions_org    ON ai_actions (org_id);
      CREATE INDEX IF NOT EXISTS idx_ai_actions_status ON ai_actions (status);
    `,
  },
  {
    version: "008",
    description: "projects table for construction projects (ServiceHub S-01)",
    up: `
      CREATE TABLE IF NOT EXISTS projects (
        id           TEXT PRIMARY KEY,
        data         TEXT NOT NULL,
        org_id       TEXT NOT NULL,
        project_code TEXT NOT NULL,
        status       TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code   ON projects (project_code);
      CREATE        INDEX IF NOT EXISTS idx_projects_org    ON projects (org_id);
      CREATE        INDEX IF NOT EXISTS idx_projects_status ON projects (status);
    `,
  },
  {
    version: "009",
    description: "daily_reports table for site daily reports (ServiceHub S-02)",
    up: `
      CREATE TABLE IF NOT EXISTS daily_reports (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        org_id      TEXT NOT NULL,
        project_id  TEXT NOT NULL REFERENCES projects(id),
        report_date TEXT NOT NULL,
        status      TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_daily_reports_org     ON daily_reports (org_id);
      CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports (project_id);
      CREATE INDEX IF NOT EXISTS idx_daily_reports_date    ON daily_reports (report_date);
      CREATE INDEX IF NOT EXISTS idx_daily_reports_status  ON daily_reports (status);
    `,
  },

  {
    version: "010",
    description: "photos table for photo/document metadata (ServiceHub S-03)",
    up: `
      CREATE TABLE IF NOT EXISTS photos (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        org_id     TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id),
        category   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_photos_org     ON photos (org_id);
      CREATE INDEX IF NOT EXISTS idx_photos_project ON photos (project_id);
    `,
  },
  {
    version: "011",
    description: "safety_checks table (ServiceHub S-04)",
    up: `
      CREATE TABLE IF NOT EXISTS safety_checks (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        org_id     TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id),
        check_date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_safety_checks_org     ON safety_checks (org_id);
      CREATE INDEX IF NOT EXISTS idx_safety_checks_project ON safety_checks (project_id);
      CREATE INDEX IF NOT EXISTS idx_safety_checks_date    ON safety_checks (check_date);
    `,
  },
  {
    version: "012",
    description: "quality_inspections table (ServiceHub S-04)",
    up: `
      CREATE TABLE IF NOT EXISTS quality_inspections (
        id              TEXT PRIMARY KEY,
        data            TEXT NOT NULL,
        org_id          TEXT NOT NULL,
        project_id      TEXT NOT NULL REFERENCES projects(id),
        inspection_date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quality_org     ON quality_inspections (org_id);
      CREATE INDEX IF NOT EXISTS idx_quality_project ON quality_inspections (project_id);
      CREATE INDEX IF NOT EXISTS idx_quality_date    ON quality_inspections (inspection_date);
    `,
  },
  {
    version: "013",
    description: "cost_records table (ServiceHub S-05)",
    up: `
      CREATE TABLE IF NOT EXISTS cost_records (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        org_id      TEXT NOT NULL,
        project_id  TEXT NOT NULL REFERENCES projects(id),
        record_date TEXT NOT NULL,
        category    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cost_org     ON cost_records (org_id);
      CREATE INDEX IF NOT EXISTS idx_cost_project ON cost_records (project_id);
      CREATE INDEX IF NOT EXISTS idx_cost_date    ON cost_records (record_date);
      CREATE INDEX IF NOT EXISTS idx_cost_category ON cost_records (category);
    `,
  },
  {
    version: "014",
    description: "work_hours table (ServiceHub S-05)",
    up: `
      CREATE TABLE IF NOT EXISTS work_hours (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        org_id     TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id),
        work_date  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_work_hours_org     ON work_hours (org_id);
      CREATE INDEX IF NOT EXISTS idx_work_hours_project ON work_hours (project_id);
      CREATE INDEX IF NOT EXISTS idx_work_hours_date    ON work_hours (work_date);
    `,
  },
  {
    version: "015",
    description: "notification_deliveries table (ServiceHub S-09)",
    up: `
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id     TEXT PRIMARY KEY,
        data   TEXT NOT NULL,
        org_id TEXT,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_org    ON notification_deliveries (org_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notification_deliveries (user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_deliveries (status);
    `,
  },
  {
    version: "016",
    description: "knowledge_articles table (ServiceHub S-06)",
    up: `
      CREATE TABLE IF NOT EXISTS knowledge_articles (
        id       TEXT PRIMARY KEY,
        data     TEXT NOT NULL,
        org_id   TEXT NOT NULL,
        category TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_knowledge_org      ON knowledge_articles (org_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_articles (category);
    `,
  },
  {
    version: "017",
    description: "legal_contracts table (ServiceHub S-07)",
    up: `
      CREATE TABLE IF NOT EXISTS legal_contracts (
        id              TEXT PRIMARY KEY,
        data            TEXT NOT NULL,
        org_id          TEXT NOT NULL,
        project_id      TEXT NOT NULL REFERENCES projects(id),
        contract_number TEXT NOT NULL,
        status          TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_number  ON legal_contracts (contract_number);
      CREATE        INDEX IF NOT EXISTS idx_contracts_org     ON legal_contracts (org_id);
      CREATE        INDEX IF NOT EXISTS idx_contracts_project ON legal_contracts (project_id);
      CREATE        INDEX IF NOT EXISTS idx_contracts_status  ON legal_contracts (status);
    `,
  },
  {
    version: "018",
    description: "documents table (Enterprise-OS E-03)",
    up: `
      CREATE TABLE IF NOT EXISTS documents (
        id            TEXT PRIMARY KEY,
        data          TEXT NOT NULL,
        org_id        TEXT NOT NULL,
        project_id    TEXT,
        document_type TEXT NOT NULL,
        status        TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_documents_org     ON documents (org_id);
      CREATE INDEX IF NOT EXISTS idx_documents_project ON documents (project_id);
      CREATE INDEX IF NOT EXISTS idx_documents_type    ON documents (document_type);
    `,
  },
  {
    version: "019",
    description: "work_schedules table (Enterprise-OS E-02)",
    up: `
      CREATE TABLE IF NOT EXISTS work_schedules (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        org_id     TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id),
        work_date  TEXT NOT NULL,
        status     TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_work_schedules_org     ON work_schedules (org_id);
      CREATE INDEX IF NOT EXISTS idx_work_schedules_project ON work_schedules (project_id);
      CREATE INDEX IF NOT EXISTS idx_work_schedules_date    ON work_schedules (work_date);
    `,
  },
  {
    version: "020",
    description: "purchase_orders table (Enterprise-OS E-05)",
    up: `
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id           TEXT PRIMARY KEY,
        data         TEXT NOT NULL,
        org_id       TEXT NOT NULL,
        project_id   TEXT NOT NULL REFERENCES projects(id),
        order_number TEXT NOT NULL,
        status       TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_number  ON purchase_orders (order_number);
      CREATE        INDEX IF NOT EXISTS idx_purchase_orders_org     ON purchase_orders (org_id);
      CREATE        INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders (project_id);
    `,
  },
  {
    version: "021",
    description: "notification_preferences table (Enterprise-OS E-11)",
    up: `
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id      TEXT PRIMARY KEY,
        data    TEXT NOT NULL,
        org_id  TEXT,
        user_id TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences (user_id);
      CREATE        INDEX IF NOT EXISTS idx_notification_prefs_org  ON notification_preferences (org_id);
    `,
  },
  {
    version: "022",
    description: "compliance_checks table (ServiceHub S-07)",
    up: `
      CREATE TABLE IF NOT EXISTS compliance_checks (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        org_id     TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id),
        standard   TEXT NOT NULL,
        result     TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_compliance_org      ON compliance_checks (org_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_project  ON compliance_checks (project_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_standard ON compliance_checks (standard);
    `,
  },
  {
    version: "023",
    description: "legal_evidence table (ServiceHub S-07)",
    up: `
      CREATE TABLE IF NOT EXISTS legal_evidence (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        org_id      TEXT NOT NULL,
        contract_id TEXT NOT NULL REFERENCES legal_contracts(id),
        event_type  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_legal_evidence_org      ON legal_evidence (org_id);
      CREATE INDEX IF NOT EXISTS idx_legal_evidence_contract ON legal_evidence (contract_id);
    `,
  },
  {
    version: "024",
    description: "notification_templates table (Enterprise-OS E-11)",
    up: `
      CREATE TABLE IF NOT EXISTS notification_templates (
        id           TEXT PRIMARY KEY,
        data         TEXT NOT NULL,
        org_id       TEXT,
        template_key TEXT NOT NULL,
        channel      TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_key ON notification_templates (template_key);
      CREATE        INDEX IF NOT EXISTS idx_notification_templates_org ON notification_templates (org_id);
    `,
  },
  {
    version: "025",
    description: "iso_records table (Civil-Construction-IMS 全 ISO モジュール吸収)",
    up: `
      CREATE TABLE IF NOT EXISTS iso_records (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        org_id     TEXT NOT NULL,
        kind       TEXT NOT NULL,
        project_id TEXT,
        status     TEXT NOT NULL,
        parent_id  TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_iso_org     ON iso_records (org_id);
      CREATE INDEX IF NOT EXISTS idx_iso_kind    ON iso_records (kind);
      CREATE INDEX IF NOT EXISTS idx_iso_project ON iso_records (project_id);
      CREATE INDEX IF NOT EXISTS idx_iso_status  ON iso_records (status);
      CREATE INDEX IF NOT EXISTS idx_iso_parent  ON iso_records (parent_id);
    `,
  },
  {
    version: "026",
    description: "integration_events table（連携先6システムの Webhook/イベント）",
    up: `
      CREATE TABLE IF NOT EXISTS integration_events (
        id              TEXT PRIMARY KEY,
        data            TEXT NOT NULL,
        system          TEXT NOT NULL,
        event_type      TEXT NOT NULL,
        direction       TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        status          TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_integration_system    ON integration_events (system);
      CREATE INDEX IF NOT EXISTS idx_integration_status    ON integration_events (status);
      CREATE INDEX IF NOT EXISTS idx_integration_direction ON integration_events (direction);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_idem
        ON integration_events (system, idempotency_key);
    `,
  },
];
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
