/**
 * CLI tool: provision a new API key and persist it to the SQLite store.
 *
 * Usage:
 *   node --experimental-strip-types scripts/provision-api-key.ts \
 *     --subject user-123 \
 *     --permissions "application:read,device:read" \
 *     [--db /data/ceop.db]
 *
 * The raw secret is printed ONCE to stdout in the form:
 *   KEY_ID=<hex>
 *   KEY_SECRET=<hex>
 *   CREDENTIAL=<keyId>:<secret>
 *
 * Only the HMAC-SHA256 hash of the secret is written to the database.
 * Record and deliver the credential securely — it cannot be recovered later.
 *
 * Exit codes:
 *   0 — success
 *   1 — validation error (see stderr)
 *   2 — database error (see stderr)
 */

import { randomBytes, createHmac } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  subject: string;
  permissions: string[];
  dbPath: string;
} {
  const args = argv.slice(2);
  let subject = "";
  let permissionsRaw = "";
  let dbPath = process.env["CEOP_SQLITE_FILE"] ?? "/data/ceop.db";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--subject" && args[i + 1]) {
      subject = args[++i] ?? "";
    } else if (arg === "--permissions" && args[i + 1]) {
      permissionsRaw = args[++i] ?? "";
    } else if (arg === "--db" && args[i + 1]) {
      dbPath = args[++i] ?? dbPath;
    }
  }

  if (!subject) {
    console.error("[provision] Error: --subject is required");
    process.exit(1);
  }

  const permissions = permissionsRaw
    ? permissionsRaw.split(",").map((p) => p.trim()).filter(Boolean)
    : ["*:*"];

  return { subject, permissions, dbPath };
}

// ---------------------------------------------------------------------------
// API key helpers (mirrors src/api/middleware/auth.ts logic)
// ---------------------------------------------------------------------------

function computeSecretHash(keyId: string, secret: string): string {
  return createHmac("sha256", keyId).update(secret).digest("hex");
}

function generateApiKey(subject: string, permissions: readonly string[]): {
  keyId: string;
  secret: string;
  secretHash: string;
  subject: string;
  permissions: readonly string[];
} {
  const keyId = randomBytes(16).toString("hex");
  const secret = randomBytes(32).toString("hex");
  const secretHash = computeSecretHash(keyId, secret);
  return { keyId, secret, secretHash, subject, permissions };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function ensureApiKeyTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      key_id      TEXT PRIMARY KEY,
      subject     TEXT NOT NULL,
      permissions TEXT NOT NULL,
      secret_hash TEXT NOT NULL,
      created_at  TEXT NOT NULL
    )
  `);
}

function insertApiKey(
  db: DatabaseSync,
  record: {
    keyId: string;
    subject: string;
    permissions: readonly string[];
    secretHash: string;
  },
): void {
  const stmt = db.prepare(
    `INSERT INTO api_keys (key_id, subject, permissions, secret_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  stmt.run(
    record.keyId,
    record.subject,
    JSON.stringify(record.permissions),
    record.secretHash,
    new Date().toISOString(),
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { subject, permissions, dbPath } = parseArgs(process.argv);

let db: DatabaseSync;
try {
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
} catch (e) {
  console.error("[provision] Failed to open database:", e);
  process.exit(2);
}

try {
  ensureApiKeyTable(db);
  const cred = generateApiKey(subject, permissions);
  insertApiKey(db, cred);

  // Print credentials once — never stored in plaintext.
  console.log(`KEY_ID=${cred.keyId}`);
  console.log(`KEY_SECRET=${cred.secret}`);
  console.log(`CREDENTIAL=${cred.keyId}:${cred.secret}`);
  console.error(`[provision] API key created for subject="${subject}" permissions=${JSON.stringify(permissions)}`);
  console.error(`[provision] Store the CREDENTIAL securely — it cannot be recovered.`);
} catch (e) {
  console.error("[provision] Failed to create API key:", e);
  db.close();
  process.exit(2);
}

db.close();
