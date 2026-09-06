/**
 * Labor attendance domain (HR — issue #74).
 *
 * Tracks day-by-day attendance for both in-house employees and subcontractor
 * ("協力会社") workers assigned to a project: daily rate, overtime hours, and
 * an approval-style lifecycle (draft → submitted → approved/rejected). This is
 * the primary source of labor cost, which is the largest component of total
 * project cost — see `cost.ts` for the additive conversion into a
 * {@link CostRecord}.
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

export type LaborAttendanceId = Brand<string, "LaborAttendanceId">;
export const laborAttendanceId = (value: string): LaborAttendanceId => value as LaborAttendanceId;

/** Whether the worker is a direct employee (自社) or a subcontractor (協力会社). */
export const WORKER_AFFILIATIONS = ["in_house", "subcontractor"] as const;
export type WorkerAffiliation = (typeof WORKER_AFFILIATIONS)[number];

/** Attendance approval lifecycle: DRAFT → SUBMITTED → APPROVED / REJECTED. */
export const ATTENDANCE_STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface LaborAttendance {
  readonly id: LaborAttendanceId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly workerName: string;
  readonly affiliation: WorkerAffiliation;
  /** Required when `affiliation` is `subcontractor`; the partner company name. */
  readonly subcontractorName?: string | undefined;
  readonly attendanceDate: string;
  /** Base day-rate pay (日当額) in the platform's base currency unit. */
  readonly dailyRate: number;
  /** Overtime worked beyond the standard day, in hours. */
  readonly overtimeHours: number;
  readonly status: AttendanceStatus;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateLaborAttendanceInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly workerName: string;
  readonly affiliation?: WorkerAffiliation | undefined;
  readonly subcontractorName?: string | undefined;
  readonly attendanceDate: string;
  readonly dailyRate: number;
  readonly overtimeHours?: number | undefined;
  readonly status?: AttendanceStatus | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

function validateShared(
  builder: ValidationBuilder,
  input: {
    readonly affiliation: WorkerAffiliation;
    readonly subcontractorName?: string | undefined;
    readonly dailyRate?: number | undefined;
    readonly overtimeHours?: number | undefined;
  },
): ValidationBuilder {
  return builder
    .oneOf(input.affiliation, WORKER_AFFILIATIONS, "affiliation")
    .require(
      input.affiliation !== "subcontractor" ||
        (input.subcontractorName !== undefined && input.subcontractorName.trim().length > 0),
      "subcontractorName",
      "subcontractorName is required when affiliation is 'subcontractor'",
    )
    .require(
      input.dailyRate === undefined || (Number.isFinite(input.dailyRate) && input.dailyRate >= 0),
      "dailyRate",
      "dailyRate must be a non-negative number",
    )
    .require(
      input.overtimeHours === undefined ||
        (Number.isFinite(input.overtimeHours) &&
          input.overtimeHours >= 0 &&
          input.overtimeHours <= 24),
      "overtimeHours",
      "overtimeHours must be a number between 0 and 24",
    );
}

export function createLaborAttendance(input: CreateLaborAttendanceInput): Result<LaborAttendance> {
  const affiliation = input.affiliation ?? "in_house";
  const issues = validateShared(
    new ValidationBuilder()
      .nonEmpty(input.id, "id")
      .nonEmpty(input.organizationId, "organizationId")
      .nonEmpty(input.projectId, "projectId")
      .nonEmpty(input.workerName, "workerName")
      .require(
        DATE_RE.test(input.attendanceDate ?? ""),
        "attendanceDate",
        "attendanceDate must use YYYY-MM-DD",
      ),
    {
      affiliation,
      subcontractorName: input.subcontractorName,
      dailyRate: input.dailyRate,
      overtimeHours: input.overtimeHours,
    },
  )
    .oneOf(input.status ?? "draft", ATTENDANCE_STATUSES, "status")
    .build();
  if (issues.length > 0) {
    return err(issues);
  }
  return ok({
    id: laborAttendanceId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    workerName: input.workerName.trim(),
    affiliation,
    ...(input.subcontractorName !== undefined
      ? { subcontractorName: input.subcontractorName }
      : {}),
    attendanceDate: input.attendanceDate,
    dailyRate: input.dailyRate,
    overtimeHours: input.overtimeHours ?? 0,
    status: input.status ?? "draft",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateLaborAttendanceInput {
  readonly workerName?: string | undefined;
  readonly affiliation?: WorkerAffiliation | undefined;
  readonly subcontractorName?: string | undefined;
  readonly dailyRate?: number | undefined;
  readonly overtimeHours?: number | undefined;
  readonly notes?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

/** Update mutable fields of an existing labor attendance record (not status — see {@link transitionLaborAttendance}). */
export function updateLaborAttendance(
  record: LaborAttendance,
  input: UpdateLaborAttendanceInput,
): Result<LaborAttendance> {
  const affiliation = input.affiliation ?? record.affiliation;
  const subcontractorName = input.subcontractorName ?? record.subcontractorName;
  const issues = validateShared(
    new ValidationBuilder().require(
      input.workerName === undefined || input.workerName.trim().length > 0,
      "workerName",
      "workerName must be a non-empty string when present",
    ),
    {
      affiliation,
      subcontractorName,
      dailyRate: input.dailyRate,
      overtimeHours: input.overtimeHours,
    },
  ).build();
  if (issues.length > 0) {
    return err(issues);
  }
  return ok({
    ...record,
    ...(input.workerName !== undefined ? { workerName: input.workerName.trim() } : {}),
    affiliation,
    ...(subcontractorName !== undefined ? { subcontractorName } : {}),
    ...(input.dailyRate !== undefined ? { dailyRate: input.dailyRate } : {}),
    ...(input.overtimeHours !== undefined ? { overtimeHours: input.overtimeHours } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    updatedAt: input.updatedAt,
  });
}

/** Allowed status transitions: DRAFT → SUBMITTED → APPROVED/REJECTED, REJECTED → DRAFT (resubmit). */
export const ATTENDANCE_TRANSITIONS: Readonly<
  Record<AttendanceStatus, readonly AttendanceStatus[]>
> = {
  draft: ["submitted"],
  submitted: ["approved", "rejected", "draft"],
  approved: [],
  rejected: ["draft"],
};

export function transitionLaborAttendance(
  record: LaborAttendance,
  status: AttendanceStatus,
  at: IsoTimestamp,
): Result<LaborAttendance> {
  const allowed = ATTENDANCE_TRANSITIONS[record.status];
  if (!allowed.includes(status)) {
    return err([
      {
        path: "status",
        message: `cannot transition '${record.status}' to '${status}'`,
      },
    ]);
  }
  return ok({ ...record, status, updatedAt: at });
}
