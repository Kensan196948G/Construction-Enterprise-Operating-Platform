import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type AuditEventId = Brand<string, "AuditEventId">;
export const auditEventId = (value: string): AuditEventId => value as AuditEventId;

/**
 * Reserved `metadata` key carrying the tenant an event belongs to.
 *
 * Tenant attribution lives in `metadata` rather than as a top-level field on
 * purpose: the audit hash chain canonicalizes an explicit field list plus the
 * whole metadata map, so a metadata key is covered by tamper evidence without
 * redefining the hash — which would invalidate every previously sealed entry.
 * Only the audit recorder may set it, from the resolved caller context.
 */
export const AUDIT_ORG_KEY = "organizationId";

/** The terminal disposition of an audited action. */
export const AUDIT_OUTCOMES = ["success", "failure", "denied"] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

/**
 * An immutable record of a governed action. Audit events are the evidence base
 * for ISO / J-SOX style compliance reporting and must never be mutated in place.
 */
export interface AuditEvent {
  readonly id: AuditEventId;
  readonly at: IsoTimestamp;
  /** Subject performing the action (user id, service id, or `system`). */
  readonly actor: string;
  /** Action verb, e.g. `application:read`, `policy:update`. */
  readonly action: string;
  /** Resource the action targeted. */
  readonly resource: string;
  readonly outcome: AuditOutcome;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface CreateAuditEventInput {
  readonly id: string;
  readonly at: IsoTimestamp;
  readonly actor: string;
  readonly action: string;
  readonly resource: string;
  readonly outcome: AuditOutcome;
  readonly metadata?: Readonly<Record<string, string>>;
}

export function createAuditEvent(input: CreateAuditEventInput): Result<AuditEvent> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.actor, "actor")
    .nonEmpty(input.action, "action")
    .nonEmpty(input.resource, "resource")
    .oneOf(input.outcome, AUDIT_OUTCOMES, "outcome")
    .build();

  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    id: auditEventId(input.id),
    at: input.at,
    actor: input.actor,
    action: input.action,
    resource: input.resource,
    outcome: input.outcome,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
  });
}
