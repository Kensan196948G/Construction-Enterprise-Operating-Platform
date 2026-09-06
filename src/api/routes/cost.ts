/**
 * Cost record / work hour API (ServiceHub S-05).
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import { createCostRecord, costRecordId, createWorkHour, workHourId } from "../../domain/cost.ts";
import type { CostRecord, WorkHour } from "../../domain/cost.ts";
import { toCsv } from "../csv.ts";
import { csvNum, csvStr, parseCsv } from "../csv-import.ts";
import { toXlsx } from "../xlsx.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeBinaryAttachment, writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, rowErrors, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

const COST_RECORD_CSV_HEADERS = [
  "id",
  "recordDate",
  "category",
  "description",
  "budgetedAmount",
  "actualAmount",
  "vendorName",
  "invoiceNumber",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

function costRecordExportRow(r: CostRecord): Record<string, string> {
  return {
    id: r.id,
    recordDate: r.recordDate,
    category: r.category,
    description: r.description,
    budgetedAmount: String(r.budgetedAmount),
    actualAmount: String(r.actualAmount),
    vendorName: r.vendorName ?? "",
    invoiceNumber: r.invoiceNumber ?? "",
    notes: r.notes ?? "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

const WORK_HOUR_CSV_HEADERS = [
  "id",
  "workerId",
  "workDate",
  "hours",
  "workType",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

function workHourExportRow(w: WorkHour): Record<string, string> {
  return {
    id: w.id,
    workerId: w.workerId ?? "",
    workDate: w.workDate,
    hours: String(w.hours),
    workType: w.workType ?? "",
    notes: w.notes ?? "",
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

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

  router.get("/api/v1/projects/:projectId/cost-records/export.csv", async (req, ctx, res) => {
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
    const items = await repositories.costRecords.findByProject(project.id);
    const csv = toCsv(COST_RECORD_CSV_HEADERS, items.map(costRecordExportRow));
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cost-records-${project.id}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(csv);
  });

  router.get("/api/v1/projects/:projectId/cost-records/export.xlsx", async (req, ctx, res) => {
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
    const items = await repositories.costRecords.findByProject(project.id);
    const xlsx = toXlsx(COST_RECORD_CSV_HEADERS, items.map(costRecordExportRow), "CostRecords");
    writeBinaryAttachment(
      res,
      200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      `cost-records-${project.id}.xlsx`,
      xlsx,
    );
  });

  // CSV bulk import — additive to the single-record POST below. Body:
  // `{ "csv": "recordDate,category,...\n2026-01-01,材料費,...\n" }`.
  router.post("/api/v1/projects/:projectId/cost-records/import.csv", async (req, ctx, res) => {
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
    const csvText = str(req.body, "csv");
    if (csvText === undefined) {
      badRequest(res, [{ path: "csv", message: "csv (string) is required" }]);
      return;
    }
    const { rows } = parseCsv(csvText);
    if (rows.length === 0) {
      badRequest(res, [{ path: "csv", message: "csv must contain at least one data row" }]);
      return;
    }
    const created: CostRecord[] = [];
    const errors: ReturnType<typeof rowErrors> = [];
    rows.forEach((row, i) => {
      const result = createCostRecord({
        id: `cost-${randomUUID()}`,
        organizationId: project.organizationId,
        projectId: project.id as string,
        recordDate: csvStr(row, "recordDate") ?? "",
        category: csvStr(row, "category") ?? "",
        description: csvStr(row, "description") ?? "",
        budgetedAmount: csvNum(row, "budgetedAmount"),
        actualAmount: csvNum(row, "actualAmount"),
        vendorName: csvStr(row, "vendorName"),
        invoiceNumber: csvStr(row, "invoiceNumber"),
        notes: csvStr(row, "notes"),
        createdAt: nowTs(),
      });
      if (!result.ok) {
        errors.push(...rowErrors(i + 1, result.error));
        return;
      }
      created.push(result.value);
    });
    if (errors.length > 0) {
      badRequest(res, errors);
      return;
    }
    for (const record of created) {
      await repositories.costRecords.save(record);
    }
    recordAudit(
      container.auditLog,
      ctx,
      "cost:import",
      `projects/${project.id}/cost-records/import`,
      "success",
      { count: String(created.length) },
    );
    writeJson(res, 201, { imported: created.length, costRecords: created });
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

  router.get("/api/v1/projects/:projectId/work-hours/export.csv", async (req, ctx, res) => {
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
    const items = await repositories.workHours.findByProject(project.id);
    const csv = toCsv(WORK_HOUR_CSV_HEADERS, items.map(workHourExportRow));
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="work-hours-${project.id}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(csv);
  });

  router.get("/api/v1/projects/:projectId/work-hours/export.xlsx", async (req, ctx, res) => {
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
    const items = await repositories.workHours.findByProject(project.id);
    const xlsx = toXlsx(WORK_HOUR_CSV_HEADERS, items.map(workHourExportRow), "WorkHours");
    writeBinaryAttachment(
      res,
      200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      `work-hours-${project.id}.xlsx`,
      xlsx,
    );
  });

  // CSV bulk import — additive to the single-record POST below. Body:
  // `{ "csv": "workDate,hours,...\n2026-01-01,8,...\n" }`.
  router.post("/api/v1/projects/:projectId/work-hours/import.csv", async (req, ctx, res) => {
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
    const csvText = str(req.body, "csv");
    if (csvText === undefined) {
      badRequest(res, [{ path: "csv", message: "csv (string) is required" }]);
      return;
    }
    const { rows } = parseCsv(csvText);
    if (rows.length === 0) {
      badRequest(res, [{ path: "csv", message: "csv must contain at least one data row" }]);
      return;
    }
    const created: WorkHour[] = [];
    const errors: ReturnType<typeof rowErrors> = [];
    rows.forEach((row, i) => {
      const result = createWorkHour({
        id: `work-hour-${randomUUID()}`,
        organizationId: project.organizationId,
        projectId: project.id as string,
        workerId: csvStr(row, "workerId"),
        workDate: csvStr(row, "workDate") ?? "",
        hours: csvNum(row, "hours") ?? 0,
        workType: csvStr(row, "workType"),
        notes: csvStr(row, "notes"),
        createdAt: nowTs(),
      });
      if (!result.ok) {
        errors.push(...rowErrors(i + 1, result.error));
        return;
      }
      created.push(result.value);
    });
    if (errors.length > 0) {
      badRequest(res, errors);
      return;
    }
    for (const workHour of created) {
      await repositories.workHours.save(workHour);
    }
    recordAudit(
      container.auditLog,
      ctx,
      "work-hour:import",
      `projects/${project.id}/work-hours/import`,
      "success",
      { count: String(created.length) },
    );
    writeJson(res, 201, { imported: created.length, workHours: created });
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
