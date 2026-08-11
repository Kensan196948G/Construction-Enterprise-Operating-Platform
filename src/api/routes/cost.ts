/**
 * Cost record / work hour API (ServiceHub S-05).
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import { createCostRecord, costRecordId, createWorkHour, workHourId } from "../../domain/cost.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerCostRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/cost-records", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "read")) {
      forbidden(res, "cost:read");
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
      await repositories.costRecords.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      costRecords: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/cost-records", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "write")) {
      forbidden(res, "cost:write");
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
    const created = createCostRecord({
      id: `cost-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      recordDate: str(req.body, "recordDate") ?? "",
      category: str(req.body, "category") ?? "",
      description: str(req.body, "description") ?? "",
      budgetedAmount: num(req.body, "budgetedAmount"),
      actualAmount: num(req.body, "actualAmount"),
      vendorName: str(req.body, "vendorName"),
      invoiceNumber: str(req.body, "invoiceNumber"),
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.costRecords.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "cost:create",
      `cost-records/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { costRecord: created.value });
  });

  router.get("/api/v1/cost-records/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "read")) {
      forbidden(res, "cost:read");
      return;
    }
    const record = await repositories.costRecords.findById(costRecordId(req.params["id"] ?? ""));
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "cost record");
      return;
    }
    writeJson(res, 200, { costRecord: record });
  });

  router.delete("/api/v1/cost-records/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "write")) {
      forbidden(res, "cost:write");
      return;
    }
    const record = await repositories.costRecords.findById(costRecordId(req.params["id"] ?? ""));
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "cost record");
      return;
    }
    await repositories.costRecords.delete(record.id);
    recordAudit(container.auditLog, ctx, "cost:delete", `cost-records/${record.id}`, "success");
    writeJson(res, 200, { deleted: true });
  });

  router.get("/api/v1/projects/:projectId/work-hours", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "read")) {
      forbidden(res, "cost:read");
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
      await repositories.workHours.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      workHours: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/work-hours", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "write")) {
      forbidden(res, "cost:write");
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
    const created = createWorkHour({
      id: `work-hour-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      workerId: str(req.body, "workerId"),
      workDate: str(req.body, "workDate") ?? "",
      hours: num(req.body, "hours") ?? 0,
      workType: str(req.body, "workType"),
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.workHours.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "work-hour:create",
      `work-hours/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { workHour: created.value });
  });

  router.get("/api/v1/work-hours/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "cost", "read")) {
      forbidden(res, "cost:read");
      return;
    }
    const record = await repositories.workHours.findById(workHourId(req.params["id"] ?? ""));
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "work hour");
      return;
    }
    writeJson(res, 200, { workHour: record });
  });
}
