/**
 * Billing / accounting API (経理・請求管理 — Issue #84).
 *
 * Exposes CRUD for progress billing invoices, payment records, and advance
 * payments. Every entity is created against an existing {@link Contract}:
 * billing against a contract that does not exist (or belongs to a different
 * organization) is rejected with 404, matching the pattern used by the
 * purchase-order / work-order routes for their parent resource.
 */

import { randomUUID } from "node:crypto";
import { contractId } from "../../domain/contract.ts";
import {
  BILLING_APPROVAL_STATUSES,
  PAYMENT_METHODS,
  ADVANCE_PAYMENT_STATUSES,
  createProgressBillingInvoice,
  updateProgressBillingInvoice,
  progressBillingInvoiceId,
  createPaymentRecord,
  updatePaymentRecord,
  paymentRecordId,
  createAdvancePayment,
  updateAdvancePayment,
  advancePaymentId,
} from "../../domain/billing.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";
import type { Contract } from "../../domain/contract.ts";

/** Resolve the contract for `:contractId`, scoped to the caller's organization. */
async function loadContract(
  container: AppContainer,
  ctxOrgId: string | undefined,
  rawContractId: string,
): Promise<Contract | null> {
  const contract = await container.repositories.contracts.findById(contractId(rawContractId));
  if (contract === null || (ctxOrgId !== undefined && contract.organizationId !== ctxOrgId)) {
    return null;
  }
  return contract;
}

