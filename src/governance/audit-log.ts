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

const GENESIS_HASH = "0".repeat(64);

/**
 * Produce a deterministic string representation of an audit event so that the
 * hash chain is stable regardless of object key insertion order.
 */
function canonicalize(event: AuditEvent): string {
  const metadata = Object.keys(event.metadata)
    .sort()
    .map((key) => `${key}=${event.metadata[key]}`)
    .join("&");
  return [
    event.id,
    event.at,
    event.actor,
    event.action,
    event.resource,
    event.outcome,
    metadata,
  ].join("|");
}

function hashEntry(previousHash: string, event: AuditEvent): string {
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
export class AuditLog {
  readonly #entries: AuditLogEntry[] = [];

  /** Seal an event into the log and return its chained entry. */
  append(event: AuditEvent): AuditLogEntry {
    const last = this.#entries.at(-1);
    const previousHash = last?.hash ?? GENESIS_HASH;
    const entry: AuditLogEntry = {
      event,
      sequence: this.#entries.length,
      previousHash,
      hash: hashEntry(previousHash, event),
    };
    this.#entries.push(entry);
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
      const expected = hashEntry(previousHash, entry.event);
      if (entry.previousHash !== previousHash || entry.hash !== expected) {
        return { valid: false, brokenAt: entry.sequence };
      }
      previousHash = entry.hash;
    }
    return { valid: true };
  }
}
