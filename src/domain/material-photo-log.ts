/**
 * Material photo log domain (Civil-Material-Photo-Logger).
 *
 * Photo-evidence of construction materials on site: captured photo linked to
 * project code, material identity, quantity, storage place, and inspection
 * state. Supports offline capture, search, and CSV export (metadata only —
 * binary photos live in object storage referenced by objectKey).
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type MaterialPhotoLogId = Brand<string, "MaterialPhotoLogId">;
export const materialPhotoLogId = (value: string): MaterialPhotoLogId =>
  value as MaterialPhotoLogId;

export const MATERIAL_TRANSACTION_TYPES = ["received", "placed", "used", "returned"] as const;
export type MaterialTransactionType = (typeof MATERIAL_TRANSACTION_TYPES)[number];

export const MATERIAL_INSPECTION_STATUSES = ["pending", "passed", "failed", "review"] as const;
export type MaterialInspectionStatus = (typeof MATERIAL_INSPECTION_STATUSES)[number];

export interface MaterialPhotoLog {
  readonly id: MaterialPhotoLogId;
  readonly organizationId: string;
  readonly projectCode: string;
  readonly materialName: string;
  readonly materialCategory?: string | undefined;
  readonly quantity?: number | undefined;
  readonly unit?: string | undefined;
  readonly storagePlace?: string | undefined;
  readonly memo?: string | undefined;
  readonly transactionType: MaterialTransactionType;
  readonly inspectionStatus: MaterialInspectionStatus;
  readonly needsReview: boolean;
  readonly capturedAt?: IsoTimestamp | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly objectKey?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateMaterialPhotoLogInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectCode: string;
  readonly materialName: string;
  readonly materialCategory?: string | undefined;
  readonly quantity?: number | undefined;
  readonly unit?: string | undefined;
  readonly storagePlace?: string | undefined;
  readonly memo?: string | undefined;
  readonly transactionType?: MaterialTransactionType | undefined;
  readonly inspectionStatus?: MaterialInspectionStatus | undefined;
  readonly needsReview?: boolean | undefined;
  readonly capturedAt?: IsoTimestamp | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly objectKey?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createMaterialPhotoLog(
  input: CreateMaterialPhotoLogInput,
): Result<MaterialPhotoLog> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectCode, "projectCode")
    .nonEmpty(input.materialName, "materialName")
    .require(
      input.quantity === undefined || (Number.isFinite(input.quantity) && input.quantity >= 0),
      "quantity",
      "quantity must be a non-negative number",
    )
    .oneOf(input.transactionType ?? "received", MATERIAL_TRANSACTION_TYPES, "transactionType")
    .oneOf(input.inspectionStatus ?? "pending", MATERIAL_INSPECTION_STATUSES, "inspectionStatus")
    .require(
      input.latitude === undefined ||
        (Number.isFinite(input.latitude) && input.latitude >= -90 && input.latitude <= 90),
      "latitude",
      "latitude must be a number between -90 and 90",
    )
    .require(
      input.longitude === undefined ||
        (Number.isFinite(input.longitude) && input.longitude >= -180 && input.longitude <= 180),
      "longitude",
      "longitude must be a number between -180 and 180",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: materialPhotoLogId(input.id),
    organizationId: input.organizationId,
    projectCode: input.projectCode.trim(),
    materialName: input.materialName.trim(),
    ...(input.materialCategory !== undefined ? { materialCategory: input.materialCategory } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.storagePlace !== undefined ? { storagePlace: input.storagePlace } : {}),
    ...(input.memo !== undefined ? { memo: input.memo } : {}),
    transactionType: input.transactionType ?? "received",
    inspectionStatus: input.inspectionStatus ?? "pending",
    needsReview: input.needsReview ?? false,
    ...(input.capturedAt !== undefined ? { capturedAt: input.capturedAt } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.objectKey !== undefined ? { objectKey: input.objectKey } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateMaterialPhotoLogInput {
  readonly materialName?: string | undefined;
  readonly materialCategory?: string | undefined;
  readonly quantity?: number | undefined;
  readonly unit?: string | undefined;
  readonly storagePlace?: string | undefined;
  readonly memo?: string | undefined;
  readonly transactionType?: MaterialTransactionType | undefined;
  readonly inspectionStatus?: MaterialInspectionStatus | undefined;
  readonly needsReview?: boolean | undefined;
  readonly capturedAt?: IsoTimestamp | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly objectKey?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateMaterialPhotoLog(
  log: MaterialPhotoLog,
  input: UpdateMaterialPhotoLogInput,
): Result<MaterialPhotoLog> {
  const issues = new ValidationBuilder()
    .require(
      input.materialName === undefined || input.materialName.trim().length > 0,
      "materialName",
      "materialName must be a non-empty string when present",
    )
    .require(
      input.quantity === undefined || (Number.isFinite(input.quantity) && input.quantity >= 0),
      "quantity",
      "quantity must be a non-negative number",
    )
    .oneOf(
      input.transactionType ?? log.transactionType,
      MATERIAL_TRANSACTION_TYPES,
      "transactionType",
    )
    .oneOf(
      input.inspectionStatus ?? log.inspectionStatus,
      MATERIAL_INSPECTION_STATUSES,
      "inspectionStatus",
    )
    .require(
      input.latitude === undefined ||
        (Number.isFinite(input.latitude) && input.latitude >= -90 && input.latitude <= 90),
      "latitude",
      "latitude must be a number between -90 and 90",
    )
    .require(
      input.longitude === undefined ||
        (Number.isFinite(input.longitude) && input.longitude >= -180 && input.longitude <= 180),
      "longitude",
      "longitude must be a number between -180 and 180",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...log,
    ...(input.materialName !== undefined ? { materialName: input.materialName.trim() } : {}),
    ...(input.materialCategory !== undefined ? { materialCategory: input.materialCategory } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.storagePlace !== undefined ? { storagePlace: input.storagePlace } : {}),
    ...(input.memo !== undefined ? { memo: input.memo } : {}),
    ...(input.transactionType !== undefined ? { transactionType: input.transactionType } : {}),
    ...(input.inspectionStatus !== undefined ? { inspectionStatus: input.inspectionStatus } : {}),
    ...(input.needsReview !== undefined ? { needsReview: input.needsReview } : {}),
    ...(input.capturedAt !== undefined ? { capturedAt: input.capturedAt } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.objectKey !== undefined ? { objectKey: input.objectKey } : {}),
    updatedAt: input.updatedAt,
  });
}

/** CSV columns in the fixed export order used by the photo-logger export. */
export const MATERIAL_PHOTO_LOG_CSV_COLUMNS = [
  "id",
  "projectCode",
  "materialName",
  "materialCategory",
  "quantity",
  "unit",
  "storagePlace",
  "transactionType",
  "inspectionStatus",
  "needsReview",
  "capturedAt",
  "latitude",
  "longitude",
  "memo",
] as const;

/** Serialize a log to a single CSV row (RFC-4180 style quoting). */
export function materialPhotoLogToCsvRow(log: MaterialPhotoLog): string {
  const cell = (value: string | number | boolean | undefined): string => {
    const raw = String(value ?? "");
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return MATERIAL_PHOTO_LOG_CSV_COLUMNS.map((key) => cell(log[key])).join(",");
}
