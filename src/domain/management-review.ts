/**
 * Management review domain (Civil-Construction-Management-Platform マネジメントレビュー).
 *
 * ISO 9001 management reviews: scheduled top-management review meetings with
 * agenda, outcomes, and next-review scheduling.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type ManagementReviewId = Brand<string, "ManagementReviewId">;
export const managementReviewId = (value: string): ManagementReviewId =>
  value as ManagementReviewId;

export const MANAGEMENT_REVIEW_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type ManagementReviewStatus = (typeof MANAGEMENT_REVIEW_STATUSES)[number];

export interface ManagementReview {
  readonly id: ManagementReviewId;
  readonly organizationId: string;
  readonly title: string;
  readonly status: ManagementReviewStatus;
  readonly reviewDate: string;
  readonly nextReviewDate?: string | undefined;
  readonly agenda?: string | undefined;
  readonly outcomes?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly facilitatorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateManagementReviewInput {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly status?: ManagementReviewStatus | undefined;
  readonly reviewDate: string;
  readonly nextReviewDate?: string | undefined;
  readonly agenda?: string | undefined;
  readonly outcomes?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly facilitatorId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createManagementReview(
  input: CreateManagementReviewInput,
): Result<ManagementReview> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.title, "title")
    .oneOf(input.status ?? "scheduled", MANAGEMENT_REVIEW_STATUSES, "status")
    .require(
      /^\d{4}-\d{2}-\d{2}$/.test(input.reviewDate ?? ""),
      "reviewDate",
      "reviewDate must use YYYY-MM-DD",
    )
    .require(
      input.nextReviewDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.nextReviewDate),
      "nextReviewDate",
      "nextReviewDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: managementReviewId(input.id),
    organizationId: input.organizationId,
    title: input.title.trim(),
    status: input.status ?? "scheduled",
    reviewDate: input.reviewDate,
    ...(input.nextReviewDate !== undefined ? { nextReviewDate: input.nextReviewDate } : {}),
    ...(input.agenda !== undefined ? { agenda: input.agenda } : {}),
    ...(input.outcomes !== undefined ? { outcomes: input.outcomes } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    ...(input.facilitatorId !== undefined ? { facilitatorId: input.facilitatorId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateManagementReviewInput {
  readonly title?: string | undefined;
  readonly status?: ManagementReviewStatus | undefined;
  readonly reviewDate?: string | undefined;
  readonly nextReviewDate?: string | undefined;
  readonly agenda?: string | undefined;
  readonly outcomes?: string | undefined;
  readonly isoClause?: string | undefined;
  readonly facilitatorId?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateManagementReview(
  review: ManagementReview,
  input: UpdateManagementReviewInput,
): Result<ManagementReview> {
  const issues = new ValidationBuilder()
    .require(
      input.title === undefined || input.title.trim().length > 0,
      "title",
      "title must be a non-empty string when present",
    )
    .oneOf(input.status ?? review.status, MANAGEMENT_REVIEW_STATUSES, "status")
    .require(
      input.reviewDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.reviewDate),
      "reviewDate",
      "reviewDate must use YYYY-MM-DD",
    )
    .require(
      input.nextReviewDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.nextReviewDate),
      "nextReviewDate",
      "nextReviewDate must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...review,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.reviewDate !== undefined ? { reviewDate: input.reviewDate } : {}),
    ...(input.nextReviewDate !== undefined ? { nextReviewDate: input.nextReviewDate } : {}),
    ...(input.agenda !== undefined ? { agenda: input.agenda } : {}),
    ...(input.outcomes !== undefined ? { outcomes: input.outcomes } : {}),
    ...(input.isoClause !== undefined ? { isoClause: input.isoClause } : {}),
    ...(input.facilitatorId !== undefined ? { facilitatorId: input.facilitatorId } : {}),
    updatedAt: input.updatedAt,
  });
}
