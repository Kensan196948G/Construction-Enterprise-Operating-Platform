/**
 * SQLite-backed audit log implementation (M11).
 *
 * Persists the tamper-evident hash chain to a `audit_log` table so evidence
 * survives process restarts. Uses the same synchronous DatabaseSync API as the
 * domain repositories, meaning `append()` stays synchronous and the caller
 * contract (IAuditLog) is identical to the in-memory AuditLog.
 *
 * Schema layout:
 *   sequence  INTEGER PRIMARY KEY  — monotone counter; ORDER BY sequence = insertion order
 *   event_id  TEXT UNIQUE          — idempotency guard (duplicate appends detected)
 *   at / actor / action / resource / outcome TEXT — indexed for compliance queries
 *   prev_hash / hash TEXT          — full hash-chain fields (verified by verify())
 *   data      TEXT                 — full AuditLogEntry JSON for round-trip fidelity
 *
 * Connection strategy: opens its own WAL connection to the same file.
 * SQLite WAL mode safely supports multiple concurrent readers from the same
 * process. Writes are serialised by Node.js's single-threaded event loop.
 */

import { createRequire } from "node:module";
import type { AuditEvent } from "../domain/audit-event.ts";
import {
  type AuditLogEntry,
  type IntegrityReport,
  type IAuditLog,
  GENESIS_HASH,
  hashAuditEntry,
} from "./audit-log.ts";

// node:sqlite ships without bundled TypeScript types in Node.js v22/v25.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseSync = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StatementSync = any;

const _require = createRequire(import.meta.url);
const _sqlite = _require("node:sqlite") as {
  DatabaseSync: new (path: string) => DatabaseSync;
};

export class SqliteAuditLog implements IAuditLog {
  readonly #db: DatabaseSync;

  constructor(dbPath: string) {
    this.#db = new _sqlite.DatabaseSync(dbPath);
    this.#db.exec("PRAGMA journal_mode = WAL");
    this.#db.exec("PRAGMA foreign_keys = ON");
    this.#initSchema();
  }

  #initSchema(): void {
    this.#db.exec(`
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
      )
    `);
    this.#db.exec(
      "CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_log (actor)",
    );
    this.#db.exec(
      "CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log (action)",
    );
    this.#db.exec(
      "CREATE INDEX IF NOT EXISTS idx_audit_at     ON audit_log (at)",
    );
    this.#db.exec(
      "CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log (resource)",
    );
  }

  /** Seal an event into the log and persist it atomically. */
  append(event: AuditEvent): AuditLogEntry {
    // Re-read tail state from DB on every append to avoid stale cache when
    // multiple SqliteAuditLog instances share the same WAL file.
    const countRow = this.#db
      .prepare("SELECT COUNT(*) AS n FROM audit_log")
      .get() as { n: number };
    const lastRow = this.#db
      .prepare("SELECT hash FROM audit_log ORDER BY sequence DESC LIMIT 1")
      .get() as { hash: string } | undefined;
    const previousHash = lastRow?.hash ?? GENESIS_HASH;
    const sequence = countRow.n;

    const hash = hashAuditEntry(previousHash, event);
    const entry: AuditLogEntry = {
      event,
      sequence,
      previousHash,
      hash,
    };
    const stmt: StatementSync = this.#db.prepare(`
      INSERT INTO audit_log
        (sequence, event_id, at, actor, action, resource, outcome, prev_hash, hash, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.sequence,
      event.id,
      event.at as string,
      event.actor,
      event.action,
      event.resource,
      event.outcome,
      previousHash,
      hash,
      JSON.stringify(entry),
    );
    return entry;
  }

  /** All persisted entries in insertion order (reads from DB on each call). */
  get entries(): readonly AuditLogEntry[] {
    const stmt: StatementSync = this.#db.prepare(
      "SELECT data FROM audit_log ORDER BY sequence ASC",
    );
    const rows = stmt.all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as AuditLogEntry);
  }

  get size(): number {
    const row = this.#db.prepare("SELECT COUNT(*) AS n FROM audit_log").get() as { n: number };
    return row.n;
  }

  query(predicate: (entry: AuditLogEntry) => boolean): AuditLogEntry[] {
    return this.entries.filter(predicate);
  }

  /** Recompute the hash chain from the persisted entries and verify integrity. */
  verify(): IntegrityReport {
    const stmt: StatementSync = this.#db.prepare(
      "SELECT sequence, event_id, at, actor, action, resource, outcome, prev_hash, hash, data FROM audit_log ORDER BY sequence ASC",
    );
    const rows = stmt.all() as {
      sequence: number;
      event_id: string;
      at: string;
      actor: string;
      action: string;
      resource: string;
      outcome: string;
      prev_hash: string;
      hash: string;
      data: string;
    }[];
    let previousHash = GENESIS_HASH;
    for (const row of rows) {
      let entry: AuditLogEntry;
      try {
        entry = JSON.parse(row.data) as AuditLogEntry;
      } catch {
        return { valid: false, brokenAt: row.sequence };
      }
      const expected = hashAuditEntry(previousHash, entry.event);
      // Cross-check hash chain AND all indexed columns against the JSON blob
      // so that direct column-level tampering (UPDATE on actor, at, etc.) is caught.
      if (
        entry.previousHash !== previousHash ||
        entry.hash !== expected ||
        row.prev_hash !== previousHash ||
        row.hash !== expected ||
        row.event_id !== entry.event.id ||
        row.at !== (entry.event.at as string) ||
        row.actor !== entry.event.actor ||
        row.action !== entry.event.action ||
        row.resource !== entry.event.resource ||
        row.outcome !== entry.event.outcome
      ) {
        return { valid: false, brokenAt: row.sequence };
      }
      previousHash = expected;
    }
    return { valid: true };
  }

  /** Close the database connection. Call on graceful shutdown. */
  close(): void {
    this.#db.close();
  }
}
