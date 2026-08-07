/**
 * Safety check / quality inspection domain (ServiceHub S-04).
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { type ProjectId, projectId } from "./project.ts";

export type SafetyCheckId = Brand<string, "SafetyCheckId">;
export const safetyCheckId = (value: string): SafetyCheckId => value as SafetyCheckId;

export const SAFETY_CHECK_TYPES = ["daily", "patrol", "ky", "other"] as const;
export type SafetyCheckType = (typeof SAFETY_CHECK_TYPES)[number];
export const SAFETY_RESULTS = ["pending", "ok", "ng"] as const;
export type SafetyResult = (typeof SAFETY_RESULTS)[number];

export interface SafetyCheck {
  readonly id: SafetyCheckId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly checkDate: string;
  readonly checkType: SafetyCheckType;
  readonly itemsTotal: number;
  readonly itemsOk: number;
  readonly itemsNg: number;
  readonly overallResult: SafetyResult;
  readonly notes?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateSafetyCheckInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly checkDate: string;
  readonly checkType?: SafetyCheckType | undefined;
  readonly itemsTotal?: number | undefined;
  readonly itemsOk?: number | undefined;
  readonly itemsNg?: number | undefined;
  readonly overallResult?: SafetyResult | undefined;
  readonly notes?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createSafetyCheck(input: CreateSafetyCheckInput): Result<SafetyCheck> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.checkDate ?? ""),
      "checkDate",
      "checkDate must use YYYY-MM-DD",
    )
    .oneOf(input.checkType ?? "daily", SAFETY_CHECK_TYPES, "checkType")
    .require(
      input.itemsTotal === undefined ||
        (Number.isInteger(input.itemsTotal) && input.itemsTotal >= 0),
      "itemsTotal",
      "itemsTotal must be a non-negative integer",
    )
    .require(
      input.itemsOk === undefined || (Number.isInteger(input.itemsOk) && input.itemsOk >= 0),
      "itemsOk",
      "itemsOk must be a non-negative integer",
    )
    .require(
      input.itemsNg === undefined || (Number.isInteger(input.itemsNg) && input.itemsNg >= 0),
      "itemsNg",
      "itemsNg must be a non-negative integer",
    )
    .require(
      (input.itemsOk ?? 0) + (input.itemsNg ?? 0) <= (input.itemsTotal ?? 0),
      "itemsNg",
      "itemsOk + itemsNg must not exceed itemsTotal",
    )
    .oneOf(input.overallResult ?? "pending", SAFETY_RESULTS, "overallResult");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: safetyCheckId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    checkDate: input.checkDate,
    checkType: input.checkType ?? "daily",
    itemsTotal: input.itemsTotal ?? 0,
    itemsOk: input.itemsOk ?? 0,
    itemsNg: input.itemsNg ?? 0,
    overallResult: input.overallResult ?? "pending",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.inspectorId !== undefined ? { inspectorId: input.inspectorId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export type QualityInspectionId = Brand<string, "QualityInspectionId">;
export const qualityInspectionId = (value: string): QualityInspectionId =>
  value as QualityInspectionId;
export const QUALITY_RESULTS = ["pending", "pass", "fail"] as const;
export type QualityResult = (typeof QUALITY_RESULTS)[number];

export interface QualityInspection {
  readonly id: QualityInspectionId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly inspectionDate: string;
  readonly inspectionType: string;
  readonly targetItem: string;
  readonly standardValue?: string | undefined;
  readonly measuredValue?: string | undefined;
  readonly result: QualityResult;
  readonly notes?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateQualityInspectionInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly inspectionDate: string;
  readonly inspectionType: string;
  readonly targetItem: string;
  readonly standardValue?: string | undefined;
  readonly measuredValue?: string | undefined;
  readonly result?: QualityResult | undefined;
  readonly notes?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createQualityInspection(
  input: CreateQualityInspectionInput,
): Result<QualityInspection> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.inspectionDate ?? ""),
      "inspectionDate",
      "inspectionDate must use YYYY-MM-DD",
    )
    .nonEmpty(input.inspectionType, "inspectionType")
    .nonEmpty(input.targetItem, "targetItem")
    .oneOf(input.result ?? "pending", QUALITY_RESULTS, "result");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: qualityInspectionId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    inspectionDate: input.inspectionDate,
    inspectionType: input.inspectionType,
    targetItem: input.targetItem,
    ...(input.standardValue !== undefined ? { standardValue: input.standardValue } : {}),
    ...(input.measuredValue !== undefined ? { measuredValue: input.measuredValue } : {}),
    result: input.result ?? "pending",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.inspectorId !== undefined ? { inspectorId: input.inspectorId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
