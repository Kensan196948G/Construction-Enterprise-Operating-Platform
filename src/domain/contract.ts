/**
 * Legal contract domain (ServiceHub S-07).
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

export type ContractId = Brand<string, "ContractId">;
export const contractId = (value: string): ContractId => value as ContractId;

export const CONTRACT_TYPES = ["prime", "subcontract", "other"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];
export const CONTRACT_STATUSES = ["draft", "active", "completed", "terminated"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export const CONTRACT_RISK_SCORES = ["pending", "low", "medium", "high"] as const;
export type ContractRiskScore = (typeof CONTRACT_RISK_SCORES)[number];

export interface Contract {
  readonly id: ContractId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly contractType: ContractType;
  readonly contractNumber: string;
  readonly title: string;
  readonly party?: string | undefined;
  readonly periodStart?: string | undefined;
  readonly periodEnd?: string | undefined;
  readonly amount?: number | undefined;
  readonly description?: string | undefined;
  readonly documentUrl?: string | undefined;
  readonly aiRiskScore: ContractRiskScore;
  readonly status: ContractStatus;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateContractInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly contractType?: ContractType | undefined;
  readonly contractNumber: string;
  readonly title: string;
  readonly party?: string | undefined;
  readonly periodStart?: string | undefined;
  readonly periodEnd?: string | undefined;
  readonly amount?: number | undefined;
  readonly description?: string | undefined;
  readonly documentUrl?: string | undefined;
  readonly aiRiskScore?: ContractRiskScore | undefined;
  readonly status?: ContractStatus | undefined;
  readonly createdAt: IsoTimestamp;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function createContract(input: CreateContractInput): Result<Contract> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .oneOf(input.contractType ?? "prime", CONTRACT_TYPES, "contractType")
    .nonEmpty(input.contractNumber, "contractNumber")
    .nonEmpty(input.title, "title")
    .require(
      input.amount === undefined || (Number.isFinite(input.amount) && input.amount >= 0),
      "amount",
      "amount must be a non-negative number",
    )
    .oneOf(input.aiRiskScore ?? "pending", CONTRACT_RISK_SCORES, "aiRiskScore")
    .oneOf(input.status ?? "draft", CONTRACT_STATUSES, "status");
  if (input.periodStart !== undefined && !DATE_RE.test(input.periodStart)) {
    issues.require(false, "periodStart", "periodStart must use YYYY-MM-DD");
  }
  if (input.periodEnd !== undefined && !DATE_RE.test(input.periodEnd)) {
    issues.require(false, "periodEnd", "periodEnd must use YYYY-MM-DD");
  }
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: contractId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    contractType: input.contractType ?? "prime",
    contractNumber: input.contractNumber,
    title: input.title.trim(),
    ...(input.party !== undefined ? { party: input.party } : {}),
    ...(input.periodStart !== undefined ? { periodStart: input.periodStart } : {}),
    ...(input.periodEnd !== undefined ? { periodEnd: input.periodEnd } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.documentUrl !== undefined ? { documentUrl: input.documentUrl } : {}),
    aiRiskScore: input.aiRiskScore ?? "pending",
    status: input.status ?? "draft",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
