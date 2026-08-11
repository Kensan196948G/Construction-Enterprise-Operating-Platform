/**
 * Safety check / quality inspection API (ServiceHub S-04).
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import {
  SAFETY_CHECK_TYPES,
  SAFETY_RESULTS,
  createSafetyCheck,
  safetyCheckId,
  createQualityInspection,
  qualityInspectionId,
  QUALITY_RESULTS,
} from "../../domain/safety.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerSafetyRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/safety-checks", async (req, ctx, res) => {
    if (!hasPermission(ctx, "safety", "read")) {
      forbidden(res, "safety:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const page = paginate(
      await repositories.safetyChecks.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      safetyChecks: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/safety-checks", async (req, ctx, res) => {
    if (!hasPermission(ctx, "safety", "write")) {
      forbidden(res, "safety:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const checkType = str(req.body, "checkType");
    if (checkType !== undefined && !SAFETY_CHECK_TYPES.includes(checkType as never)) {
      badRequest(res, [
        {
          field: "checkType",
          message: `checkType must be one of: ${SAFETY_CHECK_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const overall = str(req.body, "overallResult");
    if (overall !== undefined && !SAFETY_RESULTS.includes(overall as never)) {
      badRequest(res, [
        {
          field: "overallResult",
          message: `overallResult must be one of: ${SAFETY_RESULTS.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createSafetyCheck({
      id: `safety-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      checkDate: str(req.body, "checkDate") ?? "",
      checkType: checkType as never,
      itemsTotal: num(req.body, "itemsTotal"),
      itemsOk: num(req.body, "itemsOk"),
      itemsNg: num(req.body, "itemsNg"),
      overallResult: overall as never,
      notes: str(req.body, "notes"),
      inspectorId: str(req.body, "inspectorId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.safetyChecks.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "safety:create",
      `safety-checks/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { safetyCheck: created.value });
  });

  router.get("/api/v1/safety-checks/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "safety", "read")) {
      forbidden(res, "safety:read");
      return;
    }
    const check = await repositories.safetyChecks.findById(safetyCheckId(req.params["id"] ?? ""));
    if (
      check === null ||
      (ctx?.organizationId !== undefined && check.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "safety check");
      return;
    }
    writeJson(res, 200, { safetyCheck: check });
  });

  router.delete("/api/v1/safety-checks/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "safety", "write")) {
      forbidden(res, "safety:write");
      return;
    }
    const check = await repositories.safetyChecks.findById(safetyCheckId(req.params["id"] ?? ""));
    if (
      check === null ||
      (ctx?.organizationId !== undefined && check.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "safety check");
      return;
    }
    await repositories.safetyChecks.delete(check.id);
    recordAudit(container.auditLog, ctx, "safety:delete", `safety-checks/${check.id}`, "success");
    writeJson(res, 200, { deleted: true });
  });

  router.get("/api/v1/projects/:projectId/quality-inspections", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality", "read")) {
      forbidden(res, "quality:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const page = paginate(
      await repositories.qualityInspections.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      qualityInspections: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/quality-inspections", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality", "write")) {
      forbidden(res, "quality:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const result = str(req.body, "result");
    if (result !== undefined && !QUALITY_RESULTS.includes(result as never)) {
      badRequest(res, [
        { field: "result", message: `result must be one of: ${QUALITY_RESULTS.join(", ")}` },
      ]);
      return;
    }
    const created = createQualityInspection({
      id: `quality-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      inspectionDate: str(req.body, "inspectionDate") ?? "",
      inspectionType: str(req.body, "inspectionType") ?? "",
      targetItem: str(req.body, "targetItem") ?? "",
      standardValue: str(req.body, "standardValue"),
      measuredValue: str(req.body, "measuredValue"),
      result: result as never,
      notes: str(req.body, "notes"),
      inspectorId: str(req.body, "inspectorId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.qualityInspections.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "quality:create",
      `quality-inspections/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { qualityInspection: created.value });
  });

  router.get("/api/v1/quality-inspections/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality", "read")) {
      forbidden(res, "quality:read");
      return;
    }
    const inspection = await repositories.qualityInspections.findById(
      qualityInspectionId(req.params["id"] ?? ""),
    );
    if (
      inspection === null ||
      (ctx?.organizationId !== undefined && inspection.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "quality inspection");
      return;
    }
    writeJson(res, 200, { qualityInspection: inspection });
  });

  router.delete("/api/v1/quality-inspections/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "quality", "write")) {
      forbidden(res, "quality:write");
      return;
    }
    const inspection = await repositories.qualityInspections.findById(
      qualityInspectionId(req.params["id"] ?? ""),
    );
    if (
      inspection === null ||
      (ctx?.organizationId !== undefined && inspection.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "quality inspection");
      return;
    }
    await repositories.qualityInspections.delete(inspection.id);
    recordAudit(
      container.auditLog,
      ctx,
      "quality:delete",
      `quality-inspections/${inspection.id}`,
      "success",
    );
    writeJson(res, 200, { deleted: true });
  });
}
