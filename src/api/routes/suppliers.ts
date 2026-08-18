/**
 * Supplier evaluation API (Civil-Construction-Management-Platform 供給者).
 */

import { randomUUID } from "node:crypto";
import {
  SUPPLIER_EVALUATION_STATUSES,
  createSupplierEvaluation,
  supplierEvaluationId,
  updateSupplierEvaluation,
} from "../../domain/supplier.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerSupplierEvaluationRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/supplier-evaluations", async (req, ctx, res) => {
    if (!hasPermission(ctx, "supplier", "read")) {
      forbidden(res, "supplier:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.supplierEvaluations.findByOrganization(orgId)
        : await repositories.supplierEvaluations.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      supplierEvaluations: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/supplier-evaluations", async (req, ctx, res) => {
    if (!hasPermission(ctx, "supplier", "write")) {
      forbidden(res, "supplier:write");
      return;
    }
    const bodyOrg = str(req.body, "organizationId");
    if (
      ctx?.organizationId !== undefined &&
      bodyOrg !== undefined &&
      bodyOrg !== ctx.organizationId
    ) {
      badRequest(res, [
        { field: "organizationId", message: "organization mismatch with credential scope" },
      ]);
      return;
    }
    const organizationId = ctx?.organizationId ?? bodyOrg;
    if (organizationId === undefined) {
      badRequest(res, [{ field: "organizationId", message: "organizationId is required" }]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !SUPPLIER_EVALUATION_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${SUPPLIER_EVALUATION_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createSupplierEvaluation({
      id: `supplier-evaluation-${randomUUID()}`,
      organizationId,
      supplierName: str(req.body, "supplierName") ?? "",
      supplierCode: str(req.body, "supplierCode"),
      category: str(req.body, "category"),
      status: status as never,
      evaluationDate: str(req.body, "evaluationDate") ?? "",
      nextEvaluationDate: str(req.body, "nextEvaluationDate"),
      score: num(req.body, "score"),
      isoClause: str(req.body, "isoClause"),
      notes: str(req.body, "notes"),
      evaluatorId: str(req.body, "evaluatorId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.supplierEvaluations.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "supplier:create",
      `supplier-evaluations/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { supplierEvaluation: created.value });
  });

  router.get("/api/v1/supplier-evaluations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "supplier", "read")) {
      forbidden(res, "supplier:read");
      return;
    }
    const evaluation = await repositories.supplierEvaluations.findById(
      supplierEvaluationId(req.params["id"] ?? ""),
    );
    if (
      evaluation === null ||
      (ctx?.organizationId !== undefined && evaluation.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "supplier evaluation");
      return;
    }
    writeJson(res, 200, { supplierEvaluation: evaluation });
  });

  router.put("/api/v1/supplier-evaluations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "supplier", "write")) {
      forbidden(res, "supplier:write");
      return;
    }
    const existing = await repositories.supplierEvaluations.findById(
      supplierEvaluationId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "supplier evaluation");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !SUPPLIER_EVALUATION_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${SUPPLIER_EVALUATION_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateSupplierEvaluation(existing, {
      supplierName: str(req.body, "supplierName"),
      supplierCode: str(req.body, "supplierCode"),
      category: str(req.body, "category"),
      status: status as never,
      evaluationDate: str(req.body, "evaluationDate"),
      nextEvaluationDate: str(req.body, "nextEvaluationDate"),
      score: num(req.body, "score"),
      isoClause: str(req.body, "isoClause"),
      notes: str(req.body, "notes"),
      evaluatorId: str(req.body, "evaluatorId"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.supplierEvaluations.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "supplier:update",
      `supplier-evaluations/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { supplierEvaluation: updated.value });
  });

  router.delete("/api/v1/supplier-evaluations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "supplier", "write")) {
      forbidden(res, "supplier:write");
      return;
    }
    const existing = await repositories.supplierEvaluations.findById(
      supplierEvaluationId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "supplier evaluation");
      return;
    }
    await repositories.supplierEvaluations.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "supplier:delete",
      `supplier-evaluations/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
