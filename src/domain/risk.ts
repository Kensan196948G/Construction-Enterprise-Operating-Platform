/**
 * Risk register domain (Civil-Construction-Management-Platform リスク).
 *
 * ISO 9001 risk management: likelihood / impact ratings, computed risk level,
 * and the treatment lifecycle from identification through closure.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { type QualityObjectiveId, qualityObjectiveId } from "./quality-objective.ts";

export type RiskId = Brand<string, "RiskId">;
export const riskId = (value: string): RiskId => value as RiskId;

export const RISK_LEVELS = ["very_low", "low", "medium", "high", "very_high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_STATUSES = ["identified", "assessed", "mitigated", "accepted", "closed"] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export interface Risk {
  readonly id: RiskId;
  readonly organizationId: string;
  readonly objectiveId?: QualityObjectiveId | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly likelihood: number;
  readonly impact: number;
  readonly riskLevel: RiskLevel;
  readonly status: RiskStatus;
  readonly treatmentPlan?: string | undefined;
  readonly residualRisk?: string | undefined;
  readonly ownerId?: string | undefined;
  readonly reviewDate?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateRiskInput {
  readonly id: string;
  readonly organizationId: string;
  readonly objectiveId?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly likelihood?: number | undefined;
  readonly impact?: number | undefined;
  readonly riskLevel?: RiskLevel | undefined;
  readonly status?: RiskStatus | undefined;
  readonly treatmentPlan?: string | undefined;
  readonly residualRisk?: string | undefined;
  readonly ownerId?: string | undefined;
  readonly reviewDate?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

function isRating(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 1 && value <= 5);
}

/** 5×5 risk matrix: product of likelihood × impact mapped to a level. */
export function matrixRiskLevel(likelihood: number, impact: number): RiskLevel {
  const score = likelihood * impact;
  if (score >= 20) return "very_high";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  if (score >= 3) return "low";
  return "very_low";
}

export function createRisk(input: CreateRiskInput): Result<Risk> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.title, "title")
    .require(isRating(input.likelihood), "likelihood", "likelihood must be an integer 1-5")
    .require(isRating(input.impact), "impact", "impact must be an integer 1-5")
    .oneOf(input.riskLevel ?? "medium", RISK_LEVELS, "riskLevel")
    .oneOf(input.status ?? "identified", RISK_STATUSES, "status")
    .require(
      input.reviewDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.reviewDate),
      "reviewDate",
      "reviewDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const likelihood = input.likelihood ?? 3;
  const impact = input.impact ?? 3;
  return ok({
    id: riskId(input.id),
    organizationId: input.organizationId,
    ...(input.objectiveId !== undefined
      ? { objectiveId: qualityObjectiveId(input.objectiveId) }
      : {}),
    title: input.title.trim(),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    likelihood,
    impact,
    riskLevel: input.riskLevel ?? matrixRiskLevel(likelihood, impact),
    status: input.status ?? "identified",
    ...(input.treatmentPlan !== undefined ? { treatmentPlan: input.treatmentPlan } : {}),
    ...(input.residualRisk !== undefined ? { residualRisk: input.residualRisk } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    ...(input.reviewDate !== undefined ? { reviewDate: input.reviewDate } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateRiskInput {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly likelihood?: number | undefined;
  readonly impact?: number | undefined;
  readonly riskLevel?: RiskLevel | undefined;
  readonly status?: RiskStatus | undefined;
  readonly treatmentPlan?: string | undefined;
  readonly residualRisk?: string | undefined;
  readonly ownerId?: string | undefined;
  readonly reviewDate?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateRisk(risk: Risk, input: UpdateRiskInput): Result<Risk> {
  const issues = new ValidationBuilder()
    .require(
      input.title === undefined || input.title.trim().length > 0,
      "title",
      "title must be a non-empty string when present",
    )
    .require(isRating(input.likelihood), "likelihood", "likelihood must be an integer 1-5")
    .require(isRating(input.impact), "impact", "impact must be an integer 1-5")
    .oneOf(input.riskLevel ?? risk.riskLevel, RISK_LEVELS, "riskLevel")
    .oneOf(input.status ?? risk.status, RISK_STATUSES, "status")
    .require(
      input.reviewDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.reviewDate),
      "reviewDate",
      "reviewDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const likelihood = input.likelihood ?? risk.likelihood;
  const impact = input.impact ?? risk.impact;
  return ok({
    ...risk,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    likelihood,
    impact,
    riskLevel: input.riskLevel ?? matrixRiskLevel(likelihood, impact),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.treatmentPlan !== undefined ? { treatmentPlan: input.treatmentPlan } : {}),
    ...(input.residualRisk !== undefined ? { residualRisk: input.residualRisk } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    ...(input.reviewDate !== undefined ? { reviewDate: input.reviewDate } : {}),
    updatedAt: input.updatedAt,
  });
}
