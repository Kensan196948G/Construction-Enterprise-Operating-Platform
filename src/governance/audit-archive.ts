/**
 * Audit-event long-term retention / archival (issue #83).
 *
 * The hash chain in {@link AuditLog} / {@link SqliteAuditLog} is append-only by
 * design: every entry's hash commits to its predecessor, so the evidence trail
 * can only be *verified*, never edited, without detection. "Archiving" an old
 * event must therefore never rewrite, reorder, or remove a chain entry — doing
 * so would either break `verify()` or (worse) silently succeed by recomputing
 * a shorter, still-internally-consistent chain that omits history.
 *
 * Instead, archival here is a side index: a separate `AuditArchiveStore` that
 * records which chain *sequence numbers* are old enough to be considered
 * "archived" (WORM: Write Once, Read Many). The underlying log is never
 * mutated, so:
 *
 *   - {@link IAuditLog.verify} keeps working exactly as before, over the full,
 *     untouched chain — archiving cannot invalidate it.
 *   - Archived events remain queryable (via {@link IAuditLog.entries} /
 *     {@link IAuditLog.query}) for as long as the underlying log retains them;
 *     archival is a *classification*, not a deletion.
 *   - The store itself has both an in-memory and a SQLite-backed
 *     implementation, mirroring the existing `AuditLog` / `SqliteAuditLog`
 *     split, so the "archived flag" survives process restarts wherever the
 *     audit log itself does.
 */

import { DatabaseSync } from "node:sqlite";
import type { StatementSync } from "node:sqlite";
import type { AuditLogEntry, IAuditLog } from "./audit-log.ts";

/**
 * Default retention period, in days, before an audit event becomes eligible
 * for archival.
 *
 * 2555 days (~7 years) matches common ISO 9001 / J-SOX evidence-retention
 * guidance for governance and financial-control audit trails. Deployments
 * with a different statutory requirement should override this via the
 * `retentionDays` option (or the `CEOP_AUDIT_RETENTION_DAYS` environment
 * variable, read at the call site in `src/app.ts`) rather than editing this
 * constant.
 */
export const DEFAULT_AUDIT_RETENTION_DAYS = 2555;

export interface ArchiveExpiredAuditEventsOptions {
  /** Retention window, in days. Defaults to {@link DEFAULT_AUDIT_RETENTION_DAYS}. */
  readonly retentionDays?: number;
  /** Clock override for deterministic tests. Defaults to `new Date()`. */
  readonly now?: Date;
}

export interface ArchiveExpiredAuditEventsResult {
  /** Number of entries newly marked archived by this run. */
  readonly archivedCount: number;
  /** Sequence numbers newly archived by this run (already-archived entries are skipped). */
  readonly archivedSequences: readonly number[];
  /** ISO timestamp of the retention cutoff used for this run (events at/after it are kept). */
  readonly cutoff: string;
  /** Total number of archived entries in the store after this run. */
  readonly totalArchived: number;
}

/**
 * Port for a store recording which audit-log sequence numbers have been
 * archived. Implementations must be idempotent: marking an already-archived
 * sequence again must not change its recorded `archivedAt`.
 */
export interface AuditArchiveStore {
  /** Mark a sequence as archived at the given ISO timestamp. No-op if already archived. */
  markArchived(sequence: number, archivedAt: string): void;
  /** True if the sequence has been archived. */
  isArchived(sequence: number): boolean;
  /** The timestamp a sequence was archived at, or undefined if it is not archived. */
  archivedAt(sequence: number): string | undefined;
  /** All archived sequence numbers, in ascending order. */
  archivedSequences(): readonly number[];
  /** Count of archived sequences. */
  readonly size: number;
}

/** In-memory {@link AuditArchiveStore}, paired with the in-memory `AuditLog`. */
export class InMemoryAuditArchiveStore implements AuditArchiveStore {
  readonly #archived = new Map<number, string>();

  markArchived(sequence: number, archivedAt: string): void {
    if (!this.#archived.has(sequence)) {
      this.#archived.set(sequence, archivedAt);
    }
  }

  isArchived(sequence: number): boolean {
    return this.#archived.has(sequence);
  }

  archivedAt(sequence: number): string | undefined {
    return this.#archived.get(sequence);
  }

