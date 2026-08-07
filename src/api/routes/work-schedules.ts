/**
 * Site work schedule API (Enterprise-OS E-02).
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { projectId } from "../../domain/project.ts";
import {
  WORK_SCHEDULE_STATUSES,
  createWorkSchedule,
  workScheduleId,
} from "../../domain/work-schedule.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { AppContainer } from "../types.ts";

function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "work schedule not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerWorkScheduleRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/work-schedules", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-schedule", "read")) {
      forbidden(res, "work-schedule:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    const page = paginate(
      await repositories.workSchedules.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      workSchedules: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/work-schedules", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-schedule", "write")) {
      forbidden(res, "work-schedule:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !WORK_SCHEDULE_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${WORK_SCHEDULE_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const created = createWorkSchedule({
      id: `work-schedule-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      workDate: str(req.body, "workDate") ?? "",
      title: str(req.body, "title") ?? "",
      assignee: str(req.body, "assignee"),
      status: status as never,
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.workSchedules.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "work-schedule:create",
      `work-schedules/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { workSchedule: created.value });
  });

  router.get("/api/v1/work-schedules/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-schedule", "read")) {
      forbidden(res, "work-schedule:read");
      return;
    }
    const schedule = await repositories.workSchedules.findById(
      workScheduleId(req.params["id"] ?? ""),
    );
    if (
      schedule === null ||
      (ctx?.organizationId !== undefined && schedule.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { workSchedule: schedule });
  });
}
