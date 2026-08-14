/**
 * Seed a persistent SQLite database with the fictional demo dataset.
 *
 * Usage:
 *   node --experimental-strip-types scripts/seed-demo.ts --db /path/ceop-demo.db
 *
 * Safety guards:
 *   - refuses to run when NODE_ENV=production
 *   - refuses to overwrite a database that already contains business data
 *     (projects) unless --force is given — protects real/production data
 *   - runs migrations first so all demo tables exist
 *
 * The dataset contains fictional data only (see src/persistence/rich-demo.ts).
 */

import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
import { createSqliteRepositories } from "../src/persistence/sqlite/index.ts";
import { seedRichDemo } from "../src/persistence/rich-demo.ts";
import { SqliteAuditLog } from "../src/governance/sqlite-audit-log.ts";
import { applyMigrations } from "./migrate.ts";

function parseArgs(argv: readonly string[]): { db: string; force: boolean } {
  const args = [...argv];
  let db: string | undefined;
  let force = false;
  while (args.length > 0) {
    const token = args.shift() as string;
    if (token === "--db") {
      db = args.shift();
    } else if (token === "--force") {
      force = true;
    } else {
      throw new Error(`unknown argument: ${token}`);
    }
  }
  if (db === undefined || db.trim() === "") {
    throw new Error("missing required --db <path>");
  }
  return { db, force };
}

async function main(): Promise<void> {
  if (process.env["NODE_ENV"]?.toLowerCase() === "production") {
    console.error("[seed-demo] Refusing to seed demo data in production.");
    process.exit(1);
  }
  const { db: dbPath, force } = parseArgs(process.argv.slice(2));
  console.error(`[seed-demo] Target database: ${dbPath}`);

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  applyMigrations(db);

  const repositories = createSqliteRepositories(dbPath);
  const existingCount = (await repositories.projects.findAll()).length;
  if (existingCount > 0 && !force) {
    console.error(
      `[seed-demo] Database already contains ${existingCount} project(s). ` +
        "Refusing to overwrite business data; re-run with --force to replace demo data.",
    );
    db.close();
    process.exit(2);
  }
  const auditLog = new SqliteAuditLog(dbPath);
  const summary = await seedRichDemo(repositories, { auditLog });
  console.error(`[seed-demo] Seeded: ${JSON.stringify(summary)}`);
  console.error("[seed-demo] Next: provision demo API keys with scripts/provision-api-key.ts");
  db.close();
}

// Run as a CLI only when executed directly (not when imported by tests).
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error("[seed-demo] Failed:", error);
    process.exit(2);
  });
}