  archivedSequences(): readonly number[] {
    return [...this.#archived.keys()].sort((a, b) => a - b);
  }

  get size(): number {
    return this.#archived.size;
  }
}

/**
 * SQLite-backed {@link AuditArchiveStore}, paired with `SqliteAuditLog`.
 *
 * Deliberately a separate table (`audit_archive`) rather than a column on
 * `audit_log`: the audit log table is the tamper-evident evidence itself, and
 * `SqliteAuditLog.verify()` cross-checks every one of its columns against the
 * serialized entry. Keeping archival state in its own table means it can
 * never participate in — or be mistaken for — that integrity check.
 */
export class SqliteAuditArchiveStore implements AuditArchiveStore {
  readonly #db: DatabaseSync;

  constructor(dbPath: string) {
    this.#db = new DatabaseSync(dbPath);
    this.#db.exec("PRAGMA journal_mode = WAL");
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS audit_archive (
        sequence    INTEGER PRIMARY KEY,
        archived_at TEXT    NOT NULL
      )
    `);
  }

  markArchived(sequence: number, archivedAt: string): void {
    const stmt: StatementSync = this.#db.prepare(
      "INSERT OR IGNORE INTO audit_archive (sequence, archived_at) VALUES (?, ?)",
    );
    stmt.run(sequence, archivedAt);
  }

  isArchived(sequence: number): boolean {
    const row = this.#db
      .prepare("SELECT 1 AS found FROM audit_archive WHERE sequence = ?")
      .get(sequence) as { found: number } | undefined;
    return row !== undefined;
  }

  archivedAt(sequence: number): string | undefined {
    const row = this.#db
      .prepare("SELECT archived_at AS archivedAt FROM audit_archive WHERE sequence = ?")
      .get(sequence) as { archivedAt: string } | undefined;
    return row?.archivedAt;
  }

  archivedSequences(): readonly number[] {
    const rows = this.#db
      .prepare("SELECT sequence FROM audit_archive ORDER BY sequence ASC")
      .all() as { sequence: number }[];
    return rows.map((r) => r.sequence);
  }

  get size(): number {
    const row = this.#db.prepare("SELECT COUNT(*) AS n FROM audit_archive").get() as {
      n: number;
    };
    return row.n;
  }

  /** Close the database connection. Call on graceful shutdown. */
  close(): void {
    this.#db.close();
  }
}

/**
 * Batch process: mark every audit entry older than the retention period as
 * archived in `store`. The underlying `auditLog` is never written to — this
 * only reads {@link IAuditLog.entries} and updates the side-index `store`.
 *
 * Idempotent and safe to run repeatedly (e.g. from a daily scheduled job):
 * entries within the retention window are left alone, and already-archived
 * entries are skipped rather than re-marked.
 */
export function archiveExpiredAuditEvents(
  auditLog: IAuditLog,
  store: AuditArchiveStore,
  options: ArchiveExpiredAuditEventsOptions = {},
): ArchiveExpiredAuditEventsResult {
  const retentionDays = options.retentionDays ?? DEFAULT_AUDIT_RETENTION_DAYS;
  const now = options.now ?? new Date();
  const cutoffMs = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
  const cutoff = new Date(cutoffMs).toISOString();
  const archivedAtStamp = now.toISOString();

  const archivedSequences: number[] = [];
  for (const entry of auditLog.entries) {
    if (store.isArchived(entry.sequence)) continue;
    const eventTime = Date.parse(entry.event.at as string);
    // An unparsable timestamp is a data-quality problem, not a retention
    // decision: never archive an event this function cannot age-check.
    if (Number.isNaN(eventTime)) continue;
    if (eventTime < cutoffMs) {
      store.markArchived(entry.sequence, archivedAtStamp);
      archivedSequences.push(entry.sequence);
    }
  }

  return {
    archivedCount: archivedSequences.length,
    archivedSequences,
    cutoff,
    totalArchived: store.size,
  };
}

/** An audit chain entry annotated with its archive status for API responses. */
export interface AuditEntryWithArchiveStatus extends AuditLogEntry {
  readonly archived: boolean;
  readonly archivedAt?: string;
}

/** Annotate a chain entry with its archive status, without mutating it. */
export function withArchiveStatus(
  entry: AuditLogEntry,
  store: AuditArchiveStore,
): AuditEntryWithArchiveStatus {
  const archivedAt = store.archivedAt(entry.sequence);
  return archivedAt !== undefined
    ? { ...entry, archived: true, archivedAt }
    : { ...entry, archived: false };
}
