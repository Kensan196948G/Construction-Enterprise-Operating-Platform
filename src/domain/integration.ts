/**
 * Cross-system integration domain (linked platforms).
 *
 * CEOP coordinates six specialist systems without absorbing them. Every
 * inbound webhook and outbound event is persisted as an {@link IntegrationEvent}
 * so the platform can provide idempotent delivery, retry, audit, and a
 * contract-versioned surface for each system.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export const INTEGRATION_SYSTEMS = [
  "4d-planner",
  "dx-idea",
  "site-management",
  "ai-build",
  "portfolio-atlas",
  "photo-logger",
] as const;
export type IntegrationSystem = (typeof INTEGRATION_SYSTEMS)[number];

export const INTEGRATION_EVENT_STATUSES = [
  "received",
  "pending",
  "sent",
  "retrying",
  "failed",
  "acknowledged",
] as const;
export type IntegrationEventStatus = (typeof INTEGRATION_EVENT_STATUSES)[number];

export interface IntegrationEvent {
  readonly id: string;
  readonly system: IntegrationSystem;
  readonly eventType: string;
  readonly direction: "inbound" | "outbound";
  /** Client-supplied or generated idempotency key (unique per system). */
  readonly idempotencyKey: string;
  readonly organizationId?: string | undefined;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly status: IntegrationEventStatus;
  readonly attempts: number;
  readonly lastError?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly sentAt?: IsoTimestamp | undefined;
  readonly acknowledgedAt?: IsoTimestamp | undefined;
}

export interface CreateIntegrationEventInput {
  readonly id: string;
  readonly system: IntegrationSystem;
  readonly eventType: string;
  readonly direction: "inbound" | "outbound";
  readonly idempotencyKey: string;
  readonly organizationId?: string | undefined;
  readonly payload?: Readonly<Record<string, unknown>> | undefined;
  readonly createdAt: IsoTimestamp;
}

export function integrationSystem(value: string): IntegrationSystem | null {
  return (INTEGRATION_SYSTEMS as readonly string[]).includes(value)
    ? (value as IntegrationSystem)
    : null;
}

