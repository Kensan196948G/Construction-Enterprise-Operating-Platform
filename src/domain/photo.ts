/**
 * Photo/document metadata domain (ServiceHub S-03).
 *
 * Object storage upload itself is out of scope; this domain registers the
 * metadata (bucket/object key) needed for search and audit.
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

export type PhotoId = Brand<string, "PhotoId">;
export const photoId = (value: string): PhotoId => value as PhotoId;

export const PHOTO_CATEGORIES = ["general", "progress", "safety", "quality", "handover"] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export interface Photo {
  readonly id: PhotoId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly fileName: string;
  readonly originalName: string;
  readonly contentType: string;
  readonly fileSize: number;
  readonly objectKey: string;
  readonly category: PhotoCategory;
  readonly caption?: string | undefined;
  readonly takenAt?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreatePhotoInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly fileName: string;
  readonly originalName: string;
  readonly contentType: string;
  readonly fileSize: number;
  readonly objectKey?: string | undefined;
  readonly category?: PhotoCategory | undefined;
  readonly caption?: string | undefined;
  readonly takenAt?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createPhoto(input: CreatePhotoInput): Result<Photo> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.fileName, "fileName")
    .nonEmpty(input.originalName, "originalName")
    .nonEmpty(input.contentType, "contentType")
    .require(
      Number.isSafeInteger(input.fileSize) && input.fileSize >= 0,
      "fileSize",
      "fileSize must be a non-negative integer",
    )
    .oneOf(input.category ?? "general", PHOTO_CATEGORIES, "category");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: photoId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    fileName: input.fileName,
    originalName: input.originalName,
    contentType: input.contentType,
    fileSize: input.fileSize,
    objectKey: input.objectKey ?? `photos/${input.id}`,
    category: input.category ?? "general",
    ...(input.caption !== undefined ? { caption: input.caption } : {}),
    ...(input.takenAt !== undefined ? { takenAt: input.takenAt } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
