/**
 * Site inspection domain (Civil-Construction-Management-Platform 検査).
 *
 * Inspection records with per-item checklist results (PASS / FAIL / PENDING)
 * and an overall result derived from the items.
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

export type InspectionId = Brand<string, "InspectionId">;
export const inspectionId = (value: string): InspectionId => value as InspectionId;

export const INSPECTION_RESULTS = ["pass", "fail", "pending"] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];

export interface InspectionChecklistItem {
  readonly label: string;
  readonly passed: boolean;
}

export interface Inspection {
  readonly id: InspectionId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly title: string;
  readonly description?: string | undefined;
  readonly result: InspectionResult;
  readonly inspectedAt?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly checklistItems: readonly InspectionChecklistItem[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateInspectionInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly result?: InspectionResult | undefined;
  readonly inspectedAt?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly checklistItems?: readonly InspectionChecklistItem[] | undefined;
  readonly createdAt: IsoTimestamp;
}

function validChecklist(items: readonly InspectionChecklistItem[] | undefined): boolean {
  if (items === undefined) return true;
  return (
    Array.isArray(items) &&
    items.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.label === "string" &&
        item.label.trim().length > 0 &&
        typeof item.passed === "boolean",
    )
  );
}

/** Derive the overall result from checklist items, falling back to input. */
function deriveResult(
  inputResult: InspectionResult | undefined,
  items: readonly InspectionChecklistItem[] | undefined,
): InspectionResult {
  if (items !== undefined && items.length > 0) {
    if (items.every((i) => i.passed)) return "pass";
    if (items.some((i) => !i.passed)) return "fail";
  }
  return inputResult ?? "pending";
}

export function createInspection(input: CreateInspectionInput): Result<Inspection> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.title, "title")
    .oneOf(input.result ?? "pending", INSPECTION_RESULTS, "result")
    .require(
      input.inspectedAt === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.inspectedAt),
      "inspectedAt",
      "inspectedAt must use YYYY-MM-DD",
    )
    .require(validChecklist(input.checklistItems), "checklistItems", "checklist items are invalid");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const checklistItems = input.checklistItems ?? [];
  return ok({
    id: inspectionId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    title: input.title.trim(),
    ...(input.description !== undefined ? { description: input.description } : {}),
    result: deriveResult(input.result, checklistItems),
    ...(input.inspectedAt !== undefined ? { inspectedAt: input.inspectedAt } : {}),
    ...(input.inspectorId !== undefined ? { inspectorId: input.inspectorId } : {}),
    checklistItems,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateInspectionInput {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly result?: InspectionResult | undefined;
  readonly inspectedAt?: string | undefined;
  readonly inspectorId?: string | undefined;
  readonly checklistItems?: readonly InspectionChecklistItem[] | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateInspection(
  inspection: Inspection,
  input: UpdateInspectionInput,
): Result<Inspection> {
  const issues = new ValidationBuilder()
    .require(
      input.title === undefined || input.title.trim().length > 0,
      "title",
      "title must be a non-empty string when present",
    )
    .oneOf(input.result ?? inspection.result, INSPECTION_RESULTS, "result")
    .require(
      input.inspectedAt === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.inspectedAt),
      "inspectedAt",
      "inspectedAt must use YYYY-MM-DD",
    )
    .require(validChecklist(input.checklistItems), "checklistItems", "checklist items are invalid");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const checklistItems = input.checklistItems ?? inspection.checklistItems;
  return ok({
    ...inspection,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.inspectedAt !== undefined ? { inspectedAt: input.inspectedAt } : {}),
    ...(input.inspectorId !== undefined ? { inspectorId: input.inspectorId } : {}),
    result: deriveResult(input.result, checklistItems),
    checklistItems,
    updatedAt: input.updatedAt,
  });
}
