/**
 * JWT revocation store port and adapters.
 *
 * The RevocationStore port decouples the JwtIssuer from its persistence backend
 * so the same signing logic works with in-memory (test/single-restart) or
 * SQLite-backed (production) revocation tracking.
 */

import { createRequire } from "node:module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseSync = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StatementSync = any;

const _require = createRequire(import.meta.url);
const _sqlite = _require("node:sqlite") as { DatabaseSync: new (path: string) => DatabaseSync };

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

/**
 * Minimal interface for tracking revoked JWT IDs.
 * All methods are synchronous — node:sqlite's DatabaseSync is synchronous too,
 * so no async is needed and the JwtIssuer.revoke() call-site stays sync.
 */
export interface RevocationStore {
  /** Mark a JTI as revoked until `prunableAt` (Unix seconds). */
  revoke(jti: string, prunableAt: number): void;
  /** Return true if the JTI is present and not yet prunable. */
  isRevoked(jti: string): boolean;
  /** Remove entries whose `prunableAt` is ≤ `now` (Unix seconds). */
  prune(now: number): void;
}

// ---------------------------------------------------------------------------
// In-memory adapter (default — suitable for single-node / tests)
// ---------------------------------------------------------------------------

export function createInMemoryRevocationStore(): RevocationStore {
  const store = new Map<string, number>();
  return {
    revoke(jti, prunableAt) {
      store.set(jti, prunableAt);
    },
    isRevoked(jti) {
      const prunableAt = store.get(jti);
      if (prunableAt === undefined) return false;
      const now = Math.floor(Date.now() / 1000);
      return prunableAt > now;
    },
    prune(now) {
      for (const [id, prunableAt] of store) {
        if (prunableAt <= now) store.delete(id);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// SQLite adapter (production — survives process restarts)
// ---------------------------------------------------------------------------

/**
 * SQLite-backed revocation store.
 *
 * Schema: `revoked_jtis (jti TEXT PRIMARY KEY, prunable_at INTEGER NOT NULL)`
 *
 * Accepts an existing DatabaseSync instance so the revocation table shares
 * the same WAL journal as the application tables.
 */
export function createSqliteRevocationStore(db: DatabaseSync): RevocationStore {
  db.exec(`
    CREATE TABLE IF NOT EXISTS revoked_jtis (
      jti        TEXT    PRIMARY KEY,
      prunable_at INTEGER NOT NULL
    )
  `);

  const stmtRevoke: StatementSync = db.prepare(
    "INSERT OR REPLACE INTO revoked_jtis (jti, prunable_at) VALUES (?, ?)",
  );
  const stmtIsRevoked: StatementSync = db.prepare(
    "SELECT 1 FROM revoked_jtis WHERE jti = ? AND prunable_at > ?",
  );
  const stmtPrune: StatementSync = db.prepare("DELETE FROM revoked_jtis WHERE prunable_at <= ?");

  return {
    revoke(jti, prunableAt) {
      stmtRevoke.run(jti, prunableAt);
    },
    isRevoked(jti) {
      const now = Math.floor(Date.now() / 1000);
      const row = stmtIsRevoked.get(jti, now) as Record<string, unknown> | undefined;
      return row !== undefined;
    },
    prune(now) {
      stmtPrune.run(now);
    },
  };
}

/** Open a dedicated SQLite connection for the revocation store. */
export function openRevocationDatabase(filePath: string): DatabaseSync {
  const db = new _sqlite.DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL");
  return db;
}
