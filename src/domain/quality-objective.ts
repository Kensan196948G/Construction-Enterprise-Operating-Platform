/**
 * Quality objective domain (Civil-Construction-Management-Platform 品質目標).
 *
 * ISO 9001 quality objectives: measurable targets with baseline and target
 * values, owned by a role or person, and tracked to a due date.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type QualityObjectiveId = Brand<string, "QualityObjectiveId">;
export const qualityObjectiveId = (value: string): QualityObjectiveId =>
  value as QualityObjectiveId;

export const QUALITY_OBJECTIVE_STATUSES = ["active", "achieved", "cancelled"] as const;
export type QualityObjectiveStatus = (typeof QUALITY_OBJECTIVE_STATUSES)[number];

export interface QualityObjective {
  readonly id: QualityObjectiveId;
  readonly organizationId: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly target?: string | undefined;
  readonly unit?: string | undefined;
  readonly baseline?: number | undefined;
  readonly targetValue?: number | undefined;
  readonly status: QualityObjectiveStatus;
  readonly dueDate?: string | undefined;
  readonly ownerId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateQualityObjectiveInput {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly target?: string | undefined;
  readonly unit?: string | undefined;
  readonly baseline?: number | undefined;
  readonly targetValue?: number | undefined;
  readonly status?: QualityObjectiveStatus | undefined;
  readonly dueDate?: string | undefined;
  readonly ownerId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

function isFiniteNumber(value: number | undefined): boolean {
  return value === undefined || Number.isFinite(value);
}

export function createQualityObjective(
  input: CreateQualityObjectiveInput,
): Result<QualityObjective> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.title, "title")
    .oneOf(input.status ?? "active", QUALITY_OBJECTIVE_STATUSES, "status")
    .require(isFiniteNumber(input.baseline), "baseline", "baseline must be a finite number")
    .require(
      isFiniteNumber(input.targetValue),
      "targetValue",
      "targetValue must be a finite number",
    )
    .require(
      input.dueDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate),
      "dueDate",
      "dueDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: qualityObjectiveId(input.id),
    organizationId: input.organizationId,
    title: input.title.trim(),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    ...(input.target !== undefined ? { target: input.target } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.baseline !== undefined ? { baseline: input.baseline } : {}),
    ...(input.targetValue !== undefined ? { targetValue: input.targetValue } : {}),
    status: input.status ?? "active",
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateQualityObjectiveInput {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly target?: string | undefined;
  readonly unit?: string | undefined;
  readonly baseline?: number | undefined;
  readonly targetValue?: number | undefined;
  readonly status?: QualityObjectiveStatus | undefined;
  readonly dueDate?: string | undefined;
  readonly ownerId?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateQualityObjective(
  objective: QualityObjective,
  input: UpdateQualityObjectiveInput,
): Result<QualityObjective> {
  const issues = new ValidationBuilder()
    .require(
      input.title === undefined || input.title.trim().length > 0,
      "title",
      "title must be a non-empty string when present",
    )
    .oneOf(input.status ?? objective.status, QUALITY_OBJECTIVE_STATUSES, "status")
    .require(isFiniteNumber(input.baseline), "baseline", "baseline must be a finite number")
    .require(
      isFiniteNumber(input.targetValue),
      "targetValue",
      "targetValue must be a finite number",
    )
    .require(
      input.dueDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate),
      "dueDate",
      "dueDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...objective,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    ...(input.target !== undefined ? { target: input.target } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.baseline !== undefined ? { baseline: input.baseline } : {}),
    ...(input.targetValue !== undefined ? { targetValue: input.targetValue } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    updatedAt: input.updatedAt,
  });
}
