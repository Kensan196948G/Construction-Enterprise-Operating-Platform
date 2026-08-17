/**
 * Site inspection API (Civil-Construction-Management-Platform 検査・チェックリスト).
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import {
  INSPECTION_RESULTS,
  createInspection,
  inspectionId,
  updateInspection,
} from "../../domain/inspection.ts";
import type { InspectionChecklistItem } from "../../domain/inspection.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

function parseChecklist(body: unknown): readonly InspectionChecklistItem[] | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const raw = (body as Record<string, unknown>)["checklistItems"];
  if (!Array.isArray(raw)) return undefined;
  const items: InspectionChecklistItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return undefined;
    const label = (entry as Record<string, unknown>)["label"];
    const passed = (entry as Record<string, unknown>)["passed"];
    if (typeof label !== "string" || typeof passed !== "boolean") return undefined;
    items.push({ label, passed });
  }
  return items;
}

export function registerInspectionRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/inspections", async (req, ctx, res) => {
    if (!hasPermission(ctx, "inspection", "read")) {
      forbidden(res, "inspection:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? (await repositories.inspections.findAll()).filter((i) => i.organizationId === orgId)
        : await repositories.inspections.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      inspections: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.get("/api/v1/projects/:projectId/inspections", async (req, ctx, res) => {
    if (!hasPermission(ctx, "inspection", "read")) {
      forbidden(res, "inspection:read");
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
      await repositories.inspections.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      inspections: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/inspections", async (req, ctx, res) => {
    if (!hasPermission(ctx, "inspection", "write")) {
      forbidden(res, "inspection:write");
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
    if (result !== undefined && !INSPECTION_RESULTS.includes(result as never)) {
      badRequest(res, [
        { field: "result", message: `result must be one of: ${INSPECTION_RESULTS.join(", ")}` },
      ]);
      return;
    }
    const checklistItems = parseChecklist(req.body);
    if (
      req.body !== undefined &&
      typeof req.body === "object" &&
      "checklistItems" in (req.body as object) &&
      checklistItems === undefined
    ) {
      badRequest(res, [{ field: "checklistItems", message: "checklist items are invalid" }]);
      return;
    }
    const created = createInspection({
      id: `inspection-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      title: str(req.body, "title") ?? "",
      description: str(req.body, "description"),
      result: result as never,
      inspectedAt: str(req.body, "inspectedAt"),
      inspectorId: str(req.body, "inspectorId"),
      checklistItems,
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.inspections.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "inspection:create",
      `inspections/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { inspection: created.value });
  });

  router.get("/api/v1/inspections/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "inspection", "read")) {
      forbidden(res, "inspection:read");
      return;
    }
    const inspection = await repositories.inspections.findById(
      inspectionId(req.params["id"] ?? ""),
    );
    if (
      inspection === null ||
      (ctx?.organizationId !== undefined && inspection.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "inspection");
      return;
    }
    writeJson(res, 200, { inspection });
  });

  router.put("/api/v1/inspections/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "inspection", "write")) {
      forbidden(res, "inspection:write");
      return;
    }
    const existing = await repositories.inspections.findById(inspectionId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "inspection");
      return;
    }
    const result = str(req.body, "result");
    if (result !== undefined && !INSPECTION_RESULTS.includes(result as never)) {
      badRequest(res, [
        { field: "result", message: `result must be one of: ${INSPECTION_RESULTS.join(", ")}` },
      ]);
      return;
    }
    const checklistItems = parseChecklist(req.body);
    if (
      req.body !== undefined &&
      typeof req.body === "object" &&
      "checklistItems" in (req.body as object) &&
      checklistItems === undefined
    ) {
      badRequest(res, [{ field: "checklistItems", message: "checklist items are invalid" }]);
      return;
    }
    const updated = updateInspection(existing, {
      title: str(req.body, "title"),
      description: str(req.body, "description"),
      result: result as never,
      inspectedAt: str(req.body, "inspectedAt"),
      inspectorId: str(req.body, "inspectorId"),
      checklistItems,
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.inspections.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "inspection:update",
      `inspections/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { inspection: updated.value });
  });

  router.delete("/api/v1/inspections/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "inspection", "write")) {
      forbidden(res, "inspection:write");
      return;
    }
    const existing = await repositories.inspections.findById(inspectionId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "inspection");
      return;
    }
    await repositories.inspections.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "inspection:delete",
      `inspections/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