export function registerBillingRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  // -------------------------------------------------------------------------
  // Progress billing invoices (出来高請求書)
  // -------------------------------------------------------------------------

  router.get("/api/v1/contracts/:contractId/billing-invoices", async (req, ctx, res) => {
    if (!hasPermission(ctx, "billing-invoice", "read")) {
      forbidden(res, "billing-invoice:read");
      return;
    }
    const contract = await loadContract(
      container,
      ctx?.organizationId,
      req.params["contractId"] ?? "",
    );
    if (contract === null) {
      notFound(res, "contract");
      return;
    }
    const page = paginate(
      await repositories.progressBillingInvoices.findByContract(contract.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      billingInvoices: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/contracts/:contractId/billing-invoices", async (req, ctx, res) => {
    if (!hasPermission(ctx, "billing-invoice", "write")) {
      forbidden(res, "billing-invoice:write");
      return;
    }
    const contract = await loadContract(
      container,
      ctx?.organizationId,
      req.params["contractId"] ?? "",
    );
    if (contract === null) {
      notFound(res, "contract");
      return;
    }
    const invoiceNumber = str(req.body, "invoiceNumber") ?? "";
    const duplicate = await repositories.progressBillingInvoices.findByNumber(invoiceNumber);
    if (duplicate !== null) {
      badRequest(res, [{ field: "invoiceNumber", message: "invoiceNumber already exists" }]);
      return;
    }
    const approvalStatus = str(req.body, "approvalStatus");
    if (
      approvalStatus !== undefined &&
      !BILLING_APPROVAL_STATUSES.includes(approvalStatus as never)
    ) {
      badRequest(res, [
        {
          field: "approvalStatus",
          message: `approvalStatus must be one of: ${BILLING_APPROVAL_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createProgressBillingInvoice({
      id: `billing-invoice-${randomUUID()}`,
      organizationId: contract.organizationId,
      projectId: contract.projectId as string,
      contractId: contract.id as string,
      invoiceNumber,
      billingDate: str(req.body, "billingDate") ?? "",
      periodStart: str(req.body, "periodStart"),
      periodEnd: str(req.body, "periodEnd"),
      progressPercentage: num(req.body, "progressPercentage") ?? 0,
      billedAmount: num(req.body, "billedAmount") ?? 0,
      cumulativeBilledAmount: num(req.body, "cumulativeBilledAmount"),
      approvalStatus: approvalStatus as never,
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.progressBillingInvoices.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "billing-invoice:create",
      `billing-invoices/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { billingInvoice: created.value });
  });

  router.get("/api/v1/billing-invoices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "billing-invoice", "read")) {
      forbidden(res, "billing-invoice:read");
      return;
    }
    const invoice = await repositories.progressBillingInvoices.findById(
      progressBillingInvoiceId(req.params["id"] ?? ""),
    );
    if (
      invoice === null ||
      (ctx?.organizationId !== undefined && invoice.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "billing invoice");
      return;
    }
    writeJson(res, 200, { billingInvoice: invoice });
  });

  router.put("/api/v1/billing-invoices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "billing-invoice", "write")) {
      forbidden(res, "billing-invoice:write");
      return;
    }
    const existing = await repositories.progressBillingInvoices.findById(
      progressBillingInvoiceId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "billing invoice");
      return;
    }
    const approvalStatus = str(req.body, "approvalStatus");
    if (
      approvalStatus !== undefined &&
      !BILLING_APPROVAL_STATUSES.includes(approvalStatus as never)
    ) {
      badRequest(res, [
        {
          field: "approvalStatus",
          message: `approvalStatus must be one of: ${BILLING_APPROVAL_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateProgressBillingInvoice(existing, {
      billingDate: str(req.body, "billingDate"),
      periodStart: str(req.body, "periodStart"),
      periodEnd: str(req.body, "periodEnd"),
      progressPercentage: num(req.body, "progressPercentage"),
      billedAmount: num(req.body, "billedAmount"),
      cumulativeBilledAmount: num(req.body, "cumulativeBilledAmount"),
      approvalStatus: approvalStatus as never,
      notes: str(req.body, "notes"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.progressBillingInvoices.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "billing-invoice:update",
      `billing-invoices/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { billingInvoice: updated.value });
  });

  router.delete("/api/v1/billing-invoices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "billing-invoice", "write")) {
      forbidden(res, "billing-invoice:write");
      return;
    }
    const existing = await repositories.progressBillingInvoices.findById(
      progressBillingInvoiceId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "billing invoice");
      return;
    }
    await repositories.progressBillingInvoices.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "billing-invoice:delete",
      `billing-invoices/${existing.id}`,
      "success",
    );
    noContent(res);
  });

  // -------------------------------------------------------------------------
  // Payment records (支払記録)
  // -------------------------------------------------------------------------

  router.get("/api/v1/contracts/:contractId/payments", async (req, ctx, res) => {
    if (!hasPermission(ctx, "payment-record", "read")) {
      forbidden(res, "payment-record:read");
      return;
    }
    const contract = await loadContract(
      container,
      ctx?.organizationId,
      req.params["contractId"] ?? "",
    );
    if (contract === null) {
      notFound(res, "contract");
      return;
    }
    const page = paginate(
      await repositories.paymentRecords.findByContract(contract.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      payments: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/contracts/:contractId/payments", async (req, ctx, res) => {
    if (!hasPermission(ctx, "payment-record", "write")) {
      forbidden(res, "payment-record:write");
      return;
    }
    const contract = await loadContract(
      container,
      ctx?.organizationId,
      req.params["contractId"] ?? "",
    );
    if (contract === null) {
      notFound(res, "contract");
      return;
    }
    const invoiceIdRaw = str(req.body, "invoiceId");
    if (invoiceIdRaw !== undefined) {
      const invoice = await repositories.progressBillingInvoices.findById(
        progressBillingInvoiceId(invoiceIdRaw),
      );
      if (invoice === null || (invoice.contractId as string) !== (contract.id as string)) {
        badRequest(res, [
          { field: "invoiceId", message: "invoiceId must reference an invoice on this contract" },
        ]);
        return;
      }
    }
    const paymentMethod = str(req.body, "paymentMethod");
    if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod as never)) {
      badRequest(res, [
        {
          field: "paymentMethod",
          message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createPaymentRecord({
      id: `payment-record-${randomUUID()}`,
      organizationId: contract.organizationId,
      projectId: contract.projectId as string,
      contractId: contract.id as string,
      invoiceId: invoiceIdRaw,
      paymentDate: str(req.body, "paymentDate") ?? "",
      amount: num(req.body, "amount") ?? 0,
      paymentMethod: paymentMethod as never,
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.paymentRecords.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "payment-record:create",
      `payments/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { payment: created.value });
  });

  router.get("/api/v1/payments/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "payment-record", "read")) {
      forbidden(res, "payment-record:read");
      return;
    }
    const payment = await repositories.paymentRecords.findById(
      paymentRecordId(req.params["id"] ?? ""),
    );
    if (
      payment === null ||
      (ctx?.organizationId !== undefined && payment.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "payment");
      return;
    }
    writeJson(res, 200, { payment });
  });

  router.put("/api/v1/payments/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "payment-record", "write")) {
      forbidden(res, "payment-record:write");
      return;
    }
    const existing = await repositories.paymentRecords.findById(
      paymentRecordId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "payment");
      return;
    }
    const paymentMethod = str(req.body, "paymentMethod");
    if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod as never)) {
      badRequest(res, [
        {
          field: "paymentMethod",
          message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updatePaymentRecord(existing, {
      paymentDate: str(req.body, "paymentDate"),
      amount: num(req.body, "amount"),
      paymentMethod: paymentMethod as never,
      notes: str(req.body, "notes"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.paymentRecords.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "payment-record:update",
      `payments/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { payment: updated.value });
  });

  router.delete("/api/v1/payments/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "payment-record", "write")) {
      forbidden(res, "payment-record:write");
      return;
    }
    const existing = await repositories.paymentRecords.findById(
      paymentRecordId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "payment");
      return;
    }
    await repositories.paymentRecords.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "payment-record:delete",
      `payments/${existing.id}`,
      "success",
    );
    noContent(res);
  });

  // -------------------------------------------------------------------------
  // Advance payments (仮払記録)
  // -------------------------------------------------------------------------

  router.get("/api/v1/contracts/:contractId/advance-payments", async (req, ctx, res) => {
    if (!hasPermission(ctx, "advance-payment", "read")) {
      forbidden(res, "advance-payment:read");
      return;
    }
    const contract = await loadContract(
      container,
      ctx?.organizationId,
      req.params["contractId"] ?? "",
    );
    if (contract === null) {
      notFound(res, "contract");
      return;
    }
    const page = paginate(
      await repositories.advancePayments.findByContract(contract.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      advancePayments: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/contracts/:contractId/advance-payments", async (req, ctx, res) => {
    if (!hasPermission(ctx, "advance-payment", "write")) {
      forbidden(res, "advance-payment:write");
      return;
    }
    const contract = await loadContract(
      container,
      ctx?.organizationId,
      req.params["contractId"] ?? "",
    );
    if (contract === null) {
      notFound(res, "contract");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !ADVANCE_PAYMENT_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${ADVANCE_PAYMENT_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createAdvancePayment({
      id: `advance-payment-${randomUUID()}`,
      organizationId: contract.organizationId,
      projectId: contract.projectId as string,
      contractId: contract.id as string,
      paymentDate: str(req.body, "paymentDate") ?? "",
      amount: num(req.body, "amount") ?? 0,
      recoveredAmount: num(req.body, "recoveredAmount"),
      purpose: str(req.body, "purpose"),
      status: status as never,
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.advancePayments.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "advance-payment:create",
      `advance-payments/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { advancePayment: created.value });
  });

  router.get("/api/v1/advance-payments/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "advance-payment", "read")) {
      forbidden(res, "advance-payment:read");
      return;
    }
    const advance = await repositories.advancePayments.findById(
      advancePaymentId(req.params["id"] ?? ""),
    );
    if (
      advance === null ||
      (ctx?.organizationId !== undefined && advance.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "advance payment");
      return;
    }
    writeJson(res, 200, { advancePayment: advance });
  });

  router.put("/api/v1/advance-payments/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "advance-payment", "write")) {
      forbidden(res, "advance-payment:write");
      return;
    }
    const existing = await repositories.advancePayments.findById(
      advancePaymentId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "advance payment");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !ADVANCE_PAYMENT_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${ADVANCE_PAYMENT_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateAdvancePayment(existing, {
      paymentDate: str(req.body, "paymentDate"),
      amount: num(req.body, "amount"),
      recoveredAmount: num(req.body, "recoveredAmount"),
      purpose: str(req.body, "purpose"),
      status: status as never,
      notes: str(req.body, "notes"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.advancePayments.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "advance-payment:update",
      `advance-payments/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { advancePayment: updated.value });
  });

  router.delete("/api/v1/advance-payments/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "advance-payment", "write")) {
      forbidden(res, "advance-payment:write");
      return;
    }
    const existing = await repositories.advancePayments.findById(
      advancePaymentId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "advance payment");
      return;
    }
    await repositories.advancePayments.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "advance-payment:delete",
      `advance-payments/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
