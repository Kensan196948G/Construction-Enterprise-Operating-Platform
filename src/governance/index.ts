/**
 * Governance Core — the platform's security and audit gate.
 *
 * - {@link evaluateAccess} decides access with deny-overrides precedence.
 * - {@link AuditLog} records tamper-evident, append-only evidence.
 */
export * from "./policy-engine.ts";
export * from "./audit-log.ts";
