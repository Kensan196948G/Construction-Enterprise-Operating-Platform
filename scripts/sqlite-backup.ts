/**
 * Consistent SQLite backup using VACUUM INTO.
 *
 * Usage:
 *   node --experimental-strip-types scripts/sqlite-backup.ts <dbPath> <destPath>
 *
 * VACUUM INTO writes a consistent snapshot to a new file, so the backup is
 * valid even if the source database is in WAL mode with uncheckpointed pages.
 * The destination file is replaced atomically (write to .tmp then rename).
 */

import { DatabaseSync } from "node:sqlite";
import { renameSync } from "node:fs";

function fail(message: string, code: number): never {
  console.error(`[backup] ${message}`);
  process.exit(code);
}

const [dbPath, destPath] = process.argv.slice(2);
if (!dbPath || !destPath) {
  fail("usage: node scripts/sqlite-backup.ts <dbPath> <destPath>", 1);
}
if (dbPath.includes("\n") || destPath.includes("\n") || destPath.includes("'")) {
  fail("paths must not contain newlines or single quotes", 1);
}

const tmpPath = `${destPath}.tmp`;
let db: DatabaseSync;
try {
  db = new DatabaseSync(dbPath);
  // Escape single quotes for SQL literal embedding (VACUUM INTO does not accept bind params).
  const escapedTmp = tmpPath.replace(/'/g, "''");
  db.exec(`VACUUM INTO '${escapedTmp}'`);
  db.close();
  renameSync(tmpPath, destPath);
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[backup] failed: ${message}`);
  process.exit(2);
}

console.error(`[backup] snapshot written to ${destPath}`);
