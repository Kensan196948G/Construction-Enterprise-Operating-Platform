/**
 * AI action governance domain (integration Y-09 / L-07).
 *
 * Governed AI requests are recorded as immutable action records with a
 * state machine: `pending` → `approved` | `rejected`. Every transition is
 * audited by the API layer; the domain itself only validates invariants.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type AiActionId = Brand<string, "AiActionId">;
export const aiActionId = (value: string): AiActionId => value as AiActionId;

export const AI_ACTION_STATUSES = ["pending", "approved", "rejected"] as const;
export type AiActionStatus = (typeof AI_ACTION_STATUSES)[number];

export const AI_ACTION_DECISIONS = ["approved", "rejected"] as const;
export type AiActionDecision = (typeof AI_ACTION_DECISIONS)[number];

/** Governed AI request record. */
export interface AiAction {
  readonly id: AiActionId;
  readonly requester: string;
  /** Tenant scope; undefined = platform-level action. */
  readonly organizationId?: string;
  /** Target AI provider/model, e.g. `deepseek:deepseek-chat`. */
  readonly model: string;
  /** Human-readable purpose of the AI call. */
  readonly purpose: string;
  /** SHA-256 (hex) of the prompt payload — never store the prompt itself. */
  readonly promptHash: string;
  readonly status: AiActionStatus;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly decidedBy?: string;
  readonly decidedAt?: IsoTimestamp;
  readonly decisionNote?: string;
}

export interface CreateAiActionInput {
  readonly id: string;
  readonly requester: string;
  readonly organizationId?: string;
  readonly model: string;
  readonly purpose: string;
  readonly promptHash: string;
  readonly createdAt: IsoTimestamp;
}

export function createAiAction(input: CreateAiActionInput): Result<AiAction> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.requester, "requester")
    .nonEmpty(input.model, "model")
    .nonEmpty(input.purpose, "purpose")
    .require(
      /^[0-9a-f]{64}$/i.test(input.promptHash ?? ""),
      "promptHash",
      "promptHash must be a 64-char hex SHA-256",
    )
    .require(
      input.organizationId === undefined || input.organizationId.trim().length > 0,
      "organizationId",
      "organizationId must be a non-empty string when present",
    )
    .build();
  if (issues.length > 0) {
    return err(issues);
  }

  const now = input.createdAt;
  return ok({
    id: aiActionId(input.id),
    requester: input.requester.trim(),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    model: input.model.trim(),
    purpose: input.purpose.trim(),
    promptHash: input.promptHash.toLowerCase(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
}

export interface DecideAiActionInput {
  readonly decision: AiActionDecision;
  readonly decidedBy: string;
  readonly decidedAt: IsoTimestamp;
  readonly note?: string;
}

/** Transition a pending action to approved/rejected. Invalid transitions return issues. */
export function decideAiAction(action: AiAction, input: DecideAiActionInput): Result<AiAction> {
  const issues = new ValidationBuilder()
    .require(
      action.status === "pending",
      "status",
      `cannot decide an action in state '${action.status}'`,
    )
    .nonEmpty(input.decidedBy, "decidedBy")
    .require(
      input.note === undefined || input.note.trim().length > 0,
      "note",
      "note must be a non-empty string when present",
    )
    .build();
  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    ...action,
    status: input.decision,
    updatedAt: input.decidedAt,
    decidedBy: input.decidedBy.trim(),
    decidedAt: input.decidedAt,
    ...(input.note !== undefined ? { decisionNote: input.note.trim() } : {}),
  });
}
