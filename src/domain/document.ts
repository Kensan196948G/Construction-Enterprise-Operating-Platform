/**
 * Drawing/document domain (Enterprise-OS E-03).
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

export type DocumentId = Brand<string, "DocumentId">;
export const documentId = (value: string): DocumentId => value as DocumentId;

export const DOCUMENT_TYPES = ["drawing", "contract", "safety", "quality", "other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DOCUMENT_STATUSES = ["draft", "review", "approved", "issued", "archived"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface Document {
  readonly id: DocumentId;
  readonly organizationId: string;
  readonly projectId?: ProjectId | undefined;
  readonly title: string;
  readonly documentType: DocumentType;
  readonly revision: number;
  readonly status: DocumentStatus;
  readonly fileUrl?: string | undefined;
  readonly fileSize?: number | undefined;
  readonly tags: readonly string[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateDocumentInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string | undefined;
  readonly title: string;
  readonly documentType?: DocumentType | undefined;
  readonly revision?: number | undefined;
  readonly status?: DocumentStatus | undefined;
  readonly fileUrl?: string | undefined;
  readonly fileSize?: number | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createDocument(input: CreateDocumentInput): Result<Document> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.title, "title")
    .oneOf(input.documentType ?? "other", DOCUMENT_TYPES, "documentType")
    .require(
      input.revision === undefined || (Number.isInteger(input.revision) && input.revision >= 0),
      "revision",
      "revision must be a non-negative integer",
    )
    .oneOf(input.status ?? "draft", DOCUMENT_STATUSES, "status")
    .require(
      input.fileSize === undefined || (Number.isSafeInteger(input.fileSize) && input.fileSize >= 0),
      "fileSize",
      "fileSize must be a non-negative integer",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: documentId(input.id),
    organizationId: input.organizationId,
    ...(input.projectId !== undefined ? { projectId: projectId(input.projectId) } : {}),
    title: input.title.trim(),
    documentType: input.documentType ?? "other",
    revision: input.revision ?? 0,
    status: input.status ?? "draft",
    ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
    ...(input.fileSize !== undefined ? { fileSize: input.fileSize } : {}),
    tags: input.tags !== undefined ? [...input.tags] : [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
