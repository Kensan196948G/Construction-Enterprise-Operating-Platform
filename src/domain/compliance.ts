/**
 * Compliance check / legal evidence domain (ServiceHub S-07).
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { type ContractId, contractId } from "./contract.ts";
import { type ProjectId, projectId } from "./project.ts";

export type ComplianceCheckId = Brand<string, "ComplianceCheckId">;
export const complianceCheckId = (value: string): ComplianceCheckId => value as ComplianceCheckId;

export const COMPLIANCE_STANDARDS = [
  "kensetsugyo-ho",
  "shitauke-ho",
  "iso-9001",
  "iso-14001",
  "iso-45001",
  "other",
] as const;
export type ComplianceStandard = (typeof COMPLIANCE_STANDARDS)[number];
export const COMPLIANCE_RESULTS = ["pass", "fail", "pending"] as const;
export type ComplianceResult = (typeof COMPLIANCE_RESULTS)[number];

export interface ComplianceCheck {
  readonly id: ComplianceCheckId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly standard: ComplianceStandard;
  readonly item: string;
  readonly result: ComplianceResult;
  readonly checkedAt?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateComplianceCheckInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly standard?: ComplianceStandard | undefined;
  readonly item: string;
  readonly result?: ComplianceResult | undefined;
  readonly checkedAt?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createComplianceCheck(input: CreateComplianceCheckInput): Result<ComplianceCheck> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .oneOf(input.standard ?? "other", COMPLIANCE_STANDARDS, "standard")
    .nonEmpty(input.item, "item")
    .oneOf(input.result ?? "pending", COMPLIANCE_RESULTS, "result")
    .require(
      input.checkedAt === undefined || /^\d{4}-\d{2}-\d{2}$/.test(input.checkedAt),
      "checkedAt",
      "checkedAt must use YYYY-MM-DD",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: complianceCheckId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    standard: input.standard ?? "other",
    item: input.item,
    result: input.result ?? "pending",
    ...(input.checkedAt !== undefined ? { checkedAt: input.checkedAt } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export type LegalEvidenceId = Brand<string, "LegalEvidenceId">;
export const legalEvidenceId = (value: string): LegalEvidenceId => value as LegalEvidenceId;

export interface LegalEvidence {
  readonly id: LegalEvidenceId;
  readonly organizationId: string;
  readonly contractId: ContractId;
  readonly eventType: string;
  readonly description: string;
  readonly evidenceHash?: string | undefined;
  readonly occurredAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}

export interface CreateLegalEvidenceInput {
  readonly id: string;
  readonly organizationId: string;
  readonly contractId: string;
  readonly eventType: string;
  readonly description: string;
  readonly evidenceHash?: string | undefined;
  readonly occurredAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}

export function createLegalEvidence(input: CreateLegalEvidenceInput): Result<LegalEvidence> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.contractId, "contractId")
    .nonEmpty(input.eventType, "eventType")
    .nonEmpty(input.description, "description")
    .require(
      input.evidenceHash === undefined || /^[0-9a-f]{64}$/i.test(input.evidenceHash),
      "evidenceHash",
      "evidenceHash must be a 64-char hex SHA-256",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: legalEvidenceId(input.id),
    organizationId: input.organizationId,
    contractId: contractId(input.contractId),
    eventType: input.eventType,
    description: input.description,
    ...(input.evidenceHash !== undefined ? { evidenceHash: input.evidenceHash.toLowerCase() } : {}),
    occurredAt: input.occurredAt,
    createdAt: input.createdAt,
  });
}
