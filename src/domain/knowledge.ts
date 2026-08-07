/**
 * Knowledge article domain (ServiceHub S-06).
 *
 * AI-generated articles are governed through an AI action request
 * (`aiActionId`) so the AI Gateway approval trail stays complete.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type KnowledgeId = Brand<string, "KnowledgeId">;
export const knowledgeId = (value: string): KnowledgeId => value as KnowledgeId;

export const KNOWLEDGE_CATEGORIES = ["general", "faq", "incident", "contract", "safety"] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface KnowledgeArticle {
  readonly id: KnowledgeId;
  readonly organizationId: string;
  readonly title: string;
  readonly content: string;
  readonly category: KnowledgeCategory;
  readonly tags: readonly string[];
  readonly isPublished: boolean;
  readonly viewCount: number;
  readonly rating?: number | undefined;
  readonly aiGenerated: boolean;
  readonly aiActionId?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateKnowledgeInput {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly content: string;
  readonly category?: KnowledgeCategory | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly isPublished?: boolean | undefined;
  readonly rating?: number | undefined;
  readonly aiGenerated?: boolean | undefined;
  readonly aiActionId?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createKnowledgeArticle(input: CreateKnowledgeInput): Result<KnowledgeArticle> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.title, "title")
    .nonEmpty(input.content, "content")
    .oneOf(input.category ?? "general", KNOWLEDGE_CATEGORIES, "category")
    .require(
      input.rating === undefined ||
        (Number.isFinite(input.rating) && input.rating >= 0 && input.rating <= 5),
      "rating",
      "rating must be between 0 and 5",
    )
    .require(
      input.aiGenerated !== true || (input.aiActionId !== undefined && input.aiActionId.length > 0),
      "aiActionId",
      "aiActionId is required when aiGenerated is true",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: knowledgeId(input.id),
    organizationId: input.organizationId,
    title: input.title.trim(),
    content: input.content,
    category: input.category ?? "general",
    tags: input.tags !== undefined ? [...input.tags] : [],
    isPublished: input.isPublished ?? false,
    viewCount: 0,
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    aiGenerated: input.aiGenerated ?? false,
    ...(input.aiActionId !== undefined ? { aiActionId: input.aiActionId } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
