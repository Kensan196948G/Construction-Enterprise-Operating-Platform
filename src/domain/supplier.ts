/**
 * Supplier evaluation domain (Civil-Construction-Management-Platform 供給者).
 *
 * Periodic evaluations of material / subcontract suppliers against ISO
 * requirements, with an approval decision state.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type SupplierEvaluationId = Brand<string, "SupplierEvaluationId">;
export const supplierEvaluationId = (value: string): SupplierEvaluationId =>
  value as SupplierEvaluationId;

export const SUPPLIER_EVALUATION_STATUSES = [
  "pending",
  "approved",
  "conditional",
  "rejected",
] as const;
export type SupplierEvaluationStatus = (typeof SUPPLIER_EVALUATION_STATUSES)[number];

export interface SupplierEvaluation {
  readonly id: SupplierEvaluationId;
  readonly organizationId: string;
  readonly supplierName: string;
  readonly supplierCode?: string | undefined;
  readonly category?: string | undefined;
  readonly status: SupplierEvaluationStatus;
  readonly evaluationDate: string;
  readonly nextEvaluationDate?: string | undefined;
  readonly score?: number | undefined;
  readonly isoClause?: string | undefined;
  readonly notes?: string | undefined;
  readonly evaluatorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateSupplierEvaluationInput {
  readonly id: string;
  readonly organizationId: string;
  readonly supplierName: string;
  readonly supplierCode?: string | undefined;
  readonly category?: string | undefined;
  readonly status?: SupplierEvaluationStatus | undefined;
  readonly evaluationDate: string;
  readonly nextEvaluationDate?: string | undefined;
  readonly score?: number | undefined;
  readonly isoClause?: string | undefined;
  readonly notes?: string | undefined;
  readonly evaluatorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createSupplierEvaluation(
  input: CreateSupplierEvaluationInput,
): Result<SupplierEvaluation> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.supplierName, "supplierName")
    .oneOf(input.status ?? "pending", SUPPLIER_EVALUATION_STATUSES, "status")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.evaluationDate ?? ""),
      "evaluationDate",
      "evaluationDate must use YYYY-MM-DD",
    )
    .require(
      input.nextEvaluationDate === undefined ||
        /^\d{4}-\d{2}-\d{2}$/.test(input.nextEvaluationDate),
      "nextEvaluationDate",
      "nextEvaluationDate must use YYYY-MM-DD",
    )
    .require(
      input.score === undefined ||
        (Number.isInteger(input.score) && input.score >= 0 && input.score <= 100),
      "score",
      "score must be an integer between 0 and 100",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: supplierEvaluationId(input.id),
    organizationId: input.organizationId,
    supplierName: input.supplierName.trim(),
    ...(input.supplierCode !== undefined ? { supplierCode: input.supplierCode } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    status: input.status ?? "pending",
    evaluationDate: input.evaluationDate,
    ...(input.nextEvaluationDate !== undefined
      ? { nextEvaluationDate: input.nextEvaluationDate }
      : {}),
    ...(input.score !== undefined ? { score: input.score } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.evaluatorId !== undefined ? { evaluatorId: input.evaluatorId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateSupplierEvaluationInput {
  readonly supplierName?: string | undefined;
  readonly supplierCode?: string | undefined;
  readonly category?: string | undefined;
  readonly status?: SupplierEvaluationStatus | undefined;
  readonly evaluationDate?: string | undefined;
  readonly nextEvaluationDate?: string | undefined;
  readonly score?: number | undefined;
  readonly isoClause?: string | undefined;
  readonly notes?: string | undefined;
  readonly evaluatorId?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateSupplierEvaluation(
  evaluation: SupplierEvaluation,
  input: UpdateSupplierEvaluationInput,
): Result<SupplierEvaluation> {
  const issues = new ValidationBuilder()
    .require(
      input.supplierName === undefined || input.supplierName.trim().length > 0,
      "supplierName",
      "supplierName must be a non-empty string when present",
    )
    .oneOf(input.status ?? evaluation.status, SUPPLIER_EVALUATION_STATUSES, "status")
    .require(
      input.evaluationDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.evaluationDate),
      "evaluationDate",
      "evaluationDate must use YYYY-MM-DD",
    )
    .require(
      input.nextEvaluationDate === undefined ||
        /^\d{4}-\d{2}-\d{2}$/.test(input.nextEvaluationDate),
      "nextEvaluationDate",
      "nextEvaluationDate must use YYYY-MM-DD",
    )
    .require(
      input.score === undefined ||
        (Number.isInteger(input.score) && input.score >= 0 && input.score <= 100),
      "score",
      "score must be an integer between 0 and 100",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...evaluation,
    ...(input.supplierName !== undefined ? { supplierName: input.supplierName.trim() } : {}),
    ...(input.supplierCode !== undefined ? { supplierCode: input.supplierCode } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.evaluationDate !== undefined ? { evaluationDate: input.evaluationDate } : {}),
    ...(input.nextEvaluationDate !== undefined
      ? { nextEvaluationDate: input.nextEvaluationDate }
      : {}),
    ...(input.score !== undefined ? { score: input.score } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.evaluatorId !== undefined ? { evaluatorId: input.evaluatorId } : {}),
    updatedAt: input.updatedAt,
  });
}
