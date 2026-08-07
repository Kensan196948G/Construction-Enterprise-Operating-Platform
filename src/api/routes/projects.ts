/**
 * Construction project API (ServiceHub S-01).
 *
 *   GET    /api/v1/projects          — tenant-scoped, paginated list
 *   POST   /api/v1/projects          — create a project
 *   GET    /api/v1/projects/:id      — project detail
 *   PATCH  /api/v1/projects/:id      — update a project
 *   DELETE /api/v1/projects/:id      — delete a project (audited)
 *
 * Authorization: project:read for reads, project:write for mutations.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { PROJECT_STATUSES, createProject, projectId, updateProject } from "../../domain/project.ts";
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

function num(body: unknown, key: string): number | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "number" ? v : undefined;
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "project not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerProjectRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects", async (req, ctx, res) => {
    if (!hasPermission(ctx, "project", "read")) {
      forbidden(res, "project:read");
      return;
    }
    const statusFilter = req.query["status"];
    if (statusFilter !== undefined && !PROJECT_STATUSES.includes(statusFilter as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${PROJECT_STATUSES.join(", ")}` },
      ]);
      return;
    }
    let items =
      ctx?.organizationId !== undefined
        ? await repositories.projects.findByOrganization(ctx.organizationId)
        : await repositories.projects.findAll();
    if (statusFilter !== undefined) {
      items = items.filter((p) => p.status === statusFilter);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      projects: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects", async (req, ctx, res) => {
    if (!hasPermission(ctx, "project", "write")) {
      forbidden(res, "project:write");
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
    const projectCode = str(req.body, "projectCode") ?? "";
    const duplicate = await repositories.projects.findByCode(projectCode);
    if (duplicate !== null) {
      badRequest(res, [{ field: "projectCode", message: "projectCode already exists" }]);
      return;
    }
    const created = createProject({
      id: `project-${randomUUID()}`,
      organizationId,
      projectCode,
      name: str(req.body, "name") ?? "",
      description: str(req.body, "description"),
      clientName: str(req.body, "clientName"),
      siteAddress: str(req.body, "siteAddress"),
      status: str(req.body, "status") as never,
      startDate: str(req.body, "startDate"),
      endDate: str(req.body, "endDate"),
      budget: num(req.body, "budget"),
      managerId: str(req.body, "managerId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.projects.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "project:create",
      `projects/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { project: created.value });
  });

  router.get("/api/v1/projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "project", "read")) {
      forbidden(res, "project:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["id"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { project });
  });

  router.patch("/api/v1/projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "project", "write")) {
      forbidden(res, "project:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["id"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    const updated = updateProject(project, {
      name: str(req.body, "name"),
      description: str(req.body, "description"),
      clientName: str(req.body, "clientName"),
      siteAddress: str(req.body, "siteAddress"),
      status: str(req.body, "status") as never,
      startDate: str(req.body, "startDate"),
      endDate: str(req.body, "endDate"),
      budget: num(req.body, "budget"),
      managerId: str(req.body, "managerId"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.projects.save(updated.value);
    recordAudit(container.auditLog, ctx, "project:update", `projects/${project.id}`, "success");
    writeJson(res, 200, { project: updated.value });
  });

  router.delete("/api/v1/projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "project", "write")) {
      forbidden(res, "project:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["id"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    await repositories.projects.delete(project.id);
    recordAudit(container.auditLog, ctx, "project:delete", `projects/${project.id}`, "success");
    writeJson(res, 200, { deleted: true });
  });
}
