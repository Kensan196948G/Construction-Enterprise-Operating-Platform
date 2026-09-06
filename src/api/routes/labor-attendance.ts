/**
 * Labor attendance API (HR — issue #74).
 *
 * Tracks day-by-day attendance (自社 / 協力会社) nested under a project, with an
 * approval lifecycle (draft → submitted → approved/rejected) and a way to post
 * the resulting labor cost into the cost aggregation domain as a CostRecord.
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import {
  ATTENDANCE_STATUSES,
  WORKER_AFFILIATIONS,
  createLaborAttendance,
  laborAttendanceId,
  transitionLaborAttendance,
  updateLaborAttendance,
} from "../../domain/labor-attendance.ts";
import { createCostRecordFromLaborAttendance } from "../../domain/cost.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerLaborAttendanceRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/labor-attendance", async (req, ctx, res) => {
    if (!hasPermission(ctx, "labor-attendance", "read")) {
      forbidden(res, "labor-attendance:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "labor attendance");
      return;
    }
    let items = await repositories.laborAttendances.findByProject(project.id);
    const statusFilter = req.query["status"];
    if (statusFilter !== undefined) {
      if (!ATTENDANCE_STATUSES.includes(statusFilter as never)) {
        badRequest(res, [
          { field: "status", message: `status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` },
        ]);
        return;
      }
      items = items.filter((a) => a.status === statusFilter);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      laborAttendances: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/labor-attendance", async (req, ctx, res) => {
    if (!hasPermission(ctx, "labor-attendance", "write")) {
      forbidden(res, "labor-attendance:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "labor attendance");
      return;
    }
    const affiliation = str(req.body, "affiliation");
    if (affiliation !== undefined && !WORKER_AFFILIATIONS.includes(affiliation as never)) {
      badRequest(res, [
        {
          field: "affiliation",
          message: `affiliation must be one of: ${WORKER_AFFILIATIONS.join(", ")}`,
        },
      ]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !ATTENDANCE_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const created = createLaborAttendance({
      id: `labor-attendance-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      workerName: str(req.body, "workerName") ?? "",
      affiliation: affiliation as never,
      subcontractorName: str(req.body, "subcontractorName"),
      attendanceDate: str(req.body, "attendanceDate") ?? "",
      dailyRate: num(req.body, "dailyRate") ?? 0,
      overtimeHours: num(req.body, "overtimeHours"),
      status: status as never,
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.laborAttendances.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "labor-attendance:create",
      `labor-attendance/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { laborAttendance: created.value });
  });

  router.get("/api/v1/labor-attendance/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "labor-attendance", "read")) {
      forbidden(res, "labor-attendance:read");
      return;
    }
    const record = await repositories.laborAttendances.findById(
      laborAttendanceId(req.params["id"] ?? ""),
    );
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "labor attendance");
      return;
    }
    writeJson(res, 200, { laborAttendance: record });
  });

  router.patch("/api/v1/labor-attendance/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "labor-attendance", "write")) {
      forbidden(res, "labor-attendance:write");
      return;
    }
    const record = await repositories.laborAttendances.findById(
      laborAttendanceId(req.params["id"] ?? ""),
    );
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "labor attendance");
      return;
    }
    const affiliation = str(req.body, "affiliation");
    if (affiliation !== undefined && !WORKER_AFFILIATIONS.includes(affiliation as never)) {
      badRequest(res, [
        {
          field: "affiliation",
          message: `affiliation must be one of: ${WORKER_AFFILIATIONS.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateLaborAttendance(record, {
      workerName: str(req.body, "workerName"),
      affiliation: affiliation as never,
      subcontractorName: str(req.body, "subcontractorName"),
      dailyRate: num(req.body, "dailyRate"),
      overtimeHours: num(req.body, "overtimeHours"),
      notes: str(req.body, "notes"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.laborAttendances.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "labor-attendance:update",
      `labor-attendance/${record.id}`,
      "success",
    );
    writeJson(res, 200, { laborAttendance: updated.value });
  });

  router.post("/api/v1/labor-attendance/:id/transition", async (req, ctx, res) => {
    if (!hasPermission(ctx, "labor-attendance", "write")) {
      forbidden(res, "labor-attendance:write");
      return;
    }
    const record = await repositories.laborAttendances.findById(
      laborAttendanceId(req.params["id"] ?? ""),
    );
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "labor attendance");
      return;
    }
    const status = str(req.body, "status");
    if (status === undefined || !ATTENDANCE_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const transitioned = transitionLaborAttendance(record, status as never, nowTs());
    if (!transitioned.ok) {
      badRequest(res, transitioned.error);
      return;
    }
    await repositories.laborAttendances.save(transitioned.value);
    recordAudit(
      container.auditLog,
      ctx,
      "labor-attendance:transition",
      `labor-attendance/${record.id}`,
      "success",
      { status: transitioned.value.status },
    );
    writeJson(res, 200, { laborAttendance: transitioned.value });
  });

  /**
   * Fold this attendance record's labor cost into project cost aggregation as
   * a CostRecord (additive to cost.ts — see `createCostRecordFromLaborAttendance`).
   * Requires both labor-attendance:write and cost:write, since it creates a
   * record in the cost domain.
   */
  router.post("/api/v1/labor-attendance/:id/post-to-cost", async (req, ctx, res) => {
    if (!hasPermission(ctx, "labor-attendance", "write") || !hasPermission(ctx, "cost", "write")) {
      forbidden(res, "labor-attendance:write and cost:write");
      return;
    }
    const record = await repositories.laborAttendances.findById(
      laborAttendanceId(req.params["id"] ?? ""),
    );
    if (
      record === null ||
      (ctx?.organizationId !== undefined && record.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "labor attendance");
      return;
    }
    const overtimeHourlyRate = num(req.body, "overtimeHourlyRate");
    const overtimeMultiplier = num(req.body, "overtimeMultiplier");
    const costRecord = createCostRecordFromLaborAttendance(
      record,
      `cost-labor-${record.id}`,
      nowTs(),
      {
        ...(overtimeHourlyRate !== undefined ? { overtimeHourlyRate } : {}),
        ...(overtimeMultiplier !== undefined ? { overtimeMultiplier } : {}),
      },
    );
    if (!costRecord.ok) {
      badRequest(res, costRecord.error);
      return;
    }
    await repositories.costRecords.save(costRecord.value);
    recordAudit(
      container.auditLog,
      ctx,
      "labor-attendance:post-to-cost",
      `labor-attendance/${record.id}`,
      "success",
      { costRecordId: costRecord.value.id },
    );
    writeJson(res, 201, { costRecord: costRecord.value });
  });
}