export function createIntegrationEvent(
  input: CreateIntegrationEventInput,
): Result<IntegrationEvent> {
  const system = integrationSystem(input.system);
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.eventType, "eventType")
    .nonEmpty(input.idempotencyKey, "idempotencyKey")
    .require(system !== null, "system", `system must be one of: ${INTEGRATION_SYSTEMS.join(", ")}`)
    .oneOf(input.direction, ["inbound", "outbound"], "direction");
  const problems = issues.build();
  if (problems.length > 0) return err(problems);
  return ok({
    id: input.id,
    system: system as IntegrationSystem,
    eventType: input.eventType.trim(),
    direction: input.direction,
    idempotencyKey: input.idempotencyKey,
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    payload: input.payload !== undefined ? { ...input.payload } : {},
    status: input.direction === "inbound" ? "received" : "pending",
    attempts: 0,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export function markIntegrationEvent(
  event: IntegrationEvent,
  status: IntegrationEventStatus,
  now: IsoTimestamp,
  lastError?: string,
): Result<IntegrationEvent> {
  if (!(INTEGRATION_EVENT_STATUSES as readonly string[]).includes(status)) {
    return err([{ path: "status", message: `invalid integration event status: ${status}` }]);
  }
  return ok({
    ...event,
    status,
    ...(lastError !== undefined ? { lastError } : {}),
    ...(status === "sent" ? { sentAt: now } : {}),
    ...(status === "acknowledged" ? { acknowledgedAt: now } : {}),
    attempts: status === "retrying" || status === "failed" ? event.attempts + 1 : event.attempts,
    updatedAt: now,
  });
}

export interface IntegrationContract {
  readonly system: IntegrationSystem;
  readonly label: string;
  readonly version: string;
  readonly inboundPath: string;
  readonly outboundEndpoint: string;
  readonly eventTypes: readonly string[];
  readonly auth: "shared-secret" | "jwt" | "api-key";
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly retryBackoffMs: number;
  readonly idempotency: "required" | "recommended";
  readonly failureMode: "queue" | "reject";
}

export const INTEGRATION_CONTRACTS: readonly IntegrationContract[] = [
  {
    system: "4d-planner",
    label: "Civil-4D-AI-Planner（4D工程・AI計画）",
    version: "v1",
    inboundPath: "/api/v1/integrations/webhooks/4d-planner",
    outboundEndpoint: "https://{host}/api/v1/ceop/events",
    eventTypes: ["schedule.updated", "plan.generated", "simulation.completed"],
    auth: "shared-secret",
    timeoutMs: 10_000,
    maxRetries: 3,
    retryBackoffMs: 1_000,
    idempotency: "required",
    failureMode: "queue",
  },
  {
    system: "dx-idea",
    label: "Construction-DX-Idea（DXアイデア）",
    version: "v1",
    inboundPath: "/api/v1/integrations/webhooks/dx-idea",
    outboundEndpoint: "https://{host}/api/ideas/events",
    eventTypes: ["idea.submitted", "idea.reviewed", "idea.selected", "idea.project_created"],
    auth: "shared-secret",
    timeoutMs: 10_000,
    maxRetries: 3,
    retryBackoffMs: 1_000,
    idempotency: "required",
    failureMode: "queue",
  },
  {
    system: "site-management",
    label: "Civil-Construction-Management-Platform（現場施工管理）",
    version: "v1",
    inboundPath: "/api/v1/integrations/webhooks/site-management",
    outboundEndpoint: "https://{host}/api/v1/integrations/events",
    eventTypes: ["site.daily_report", "site.approval", "site.instruction", "site.evidence"],
    auth: "shared-secret",
    timeoutMs: 15_000,
    maxRetries: 5,
    retryBackoffMs: 2_000,
    idempotency: "required",
    failureMode: "queue",
  },
  {
    system: "ai-build",
    label: "Civil-Construction-AI-Build-Platform（AI構築）",
    version: "v1",
    inboundPath: "/api/v1/integrations/webhooks/ai-build",
    outboundEndpoint: "https://{host}/api/v1/ai/events",
    eventTypes: ["model.registered", "model.reviewed", "model.risk_assessed", "model.deployed"],
    auth: "shared-secret",
    timeoutMs: 10_000,
    maxRetries: 3,
    retryBackoffMs: 1_000,
    idempotency: "required",
    failureMode: "queue",
  },
  {
    system: "portfolio-atlas",
    label: "DX-Project-Portfolio-Atlas（DXポートフォリオ）",
    version: "v1",
    inboundPath: "/api/v1/integrations/webhooks/portfolio-atlas",
    outboundEndpoint: "https://{host}/api/v1/portfolio/events",
    eventTypes: ["dxcase.updated", "budget.updated", "effect.measured", "kpi.updated"],
    auth: "shared-secret",
    timeoutMs: 10_000,
    maxRetries: 3,
    retryBackoffMs: 1_000,
    idempotency: "required",
    failureMode: "queue",
  },
  {
    system: "photo-logger",
    label: "Civil-Material-Photo-Logger（資材写真）",
    version: "v1",
    inboundPath: "/api/v1/integrations/webhooks/photo-logger",
    outboundEndpoint: "https://{host}/api/v1/photos/events",
    eventTypes: ["photo.captured", "photo.evidence_linked", "inspection.recorded"],
    auth: "shared-secret",
    timeoutMs: 10_000,
    maxRetries: 3,
    retryBackoffMs: 1_000,
    idempotency: "required",
    failureMode: "queue",
  },
];

export function contractForSystem(system: IntegrationSystem): IntegrationContract | undefined {
  return INTEGRATION_CONTRACTS.find((contract) => contract.system === system);
}

export type IntegrationEventId = Brand<string, "IntegrationEventId">;
export const integrationEventId = (value: string): IntegrationEventId =>
  value as IntegrationEventId;
