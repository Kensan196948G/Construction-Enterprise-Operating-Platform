/**
 * Billing / accounting domain (経理・請求管理 — Issue #84).
 *
 * Models progress billing invoices raised against a legal contract
 * ({@link ContractId}), the payments received against those invoices, and
 * advance payments (仮払) made ahead of billed progress. All three entity
 * kinds are scoped to a project and, transitively, an organization.
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
import { type ContractId, contractId } from "./contract.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Progress billing invoice (出来高請求書)
// ---------------------------------------------------------------------------

export type ProgressBillingInvoiceId = Brand<string, "ProgressBillingInvoiceId">;
export const progressBillingInvoiceId = (value: string): ProgressBillingInvoiceId =>
  value as ProgressBillingInvoiceId;

export const BILLING_APPROVAL_STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type BillingApprovalStatus = (typeof BILLING_APPROVAL_STATUSES)[number];

export interface ProgressBillingInvoice {
  readonly id: ProgressBillingInvoiceId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly contractId: ContractId;
  readonly invoiceNumber: string;
  readonly billingDate: string;
  readonly periodStart?: string | undefined;
  readonly periodEnd?: string | undefined;
  readonly progressPercentage: number;
  readonly billedAmount: number;
  readonly cumulativeBilledAmount: number;
  readonly approvalStatus: BillingApprovalStatus;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateProgressBillingInvoiceInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly contractId: string;
  readonly invoiceNumber: string;
  readonly billingDate: string;
  readonly periodStart?: string | undefined;
  readonly periodEnd?: string | undefined;
  readonly progressPercentage: number;
  readonly billedAmount: number;
  readonly cumulativeBilledAmount?: number | undefined;
  readonly approvalStatus?: BillingApprovalStatus | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createProgressBillingInvoice(
  input: CreateProgressBillingInvoiceInput,
): Result<ProgressBillingInvoice> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.contractId, "contractId")
    .nonEmpty(input.invoiceNumber, "invoiceNumber")
    .require(
      DATE_RE.test(input.billingDate ?? ""),
      "billingDate",
      "billingDate must use YYYY-MM-DD",
    )
    .require(
      Number.isFinite(input.progressPercentage) &&
        input.progressPercentage >= 0 &&
        input.progressPercentage <= 100,
      "progressPercentage",
      "progressPercentage must be a number between 0 and 100",
    )
    .require(
      Number.isFinite(input.billedAmount) && input.billedAmount >= 0,
      "billedAmount",
      "billedAmount must be a non-negative number",
    )
    .require(
      input.cumulativeBilledAmount === undefined ||
        (Number.isFinite(input.cumulativeBilledAmount) && input.cumulativeBilledAmount >= 0),
      "cumulativeBilledAmount",
      "cumulativeBilledAmount must be a non-negative number",
    )
    .oneOf(input.approvalStatus ?? "draft", BILLING_APPROVAL_STATUSES, "approvalStatus");
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
    id: progressBillingInvoiceId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    contractId: contractId(input.contractId),
    invoiceNumber: input.invoiceNumber,
    billingDate: input.billingDate,
    ...(input.periodStart !== undefined ? { periodStart: input.periodStart } : {}),
    ...(input.periodEnd !== undefined ? { periodEnd: input.periodEnd } : {}),
    progressPercentage: input.progressPercentage,
    billedAmount: input.billedAmount,
    cumulativeBilledAmount: input.cumulativeBilledAmount ?? input.billedAmount,
    approvalStatus: input.approvalStatus ?? "draft",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateProgressBillingInvoiceInput {
  readonly billingDate?: string | undefined;
  readonly periodStart?: string | undefined;
  readonly periodEnd?: string | undefined;
  readonly progressPercentage?: number | undefined;
  readonly billedAmount?: number | undefined;
  readonly cumulativeBilledAmount?: number | undefined;
  readonly approvalStatus?: BillingApprovalStatus | undefined;
  readonly notes?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateProgressBillingInvoice(
  invoice: ProgressBillingInvoice,
  input: UpdateProgressBillingInvoiceInput,
): Result<ProgressBillingInvoice> {
  const issues = new ValidationBuilder()
    .require(
      input.billingDate === undefined || DATE_RE.test(input.billingDate),
      "billingDate",
      "billingDate must use YYYY-MM-DD",
    )
    .require(
      input.progressPercentage === undefined ||
        (Number.isFinite(input.progressPercentage) &&
          input.progressPercentage >= 0 &&
          input.progressPercentage <= 100),
      "progressPercentage",
      "progressPercentage must be a number between 0 and 100",
    )
    .require(
      input.billedAmount === undefined ||
        (Number.isFinite(input.billedAmount) && input.billedAmount >= 0),
      "billedAmount",
      "billedAmount must be a non-negative number",
    )
    .require(
      input.cumulativeBilledAmount === undefined ||
        (Number.isFinite(input.cumulativeBilledAmount) && input.cumulativeBilledAmount >= 0),
      "cumulativeBilledAmount",
      "cumulativeBilledAmount must be a non-negative number",
    )
    .oneOf(
      input.approvalStatus ?? invoice.approvalStatus,
      BILLING_APPROVAL_STATUSES,
      "approvalStatus",
    );
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
    ...invoice,
    ...(input.billingDate !== undefined ? { billingDate: input.billingDate } : {}),
    ...(input.periodStart !== undefined ? { periodStart: input.periodStart } : {}),
    ...(input.periodEnd !== undefined ? { periodEnd: input.periodEnd } : {}),
    ...(input.progressPercentage !== undefined
      ? { progressPercentage: input.progressPercentage }
      : {}),
    ...(input.billedAmount !== undefined ? { billedAmount: input.billedAmount } : {}),
    ...(input.cumulativeBilledAmount !== undefined
      ? { cumulativeBilledAmount: input.cumulativeBilledAmount }
      : {}),
    ...(input.approvalStatus !== undefined ? { approvalStatus: input.approvalStatus } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    updatedAt: input.updatedAt,
  });
}

// ---------------------------------------------------------------------------
// Payment record (支払記録)
// ---------------------------------------------------------------------------

export type PaymentRecordId = Brand<string, "PaymentRecordId">;
export const paymentRecordId = (value: string): PaymentRecordId => value as PaymentRecordId;

export const PAYMENT_METHODS = ["bank_transfer", "cash", "check", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentRecord {
  readonly id: PaymentRecordId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly contractId: ContractId;
  readonly invoiceId?: ProgressBillingInvoiceId | undefined;
  readonly paymentDate: string;
  readonly amount: number;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreatePaymentRecordInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly contractId: string;
  readonly invoiceId?: string | undefined;
  readonly paymentDate: string;
  readonly amount: number;
  readonly paymentMethod?: PaymentMethod | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createPaymentRecord(input: CreatePaymentRecordInput): Result<PaymentRecord> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.contractId, "contractId")
    .require(
      DATE_RE.test(input.paymentDate ?? ""),
      "paymentDate",
      "paymentDate must use YYYY-MM-DD",
    )
    .require(
      Number.isFinite(input.amount) && input.amount > 0,
      "amount",
      "amount must be a positive number",
    )
    .oneOf(input.paymentMethod ?? "bank_transfer", PAYMENT_METHODS, "paymentMethod");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: paymentRecordId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    contractId: contractId(input.contractId),
    ...(input.invoiceId !== undefined
      ? { invoiceId: progressBillingInvoiceId(input.invoiceId) }
      : {}),
    paymentDate: input.paymentDate,
    amount: input.amount,
    paymentMethod: input.paymentMethod ?? "bank_transfer",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdatePaymentRecordInput {
  readonly paymentDate?: string | undefined;
  readonly amount?: number | undefined;
  readonly paymentMethod?: PaymentMethod | undefined;
  readonly notes?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updatePaymentRecord(
  record: PaymentRecord,
  input: UpdatePaymentRecordInput,
): Result<PaymentRecord> {
  const issues = new ValidationBuilder()
    .require(
      input.paymentDate === undefined || DATE_RE.test(input.paymentDate),
      "paymentDate",
      "paymentDate must use YYYY-MM-DD",
    )
    .require(
      input.amount === undefined || (Number.isFinite(input.amount) && input.amount > 0),
      "amount",
      "amount must be a positive number",
    )
    .oneOf(input.paymentMethod ?? record.paymentMethod, PAYMENT_METHODS, "paymentMethod");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...record,
    ...(input.paymentDate !== undefined ? { paymentDate: input.paymentDate } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    updatedAt: input.updatedAt,
  });
}

// ---------------------------------------------------------------------------
// Advance payment (仮払記録)
// ---------------------------------------------------------------------------

export type AdvancePaymentId = Brand<string, "AdvancePaymentId">;
export const advancePaymentId = (value: string): AdvancePaymentId => value as AdvancePaymentId;

export const ADVANCE_PAYMENT_STATUSES = [
  "outstanding",
  "partially_recovered",
  "recovered",
] as const;
export type AdvancePaymentStatus = (typeof ADVANCE_PAYMENT_STATUSES)[number];

export interface AdvancePayment {
  readonly id: AdvancePaymentId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly contractId: ContractId;
  readonly paymentDate: string;
  readonly amount: number;
  readonly recoveredAmount: number;
  readonly purpose?: string | undefined;
  readonly status: AdvancePaymentStatus;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateAdvancePaymentInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly contractId: string;
  readonly paymentDate: string;
  readonly amount: number;
  readonly recoveredAmount?: number | undefined;
  readonly purpose?: string | undefined;
  readonly status?: AdvancePaymentStatus | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createAdvancePayment(input: CreateAdvancePaymentInput): Result<AdvancePayment> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.contractId, "contractId")
    .require(
      DATE_RE.test(input.paymentDate ?? ""),
      "paymentDate",
      "paymentDate must use YYYY-MM-DD",
    )
    .require(
      Number.isFinite(input.amount) && input.amount > 0,
      "amount",
      "amount must be a positive number",
    )
    .require(
      input.recoveredAmount === undefined ||
        (Number.isFinite(input.recoveredAmount) && input.recoveredAmount >= 0),
      "recoveredAmount",
      "recoveredAmount must be a non-negative number",
    )
    .oneOf(input.status ?? "outstanding", ADVANCE_PAYMENT_STATUSES, "status");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: advancePaymentId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    contractId: contractId(input.contractId),
    paymentDate: input.paymentDate,
    amount: input.amount,
    recoveredAmount: input.recoveredAmount ?? 0,
    ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    status: input.status ?? "outstanding",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export interface UpdateAdvancePaymentInput {
  readonly paymentDate?: string | undefined;
  readonly amount?: number | undefined;
  readonly recoveredAmount?: number | undefined;
  readonly purpose?: string | undefined;
  readonly status?: AdvancePaymentStatus | undefined;
  readonly notes?: string | undefined;
  readonly updatedAt: IsoTimestamp;
}

export function updateAdvancePayment(
  advance: AdvancePayment,
  input: UpdateAdvancePaymentInput,
): Result<AdvancePayment> {
  const issues = new ValidationBuilder()
    .require(
      input.paymentDate === undefined || DATE_RE.test(input.paymentDate),
      "paymentDate",
      "paymentDate must use YYYY-MM-DD",
    )
    .require(
      input.amount === undefined || (Number.isFinite(input.amount) && input.amount > 0),
      "amount",
      "amount must be a positive number",
    )
    .require(
      input.recoveredAmount === undefined ||
        (Number.isFinite(input.recoveredAmount) && input.recoveredAmount >= 0),
      "recoveredAmount",
      "recoveredAmount must be a non-negative number",
    )
    .oneOf(input.status ?? advance.status, ADVANCE_PAYMENT_STATUSES, "status");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...advance,
    ...(input.paymentDate !== undefined ? { paymentDate: input.paymentDate } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.recoveredAmount !== undefined ? { recoveredAmount: input.recoveredAmount } : {}),
    ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    updatedAt: input.updatedAt,
  });
}
