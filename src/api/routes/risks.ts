/**
 * Risk register API (Civil-Construction-Management-Platform リスク).
 */

import { randomUUID } from "node:crypto";
import { RISK_LEVELS, RISK_STATUSES, createRisk, riskId, updateRisk } from "../../domain/risk.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerRiskRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/risks", async (req, ctx, res) => {
    if (!hasPermission(ctx, "risk", "read")) {
      forbidden(res, "risk:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.risks.findByOrganization(orgId)
        : await repositories.risks.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      risks: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/risks", async (req, ctx, res) => {
    if (!hasPermission(ctx, "risk", "write")) {
      forbidden(res, "risk:write");
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
    const riskLevel = str(req.body, "riskLevel");
    if (riskLevel !== undefined && !RISK_LEVELS.includes(riskLevel as never)) {
      badRequest(res, [
        { field: "riskLevel", message: `riskLevel must be one of: ${RISK_LEVELS.join(", ")}` },
      ]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !RISK_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${RISK_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const created = createRisk({
      id: `risk-${randomUUID()}`,
      organizationId,
      objectiveId: str(req.body, "objectiveId"),
      title: str(req.body, "title") ?? "",
      description: str(req.body, "description"),
      isoClause: str(req.body, "isoClause"),
      likelihood: num(req.body, "likelihood"),
      impact: num(req.body, "impact"),
      riskLevel: riskLevel as never,
      status: status as never,
      treatmentPlan: str(req.body, "treatmentPlan"),
      residualRisk: str(req.body, "residualRisk"),
      ownerId: str(req.body, "ownerId"),
      reviewDate: str(req.body, "reviewDate"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.risks.save(created.value);
    recordAudit(container.auditLog, ctx, "risk:create", `risks/${created.value.id}`, "success");
    writeJson(res, 201, { risk: created.value });
  });

  router.get("/api/v1/risks/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "risk", "read")) {
      forbidden(res, "risk:read");
      return;
    }
    const risk = await repositories.risks.findById(riskId(req.params["id"] ?? ""));
    if (
      risk === null ||
      (ctx?.organizationId !== undefined && risk.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "risk");
      return;
    }
    writeJson(res, 200, { risk });
  });

  router.put("/api/v1/risks/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "risk", "write")) {
      forbidden(res, "risk:write");
      return;
    }
    const existing = await repositories.risks.findById(riskId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "risk");
      return;
    }
    const riskLevel = str(req.body, "riskLevel");
    if (riskLevel !== undefined && !RISK_LEVELS.includes(riskLevel as never)) {
      badRequest(res, [
        { field: "riskLevel", message: `riskLevel must be one of: ${RISK_LEVELS.join(", ")}` },
      ]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !RISK_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${RISK_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const updated = updateRisk(existing, {
      title: str(req.body, "title"),
      description: str(req.body, "description"),
      isoClause: str(req.body, "isoClause"),
      likelihood: num(req.body, "likelihood"),
      impact: num(req.body, "impact"),
      riskLevel: riskLevel as never,
      status: status as never,
      treatmentPlan: str(req.body, "treatmentPlan"),
      residualRisk: str(req.body, "residualRisk"),
      ownerId: str(req.body, "ownerId"),
      reviewDate: str(req.body, "reviewDate"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.risks.save(updated.value);
    recordAudit(container.auditLog, ctx, "risk:update", `risks/${updated.value.id}`, "success");
    writeJson(res, 200, { risk: updated.value });
  });

  router.delete("/api/v1/risks/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "risk", "write")) {
      forbidden(res, "risk:write");
      return;
    }
    const existing = await repositories.risks.findById(riskId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "risk");
      return;
    }
    await repositories.risks.delete(existing.id);
    recordAudit(container.auditLog, ctx, "risk:delete", `risks/${existing.id}`, "success");
    noContent(res);
  });
}
