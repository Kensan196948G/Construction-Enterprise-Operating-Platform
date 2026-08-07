/**
 * Cost record / work hour domain (ServiceHub S-05).
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

export type CostRecordId = Brand<string, "CostRecordId">;
export const costRecordId = (value: string): CostRecordId => value as CostRecordId;

export interface CostRecord {
  readonly id: CostRecordId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly recordDate: string;
  readonly category: string;
  readonly description: string;
  readonly budgetedAmount: number;
  readonly actualAmount: number;
  readonly vendorName?: string | undefined;
  readonly invoiceNumber?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateCostRecordInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly recordDate: string;
  readonly category: string;
  readonly description: string;
  readonly budgetedAmount?: number | undefined;
  readonly actualAmount?: number | undefined;
  readonly vendorName?: string | undefined;
  readonly invoiceNumber?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createCostRecord(input: CreateCostRecordInput): Result<CostRecord> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.recordDate ?? ""),
      "recordDate",
      "recordDate must use YYYY-MM-DD",
    )
    .nonEmpty(input.category, "category")
    .nonEmpty(input.description, "description")
    .require(
      input.budgetedAmount === undefined ||
        (Number.isFinite(input.budgetedAmount) && input.budgetedAmount >= 0),
      "budgetedAmount",
      "budgetedAmount must be a non-negative number",
    )
    .require(
      input.actualAmount === undefined ||
        (Number.isFinite(input.actualAmount) && input.actualAmount >= 0),
      "actualAmount",
      "actualAmount must be a non-negative number",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: costRecordId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    recordDate: input.recordDate,
    category: input.category,
    description: input.description,
    budgetedAmount: input.budgetedAmount ?? 0,
    actualAmount: input.actualAmount ?? 0,
    ...(input.vendorName !== undefined ? { vendorName: input.vendorName } : {}),
    ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export type WorkHourId = Brand<string, "WorkHourId">;
export const workHourId = (value: string): WorkHourId => value as WorkHourId;

export interface WorkHour {
  readonly id: WorkHourId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly workerId?: string | undefined;
  readonly workDate: string;
  readonly hours: number;
  readonly workType?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateWorkHourInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly workerId?: string | undefined;
  readonly workDate: string;
  readonly hours: number;
  readonly workType?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createWorkHour(input: CreateWorkHourInput): Result<WorkHour> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.workDate ?? ""),
      "workDate",
      "workDate must use YYYY-MM-DD",
    )
    .require(
      Number.isFinite(input.hours) && input.hours >= 0 && input.hours <= 24,
      "hours",
      "hours must be a number between 0 and 24",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: workHourId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    ...(input.workerId !== undefined ? { workerId: input.workerId } : {}),
    workDate: input.workDate,
    hours: input.hours,
    ...(input.workType !== undefined ? { workType: input.workType } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
