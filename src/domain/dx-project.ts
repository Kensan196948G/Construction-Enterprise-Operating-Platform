/**
 * DX project portfolio domain (DX-Project-Portfolio-Atlas).
 *
 * Portfolio ledger for DX / IT projects: lifecycle state, portfolio type,
 * company-asset usage, importance, owner team, and approved progress —
 * analysed from executive / IT-DX / development / operations viewpoints.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type DxProjectId = Brand<string, "DxProjectId">;
export const dxProjectId = (value: string): DxProjectId => value as DxProjectId;

export const DX_PORTFOLIO_TYPES = ["internal", "external", "common", "unclassified"] as const;
export type DxPortfolioType = (typeof DX_PORTFOLIO_TYPES)[number];

export const DX_LIFECYCLE_STATES = [
  "planning",
  "requirements",
  "development",
  "verification",
  "production_ready",
  "production",
  "paused",
  "merging",
  "retired",
  "deleted",
] as const;
export type DxLifecycleState = (typeof DX_LIFECYCLE_STATES)[number];

export interface DxProject {
  readonly id: DxProjectId;
  readonly organizationId: string;
  readonly slug: string;
  readonly nameJa: string;
  readonly nameEn?: string | undefined;
  readonly shortName?: string | undefined;
  readonly summary?: string | undefined;
  readonly portfolioType: DxPortfolioType;
  readonly companyAssetUse: "yes" | "no" | "review";
  readonly domainCode?: string | undefined;
  readonly lifecycleState: DxLifecycleState;
  readonly importance: number;
  readonly ownerTeam?: string | undefined;
  readonly approvedProgress?: number | undefined;
  readonly progressMilestone?: string | undefined;
  readonly progressEvidenceUrl?: string | undefined;
  readonly nextReviewAt?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateDxProjectInput {
  readonly id: string;
  readonly organizationId: string;
  readonly slug: string;
  readonly nameJa: string;
  readonly nameEn?: string | undefined;
  readonly shortName?: string | undefined;
  readonly summary?: string | undefined;
  readonly portfolioType?: DxPortfolioType | undefined;
  readonly companyAssetUse?: "yes" | "no" | "review" | undefined;
  readonly domainCode?: string | undefined;
  readonly lifecycleState?: DxLifecycleState | undefined;
  readonly importance?: number | undefined;
  readonly ownerTeam?: string | undefined;
  readonly approvedProgress?: number | undefined;
  readonly progressMilestone?: string | undefined;
  readonly progressEvidenceUrl?: string | undefined;
  readonly nextReviewAt?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

export function createDxProject(input: CreateDxProjectInput): Result<DxProject> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .require(SLUG_RE.test(input.slug ?? ""), "slug", "slug must be 1-100 chars of [a-z0-9-]")
    .nonEmpty(input.nameJa, "nameJa")
    .oneOf(input.portfolioType ?? "unclassified", DX_PORTFOLIO_TYPES, "portfolioType")
    .oneOf(input.companyAssetUse ?? "review", ["yes", "no", "review"] as const, "companyAssetUse")
    .oneOf(input.lifecycleState ?? "planning", DX_LIFECYCLE_STATES, "lifecycleState")
    .require(
      input.importance === undefined ||
        (Number.isInteger(input.importance) && input.importance >= 1 && input.importance <= 5),
      "importance",
      "importance must be an integer 1-5",
    )
    .require(
      input.approvedProgress === undefined ||
        (Number.isFinite(input.approvedProgress) &&
          input.approvedProgress >= 0 &&
          input.approvedProgress <= 100),
      "approvedProgress",
      "approvedProgress must be a number 0-100",
    )
    .require(
      input.nextReviewAt === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.nextReviewAt),
      "nextReviewAt",
      "nextReviewAt must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: dxProjectId(input.id),
    organizationId: input.organizationId,
    slug: input.slug,
    nameJa: input.nameJa.trim(),
    ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
    ...(input.shortName !== undefined ? { shortName: input.shortName } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    portfolioType: input.portfolioType ?? "unclassified",
    companyAssetUse: input.companyAssetUse ?? "review",
    ...(input.domainCode !== undefined ? { domainCode: input.domainCode } : {}),
    lifecycleState: input.lifecycleState ?? "planning",
    importance: input.importance ?? 3,
    ...(input.ownerTeam !== undefined ? { ownerTeam: input.ownerTeam } : {}),
    ...(input.approvedProgress !== undefined ? { approvedProgress: input.approvedProgress } : {}),
    ...(input.progressMilestone !== undefined
      ? { progressMilestone: input.progressMilestone }
      : {}),
    ...(input.progressEvidenceUrl !== undefined
      ? { progressEvidenceUrl: input.progressEvidenceUrl }
      : {}),
    ...(input.nextReviewAt !== undefined ? { nextReviewAt: input.nextReviewAt } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateDxProjectInput {
  readonly nameJa?: string | undefined;
  readonly nameEn?: string | undefined;
  readonly shortName?: string | undefined;
  readonly summary?: string | undefined;
  readonly portfolioType?: DxPortfolioType | undefined;
  readonly companyAssetUse?: "yes" | "no" | "review" | undefined;
  readonly domainCode?: string | undefined;
  readonly lifecycleState?: DxLifecycleState | undefined;
  readonly importance?: number | undefined;
  readonly ownerTeam?: string | undefined;
  readonly approvedProgress?: number | undefined;
  readonly progressMilestone?: string | undefined;
  readonly progressEvidenceUrl?: string | undefined;
  readonly nextReviewAt?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateDxProject(
  project: DxProject,
  input: UpdateDxProjectInput,
): Result<DxProject> {
  const issues = new ValidationBuilder()
    .require(
      input.nameJa === undefined || input.nameJa.trim().length > 0,
      "nameJa",
      "nameJa must be a non-empty string when present",
    )
    .oneOf(input.portfolioType ?? project.portfolioType, DX_PORTFOLIO_TYPES, "portfolioType")
    .oneOf(
      input.companyAssetUse ?? project.companyAssetUse,
      ["yes", "no", "review"] as const,
      "companyAssetUse",
    )
    .oneOf(input.lifecycleState ?? project.lifecycleState, DX_LIFECYCLE_STATES, "lifecycleState")
    .require(
      input.importance === undefined ||
        (Number.isInteger(input.importance) && input.importance >= 1 && input.importance <= 5),
      "importance",
      "importance must be an integer 1-5",
    )
    .require(
      input.approvedProgress === undefined ||
        (Number.isFinite(input.approvedProgress) &&
          input.approvedProgress >= 0 &&
          input.approvedProgress <= 100),
      "approvedProgress",
      "approvedProgress must be a number 0-100",
    )
    .require(
      input.nextReviewAt === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.nextReviewAt),
      "nextReviewAt",
      "nextReviewAt must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...project,
    ...(input.nameJa !== undefined ? { nameJa: input.nameJa.trim() } : {}),
    ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
    ...(input.shortName !== undefined ? { shortName: input.shortName } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.portfolioType !== undefined ? { portfolioType: input.portfolioType } : {}),
    ...(input.companyAssetUse !== undefined ? { companyAssetUse: input.companyAssetUse } : {}),
    ...(input.domainCode !== undefined ? { domainCode: input.domainCode } : {}),
    ...(input.lifecycleState !== undefined ? { lifecycleState: input.lifecycleState } : {}),
    ...(input.importance !== undefined ? { importance: input.importance } : {}),
    ...(input.ownerTeam !== undefined ? { ownerTeam: input.ownerTeam } : {}),
    ...(input.approvedProgress !== undefined ? { approvedProgress: input.approvedProgress } : {}),
    ...(input.progressMilestone !== undefined
      ? { progressMilestone: input.progressMilestone }
      : {}),
    ...(input.progressEvidenceUrl !== undefined
      ? { progressEvidenceUrl: input.progressEvidenceUrl }
      : {}),
    ...(input.nextReviewAt !== undefined ? { nextReviewAt: input.nextReviewAt } : {}),
    updatedAt: input.updatedAt,
  });
}
