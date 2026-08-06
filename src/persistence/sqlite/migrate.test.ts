/**
 * Integration tests for the SQLite migration runner.
 *
 * Verifies that a fresh database receives all migrations, re-runs are
 * idempotent, the consolidated schema (workflows / revoked_jtis / FK
 * constraints) is in place, and foreign keys are enforced at the DB level.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyMigrations, MIGRATIONS } from "../../../scripts/migrate.ts";

function openTempDb(): { db: DatabaseSync; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "ceop-migrate-test-"));
  const db = new DatabaseSync(join(dir, "ceop.db"));
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  return { db, dir };
}

test("migrate: applies all migrations and is idempotent", () => {
  const { db, dir } = openTempDb();
  try {
    const first = applyMigrations(db);
    assert.equal(first, MIGRATIONS.length);
    const second = applyMigrations(db);
    assert.equal(second, 0);

    const rows = db.prepare("SELECT version FROM schema_migrations ORDER BY version").all() as {
      version: string;
    }[];
    assert.deepEqual(rows.map((r) => r.version), MIGRATIONS.map((m) => m.version));
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("migrate: consolidated schema exists and FK constraints are enforced", () => {
  const { db, dir } = openTempDb();
  try {
    applyMigrations(db);

    for (const table of ["workflows", "revoked_jtis", "audit_log", "api_keys"]) {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(table) as { name: string } | undefined;
      assert.ok(row, `expected table ${table}`);
    }

    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);

    db.prepare("INSERT INTO organizations (id, data, type, parent_id) VALUES (?, ?, ?, ?)").run(
      "org-1",
      "{}",
      "headquarters",
      null,
    );
    db.prepare("INSERT INTO users (id, data, email, org_id) VALUES (?, ?, ?, ?)").run(
      "u-1",
      "{}",
      "u@x.jp",
      "org-1",
    );

    assert.throws(() => {
      db.prepare("INSERT INTO users (id, data, email, org_id) VALUES (?, ?, ?, ?)").run(
        "u-bad",
        "{}",
        "bad@x.jp",
        "org-missing",
      );
    }, /FOREIGN KEY constraint failed/);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
