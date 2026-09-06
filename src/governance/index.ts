/**
 * Governance Core — the platform's security and audit gate.
 *
 * - {@link evaluateAccess} decides access with deny-overrides precedence.
 * - {@link AuditLog} records tamper-evident, append-only evidence.
 * - {@link archiveExpiredAuditEvents} classifies old evidence as archived
 *   without ever mutating the hash chain.
 */
export * from "./policy-engine.ts";
export * from "./audit-log.ts";
export * from "./audit-archive.ts";
