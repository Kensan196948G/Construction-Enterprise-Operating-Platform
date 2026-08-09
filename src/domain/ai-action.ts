/**
 * AI action governance domain (integration Y-09 / L-07).
 *
 * Governed AI requests are recorded as immutable action records with a
 * state machine: `pending` → `approved` | `rejected`. Every transition is
 * audited by the API layer; the domain itself only validates invariants.
 *
 * Beyond approval, each action carries AI-governance metadata required for
 * production operation:
 *   - evidenceRefs        grounding/根拠資料 (RAG sources, documents)
 *   - inputRetentionDays  入力データ保持日数（0 = 保持しない）
 *   - piiSensitive        個人情報を含む入力か（プロンプト実体は保存しない）
 *   - wrongAnswerMitigation 誤回答対策（フォールバック・人的確認手順）
 *   - operationStatus     モデル利用の継続可否（operational / limited / stopped）
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

export const AI_OPERATION_STATUSES = ["operational", "limited", "stopped"] as const;
export type AiOperationStatus = (typeof AI_OPERATION_STATUSES)[number];

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
  /** 根拠表示のための出典参照（文書 ID・URL 等）。プロンプト実体は保存しない。 */
  readonly evidenceRefs: readonly string[];
  /** 入力データ保持日数。0 = 保持しない（最小保持）。既定 30 日。 */
  readonly inputRetentionDays: number;
  /** 個人情報を含む入力か。true の場合は実体保存を禁止し、監査・利用停止を厳格化。 */
  readonly piiSensitive: boolean;
  /** 誤回答対策（フォールバック手順・人的確認）。 */
  readonly wrongAnswerMitigation?: string | undefined;
  /** モデル利用の継続可否。API 層が停止時は呼び出しを拒否する。 */
  readonly operationStatus: AiOperationStatus;
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
  readonly evidenceRefs?: readonly string[] | undefined;
  readonly inputRetentionDays?: number | undefined;
  readonly piiSensitive?: boolean | undefined;
  readonly wrongAnswerMitigation?: string | undefined;
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
    .require(
      input.evidenceRefs === undefined || input.evidenceRefs.every((r) => r.trim().length > 0),
      "evidenceRefs",
      "evidenceRefs must be non-empty strings when present",
    )
    .require(
      input.inputRetentionDays === undefined ||
        (Number.isInteger(input.inputRetentionDays) && input.inputRetentionDays >= 0),
      "inputRetentionDays",
      "inputRetentionDays must be a non-negative integer",
    )
    .require(
      input.wrongAnswerMitigation === undefined || input.wrongAnswerMitigation.trim().length > 0,
      "wrongAnswerMitigation",
      "wrongAnswerMitigation must be a non-empty string when present",
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
    evidenceRefs: input.evidenceRefs !== undefined ? input.evidenceRefs.map((r) => r.trim()) : [],
    inputRetentionDays: input.inputRetentionDays ?? 30,
    piiSensitive: input.piiSensitive ?? false,
    ...(input.wrongAnswerMitigation !== undefined
      ? { wrongAnswerMitigation: input.wrongAnswerMitigation.trim() }
      : {}),
    operationStatus: "operational",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
}

export interface SetAiOperationStatusInput {
  readonly status: AiOperationStatus;
  readonly actor: string;
  readonly at: IsoTimestamp;
  readonly reason?: string;
}

/**
 * Set the model-usage state. `stopped` is the 利用停止手段: the API layer
 * refuses new calls while it is active; `limited` allows approved calls only.
 */
export function setAiOperationStatus(
  action: AiAction,
  input: SetAiOperationStatusInput,
): Result<AiAction> {
  const issues = new ValidationBuilder()
    .oneOf(input.status, AI_OPERATION_STATUSES, "status")
    .nonEmpty(input.actor, "actor")
    .require(
      input.reason === undefined || input.reason.trim().length > 0,
      "reason",
      "reason must be a non-empty string when present",
    )
    .build();
  if (issues.length > 0) return err(issues);
  return ok({
    ...action,
    operationStatus: input.status,
    updatedAt: input.at,
    decidedBy: input.actor.trim(),
    decidedAt: input.at,
    ...(input.reason !== undefined ? { decisionNote: input.reason.trim() } : {}),
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
