/**
 * Construction project domain (ServiceHub S-01).
 *
 * Core business entity for construction project management: code, name,
 * client, site, schedule, budget, manager, and lifecycle status.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type ProjectId = Brand<string, "ProjectId">;
export const projectId = (value: string): ProjectId => value as ProjectId;

export const PROJECT_STATUSES = [
  "planning",
  "in_progress",
  "completed",
  "suspended",
  "cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  readonly id: ProjectId;
  readonly organizationId: string;
  readonly projectCode: string;
  readonly name: string;
  readonly description?: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly status: ProjectStatus;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly budget?: number;
  readonly managerId?: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateProjectInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectCode: string;
  readonly name: string;
  readonly description?: string | undefined;
  readonly clientName?: string | undefined;
  readonly siteAddress?: string | undefined;
  readonly status?: ProjectStatus | undefined;
  readonly startDate?: string | undefined;
  readonly endDate?: string | undefined;
  readonly budget?: number | undefined;
  readonly managerId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/;

function isDate(value: string | undefined, issues: ValidationBuilder, path: string): void {
  if (value === undefined) return;
  if (!DATE_RE.test(value)) {
    issues.require(false, path, `${path} must use YYYY-MM-DD`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  issues.require(
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value,
    path,
    `${path} must be a valid calendar date`,
  );
}

export function createProject(input: CreateProjectInput): Result<Project> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .require(
      CODE_RE.test(input.projectCode ?? ""),
      "projectCode",
      "projectCode must be 1-50 chars of [A-Za-z0-9_-]",
    )
    .nonEmpty(input.name, "name")
    .oneOf(input.status ?? "planning", PROJECT_STATUSES, "status")
    .require(
      input.budget === undefined || (Number.isFinite(input.budget) && input.budget >= 0),
      "budget",
      "budget must be a non-negative number",
    );
  isDate(input.startDate, issues, "startDate");
  isDate(input.endDate, issues, "endDate");
  if (
    input.startDate !== undefined &&
    input.endDate !== undefined &&
    input.startDate > input.endDate
  ) {
    issues.require(false, "endDate", "endDate must not be before startDate");
  }
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const status = input.status ?? "planning";
  return ok({
    id: projectId(input.id),
    organizationId: input.organizationId,
    projectCode: input.projectCode,
    name: input.name.trim(),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.clientName !== undefined ? { clientName: input.clientName } : {}),
    ...(input.siteAddress !== undefined ? { siteAddress: input.siteAddress } : {}),
    status,
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    ...(input.budget !== undefined ? { budget: input.budget } : {}),
    ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateProjectInput {
  readonly name?: string | undefined;
  readonly description?: string | undefined;
  readonly clientName?: string | undefined;
  readonly siteAddress?: string | undefined;
  readonly status?: ProjectStatus | undefined;
  readonly startDate?: string | undefined;
  readonly endDate?: string | undefined;
  readonly budget?: number | undefined;
  readonly managerId?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

/** Merge a validated update into an existing project. */
export function updateProject(project: Project, input: UpdateProjectInput): Result<Project> {
  const issues = new ValidationBuilder()
    .require(
      input.name === undefined || input.name.trim().length > 0,
      "name",
      "name must be a non-empty string when present",
    )
    .oneOf(input.status ?? project.status, PROJECT_STATUSES, "status")
    .require(
      input.budget === undefined || (Number.isFinite(input.budget) && input.budget >= 0),
      "budget",
      "budget must be a non-negative number",
    );
  isDate(input.startDate, issues, "startDate");
  isDate(input.endDate, issues, "endDate");
  const start = input.startDate ?? project.startDate;
  const end = input.endDate ?? project.endDate;
  if (start !== undefined && end !== undefined && start > end) {
    issues.require(false, "endDate", "endDate must not be before startDate");
  }
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...project,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.clientName !== undefined ? { clientName: input.clientName } : {}),
    ...(input.siteAddress !== undefined ? { siteAddress: input.siteAddress } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    ...(input.budget !== undefined ? { budget: input.budget } : {}),
    ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
    updatedAt: input.updatedAt,
  });
}
