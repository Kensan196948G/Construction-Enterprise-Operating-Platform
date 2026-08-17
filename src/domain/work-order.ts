/**
 * Site work order domain (Civil-Construction-Management-Platform 作業指示).
 *
 * Field-work instruction issued against a construction project: what to do,
 * by when, and its current progress state.
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

export type WorkOrderId = Brand<string, "WorkOrderId">;
export const workOrderId = (value: string): WorkOrderId => value as WorkOrderId;

export const WORK_ORDER_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export interface WorkOrder {
  readonly id: WorkOrderId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly title: string;
  readonly description?: string | undefined;
  readonly status: WorkOrderStatus;
  readonly dueDate?: string | undefined;
  readonly completedAt?: IsoTimestamp | undefined;
  readonly assigneeId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateWorkOrderInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly status?: WorkOrderStatus | undefined;
  readonly dueDate?: string | undefined;
  readonly completedAt?: IsoTimestamp | undefined;
  readonly assigneeId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createWorkOrder(input: CreateWorkOrderInput): Result<WorkOrder> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.title, "title")
    .oneOf(input.status ?? "pending", WORK_ORDER_STATUSES, "status")
    .require(
      input.dueDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate),
      "dueDate",
      "dueDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const status = input.status ?? "pending";
  return ok({
    id: workOrderId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    title: input.title.trim(),
    ...(input.description !== undefined ? { description: input.description } : {}),
    status,
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
    ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateWorkOrderInput {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly status?: WorkOrderStatus | undefined;
  readonly dueDate?: string | undefined;
  readonly completedAt?: IsoTimestamp | undefined;
  readonly assigneeId?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateWorkOrder(
  workOrder: WorkOrder,
  input: UpdateWorkOrderInput,
): Result<WorkOrder> {
  const issues = new ValidationBuilder()
    .require(
      input.title === undefined || input.title.trim().length > 0,
      "title",
      "title must be a non-empty string when present",
    )
    .oneOf(input.status ?? workOrder.status, WORK_ORDER_STATUSES, "status")
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
    ...workOrder,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
    ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    updatedAt: input.updatedAt,
  });
}
