/**
 * Quality objective API (Civil-Construction-Management-Platform 品質目標).
 */

import { randomUUID } from "node:crypto";
import {
  QUALITY_OBJECTIVE_STATUSES,
  createQualityObjective,
  qualityObjectiveId,
  updateQualityObjective,
} from "../../domain/quality-objective.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerQualityObjectiveRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/quality-objectives", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality-objective", "read")) {
      forbidden(res, "quality-objective:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.qualityObjectives.findByOrganization(orgId)
        : await repositories.qualityObjectives.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      qualityObjectives: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/quality-objectives", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality-objective", "write")) {
      forbidden(res, "quality-objective:write");
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
    if (status !== undefined && !QUALITY_OBJECTIVE_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${QUALITY_OBJECTIVE_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createQualityObjective({
      id: `quality-objective-${randomUUID()}`,
      organizationId,
      title: str(req.body, "title") ?? "",
      description: str(req.body, "description"),
      isoClause: str(req.body, "isoClause"),
      target: str(req.body, "target"),
      unit: str(req.body, "unit"),
      baseline: num(req.body, "baseline"),
      targetValue: num(req.body, "targetValue"),
      status: status as never,
      dueDate: str(req.body, "dueDate"),
      ownerId: str(req.body, "ownerId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.qualityObjectives.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "quality-objective:create",
      `quality-objectives/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { qualityObjective: created.value });
  });

  router.get("/api/v1/quality-objectives/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality-objective", "read")) {
      forbidden(res, "quality-objective:read");
      return;
    }
    const objective = await repositories.qualityObjectives.findById(
      qualityObjectiveId(req.params["id"] ?? ""),
    );
    if (
      objective === null ||
      (ctx?.organizationId !== undefined && objective.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "quality objective");
      return;
    }
    writeJson(res, 200, { qualityObjective: objective });
  });

  router.put("/api/v1/quality-objectives/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality-objective", "write")) {
      forbidden(res, "quality-objective:write");
      return;
    }
    const existing = await repositories.qualityObjectives.findById(
      qualityObjectiveId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "quality objective");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !QUALITY_OBJECTIVE_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${QUALITY_OBJECTIVE_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateQualityObjective(existing, {
      title: str(req.body, "title"),
      description: str(req.body, "description"),
      isoClause: str(req.body, "isoClause"),
      target: str(req.body, "target"),
      unit: str(req.body, "unit"),
      baseline: num(req.body, "baseline"),
      targetValue: num(req.body, "targetValue"),
      status: status as never,
      dueDate: str(req.body, "dueDate"),
      ownerId: str(req.body, "ownerId"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.qualityObjectives.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "quality-objective:update",
      `quality-objectives/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { qualityObjective: updated.value });
  });

  router.delete("/api/v1/quality-objectives/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality-objective", "write")) {
      forbidden(res, "quality-objective:write");
      return;
    }
    const existing = await repositories.qualityObjectives.findById(
      qualityObjectiveId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "quality objective");
      return;
    }
    await repositories.qualityObjectives.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "quality-objective:delete",
      `quality-objectives/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
