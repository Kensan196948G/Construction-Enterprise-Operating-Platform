/**
 * Daily report domain (ServiceHub S-02).
 *
 * Site daily reports: weather, workers, work content, safety checks, progress,
 * and issues. Lifecycle: DRAFT → SUBMITTED → APPROVED.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import type { ProjectId } from "./project.ts";
import { projectId } from "./project.ts";

export type DailyReportId = Brand<string, "DailyReportId">;
export const dailyReportId = (value: string): DailyReportId => value as DailyReportId;

export const DAILY_REPORT_WEATHERS = ["sunny", "cloudy", "rainy", "snowy"] as const;
export type DailyReportWeather = (typeof DAILY_REPORT_WEATHERS)[number];

export const DAILY_REPORT_STATUSES = ["draft", "submitted", "approved"] as const;
export type DailyReportStatus = (typeof DAILY_REPORT_STATUSES)[number];

export interface DailyReport {
  readonly id: DailyReportId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly reportDate: string;
  readonly weather?: DailyReportWeather;
  readonly temperature?: number;
  readonly workerCount: number;
  readonly workContent?: string;
  readonly safetyCheck: boolean;
  readonly safetyNotes?: string;
  readonly progressRate?: number;
  readonly issues?: string;
  readonly status: DailyReportStatus;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateDailyReportInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly reportDate: string;
  readonly weather?: DailyReportWeather | undefined;
  readonly temperature?: number | undefined;
  readonly workerCount?: number | undefined;
  readonly workContent?: string | undefined;
  readonly safetyCheck?: boolean | undefined;
  readonly safetyNotes?: string | undefined;
  readonly progressRate?: number | undefined;
  readonly issues?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function createDailyReport(input: CreateDailyReportInput): Result<DailyReport> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .require(DATE_RE.test(input.reportDate ?? ""), "reportDate", "reportDate must use YYYY-MM-DD")
    .oneOf(input.weather ?? "sunny", DAILY_REPORT_WEATHERS, "weather")
    .require(
      input.temperature === undefined ||
        (Number.isFinite(input.temperature) && input.temperature >= -50 && input.temperature <= 60),
      "temperature",
      "temperature must be between -50 and 60",
    )
    .require(
      input.workerCount === undefined ||
        (Number.isInteger(input.workerCount) && input.workerCount >= 0),
      "workerCount",
      "workerCount must be a non-negative integer",
    )
    .require(
      input.progressRate === undefined ||
        (Number.isInteger(input.progressRate) &&
          input.progressRate >= 0 &&
          input.progressRate <= 100),
      "progressRate",
      "progressRate must be an integer 0-100",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: dailyReportId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    reportDate: input.reportDate,
    ...(input.weather !== undefined ? { weather: input.weather } : {}),
    ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
    workerCount: input.workerCount ?? 0,
    ...(input.workContent !== undefined ? { workContent: input.workContent } : {}),
    safetyCheck: input.safetyCheck ?? false,
    ...(input.safetyNotes !== undefined ? { safetyNotes: input.safetyNotes } : {}),
    ...(input.progressRate !== undefined ? { progressRate: input.progressRate } : {}),
    ...(input.issues !== undefined ? { issues: input.issues } : {}),
    status: "draft",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateDailyReportInput {
  readonly weather?: DailyReportWeather | undefined;
  readonly temperature?: number | undefined;
  readonly workerCount?: number | undefined;
  readonly workContent?: string | undefined;
  readonly safetyCheck?: boolean | undefined;
  readonly safetyNotes?: string | undefined;
  readonly progressRate?: number | undefined;
  readonly issues?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateDailyReport(
  report: DailyReport,
  input: UpdateDailyReportInput,
): Result<DailyReport> {
  const issues = new ValidationBuilder()
    .oneOf(input.weather ?? report.weather ?? "sunny", DAILY_REPORT_WEATHERS, "weather")
    .require(
      input.temperature === undefined ||
        (Number.isFinite(input.temperature) && input.temperature >= -50 && input.temperature <= 60),
      "temperature",
      "temperature must be between -50 and 60",
    )
    .require(
      input.workerCount === undefined ||
        (Number.isInteger(input.workerCount) && input.workerCount >= 0),
      "workerCount",
      "workerCount must be a non-negative integer",
    )
    .require(
      input.progressRate === undefined ||
        (Number.isInteger(input.progressRate) &&
          input.progressRate >= 0 &&
          input.progressRate <= 100),
      "progressRate",
      "progressRate must be an integer 0-100",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...report,
    ...(input.weather !== undefined ? { weather: input.weather } : {}),
    ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
    ...(input.workerCount !== undefined ? { workerCount: input.workerCount } : {}),
    ...(input.workContent !== undefined ? { workContent: input.workContent } : {}),
    ...(input.safetyCheck !== undefined ? { safetyCheck: input.safetyCheck } : {}),
    ...(input.safetyNotes !== undefined ? { safetyNotes: input.safetyNotes } : {}),
    ...(input.progressRate !== undefined ? { progressRate: input.progressRate } : {}),
    ...(input.issues !== undefined ? { issues: input.issues } : {}),
    updatedAt: input.updatedAt,
  });
}

export const DAILY_REPORT_TRANSITIONS = {
  draft: ["submitted"],
  submitted: ["approved", "draft"],
  approved: [],
} as const;

/** Transition a daily report status (DRAFT→SUBMITTED→APPROVED). */
export function transitionDailyReport(
  report: DailyReport,
  status: DailyReportStatus,
  at: IsoTimestamp,
): Result<DailyReport> {
  const allowed = DAILY_REPORT_TRANSITIONS[report.status] as readonly string[];
  if (!allowed.includes(status)) {
    return err([
      {
        path: "status",
        message: `cannot transition '${report.status}' to '${status}'`,
      },
    ]);
  }
  return ok({ ...report, status, updatedAt: at });
}
