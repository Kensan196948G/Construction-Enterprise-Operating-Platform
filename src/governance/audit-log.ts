import { createHash } from "node:crypto";
import { type AuditEvent } from "../domain/audit-event.ts";

/** A sealed audit event, chained to its predecessor by hash. */
export interface AuditLogEntry {
  readonly event: AuditEvent;
  readonly sequence: number;
  readonly previousHash: string;
  readonly hash: string;
}

export interface IntegrityReport {
  readonly valid: boolean;
  /** Sequence index of the first broken entry, when `valid` is false. */
  readonly brokenAt?: number;
}

/** Port contract shared by in-memory and SQLite audit log implementations. */
export interface IAuditLog {
  /**
   * Seal an event into the log and return its chained entry.
   * @throws if an entry with the same event.id has already been appended.
   */
  append(event: AuditEvent): AuditLogEntry;
  readonly entries: readonly AuditLogEntry[];
  readonly size: number;
  query(predicate: (entry: AuditLogEntry) => boolean): AuditLogEntry[];
  verify(): IntegrityReport;
}

export const GENESIS_HASH = "0".repeat(64);

/**
 * Produce a deterministic string representation of an audit event so that the
 * hash chain is stable regardless of object key insertion order.
 *
 * Uses JSON.stringify with a fixed field order instead of delimiter-joined
 * strings: delimiters (|, &, =) can appear in field values and produce
 * collisions. JSON encoding is unambiguous by construction.
 */
export function canonicalize(event: AuditEvent): string {
  return JSON.stringify({
    id: event.id,
    at: event.at,
    actor: event.actor,
    action: event.action,
    resource: event.resource,
    outcome: event.outcome,
    metadata: Object.fromEntries(
      Object.keys(event.metadata)
        .sort()
        .map((k) => [k, event.metadata[k]]),
    ),
  });
}

export function hashAuditEntry(previousHash: string, event: AuditEvent): string {
  return createHash("sha256")
    .update(`${previousHash}\n${canonicalize(event)}`)
    .digest("hex");
}

/**
 * An append-only, tamper-evident audit log.
 *
 * Entries can only be added, never modified or removed, and each entry's hash
 * commits to the previous one. {@link verify} recomputes the chain to detect any
 * out-of-band mutation of recorded evidence.
 */
export class AuditLog implements IAuditLog {
  readonly #entries: AuditLogEntry[] = [];
  readonly #seenIds = new Set<string>();

  /** Seal an event into the log and return its chained entry. */
  append(event: AuditEvent): AuditLogEntry {
    if (this.#seenIds.has(event.id)) {
      throw new Error(`Duplicate audit event id: ${event.id}`);
    }
    const last = this.#entries.at(-1);
    const previousHash = last?.hash ?? GENESIS_HASH;
    const entry: AuditLogEntry = {
      event: Object.freeze({ ...event }),
      sequence: this.#entries.length,
      previousHash,
      hash: hashAuditEntry(previousHash, event),
    };
    this.#entries.push(entry);
    this.#seenIds.add(event.id);
    return entry;
  }

  /** A read-only snapshot of the chained entries in insertion order. */
  get entries(): readonly AuditLogEntry[] {
    return [...this.#entries];
  }

  get size(): number {
    return this.#entries.length;
  }

  /** Filter the log without exposing the mutable backing array. */
  query(predicate: (entry: AuditLogEntry) => boolean): AuditLogEntry[] {
    return this.#entries.filter(predicate);
  }

  /** Recompute the hash chain and report the first tampered entry, if any. */
  verify(): IntegrityReport {
    let previousHash = GENESIS_HASH;
    for (const entry of this.#entries) {
      const expected = hashAuditEntry(previousHash, entry.event);
      if (entry.previousHash !== previousHash || entry.hash !== expected) {
        return { valid: false, brokenAt: entry.sequence };
      }
      previousHash = entry.hash;
    }
    return { valid: true };
  }
}
