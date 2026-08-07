/**
 * Site work schedule domain (Enterprise-OS E-02).
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

export type WorkScheduleId = Brand<string, "WorkScheduleId">;
export const workScheduleId = (value: string): WorkScheduleId => value as WorkScheduleId;

export const WORK_SCHEDULE_STATUSES = ["planned", "in_progress", "completed", "cancelled"] as const;
export type WorkScheduleStatus = (typeof WORK_SCHEDULE_STATUSES)[number];

export interface WorkSchedule {
  readonly id: WorkScheduleId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly workDate: string;
  readonly title: string;
  readonly assignee?: string | undefined;
  readonly status: WorkScheduleStatus;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateWorkScheduleInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly workDate: string;
  readonly title: string;
  readonly assignee?: string | undefined;
  readonly status?: WorkScheduleStatus | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createWorkSchedule(input: CreateWorkScheduleInput): Result<WorkSchedule> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.workDate ?? ""),
      "workDate",
      "workDate must use YYYY-MM-DD",
    )
    .nonEmpty(input.title, "title")
    .oneOf(input.status ?? "planned", WORK_SCHEDULE_STATUSES, "status");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: workScheduleId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    workDate: input.workDate,
    title: input.title.trim(),
    ...(input.assignee !== undefined ? { assignee: input.assignee } : {}),
    status: input.status ?? "planned",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
