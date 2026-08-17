/**
 * AI build project domain (Civil-Construction-AI-Build-Platform 案件生成).
 *
 * Registry of DX projects scaffolded from the standard template engine:
 * theme, purpose, scope, target users, template version, and the lifecycle
 * of generated workspaces (generated → archived → restored / deleted).
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

export type AiBuildProjectId = Brand<string, "AiBuildProjectId">;
export const aiBuildProjectId = (value: string): AiBuildProjectId => value as AiBuildProjectId;

export const AI_BUILD_PROJECT_STATUSES = ["generated", "archived", "restored", "deleted"] as const;
export type AiBuildProjectStatus = (typeof AI_BUILD_PROJECT_STATUSES)[number];

export interface AiBuildProject {
  readonly id: AiBuildProjectId;
  readonly organizationId: string;
  readonly projectId?: ProjectId | undefined;
  readonly name: string;
  readonly theme: string;
  readonly purpose?: string | undefined;
  readonly scope?: string | undefined;
  readonly targetUsers?: string | undefined;
  readonly templateVersion: string;
  readonly status: AiBuildProjectStatus;
  readonly placeholderChecked: boolean;
  readonly generatedAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateAiBuildProjectInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string | undefined;
  readonly name: string;
  readonly theme: string;
  readonly purpose?: string | undefined;
  readonly scope?: string | undefined;
  readonly targetUsers?: string | undefined;
  readonly templateVersion?: string | undefined;
  readonly status?: AiBuildProjectStatus | undefined;
  readonly placeholderChecked?: boolean | undefined;
  readonly generatedAt?: IsoTimestamp | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createAiBuildProject(input: CreateAiBuildProjectInput): Result<AiBuildProject> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.name, "name")
    .nonEmpty(input.theme, "theme")
    .oneOf(input.status ?? "generated", AI_BUILD_PROJECT_STATUSES, "status")
    .require(
      input.templateVersion === undefined ||
        /^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(input.templateVersion),
      "templateVersion",
      "templateVersion must be 1-50 chars of [A-Za-z0-9._-]",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: aiBuildProjectId(input.id),
    organizationId: input.organizationId,
    ...(input.projectId !== undefined ? { projectId: projectId(input.projectId) } : {}),
    name: input.name.trim(),
    theme: input.theme.trim(),
    ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    ...(input.scope !== undefined ? { scope: input.scope } : {}),
    ...(input.targetUsers !== undefined ? { targetUsers: input.targetUsers } : {}),
    templateVersion: input.templateVersion ?? "1.0.0",
    status: input.status ?? "generated",
    placeholderChecked: input.placeholderChecked ?? false,
    generatedAt: input.generatedAt ?? input.createdAt,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateAiBuildProjectInput {
  readonly name?: string | undefined;
  readonly theme?: string | undefined;
  readonly purpose?: string | undefined;
  readonly scope?: string | undefined;
  readonly targetUsers?: string | undefined;
  readonly templateVersion?: string | undefined;
  readonly status?: AiBuildProjectStatus | undefined;
  readonly placeholderChecked?: boolean | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateAiBuildProject(
  project: AiBuildProject,
  input: UpdateAiBuildProjectInput,
): Result<AiBuildProject> {
  const issues = new ValidationBuilder()
    .require(
      input.name === undefined || input.name.trim().length > 0,
      "name",
      "name must be a non-empty string when present",
    )
    .require(
      input.theme === undefined || input.theme.trim().length > 0,
      "theme",
      "theme must be a non-empty string when present",
    )
    .oneOf(input.status ?? project.status, AI_BUILD_PROJECT_STATUSES, "status")
    .require(
      input.templateVersion === undefined ||
        /^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(input.templateVersion),
      "templateVersion",
      "templateVersion must be 1-50 chars of [A-Za-z0-9._-]",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...project,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.theme !== undefined ? { theme: input.theme.trim() } : {}),
    ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    ...(input.scope !== undefined ? { scope: input.scope } : {}),
    ...(input.targetUsers !== undefined ? { targetUsers: input.targetUsers } : {}),
    ...(input.templateVersion !== undefined ? { templateVersion: input.templateVersion } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.placeholderChecked !== undefined
      ? { placeholderChecked: input.placeholderChecked }
      : {}),
    updatedAt: input.updatedAt,
  });
}
