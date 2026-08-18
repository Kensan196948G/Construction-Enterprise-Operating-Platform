/**
 * AI build project API (Civil-Construction-AI-Build-Platform 案件生成).
 */

import { randomUUID } from "node:crypto";
import {
  AI_BUILD_PROJECT_STATUSES,
  createAiBuildProject,
  aiBuildProjectId,
  updateAiBuildProject,
} from "../../domain/ai-build-project.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, bool, forbidden, noContent, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerAiBuildProjectRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/ai-build-projects", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai-build-project", "read")) {
      forbidden(res, "ai-build-project:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.aiBuildProjects.findByOrganization(orgId)
        : await repositories.aiBuildProjects.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      aiBuildProjects: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/ai-build-projects", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai-build-project", "write")) {
      forbidden(res, "ai-build-project:write");
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
    if (status !== undefined && !AI_BUILD_PROJECT_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${AI_BUILD_PROJECT_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createAiBuildProject({
      id: `ai-build-project-${randomUUID()}`,
      organizationId,
      projectId: str(req.body, "projectId"),
      name: str(req.body, "name") ?? "",
      theme: str(req.body, "theme") ?? "",
      purpose: str(req.body, "purpose"),
      scope: str(req.body, "scope"),
      targetUsers: str(req.body, "targetUsers"),
      templateVersion: str(req.body, "templateVersion"),
      status: status as never,
      placeholderChecked: bool(req.body, "placeholderChecked"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.aiBuildProjects.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "ai-build-project:create",
      `ai-build-projects/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { aiBuildProject: created.value });
  });

  router.get("/api/v1/ai-build-projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai-build-project", "read")) {
      forbidden(res, "ai-build-project:read");
      return;
    }
    const project = await repositories.aiBuildProjects.findById(
      aiBuildProjectId(req.params["id"] ?? ""),
    );
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "ai build project");
      return;
    }
    writeJson(res, 200, { aiBuildProject: project });
  });

  router.put("/api/v1/ai-build-projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai-build-project", "write")) {
      forbidden(res, "ai-build-project:write");
      return;
    }
    const existing = await repositories.aiBuildProjects.findById(
      aiBuildProjectId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "ai build project");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !AI_BUILD_PROJECT_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${AI_BUILD_PROJECT_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateAiBuildProject(existing, {
      name: str(req.body, "name"),
      theme: str(req.body, "theme"),
      purpose: str(req.body, "purpose"),
      scope: str(req.body, "scope"),
      targetUsers: str(req.body, "targetUsers"),
      templateVersion: str(req.body, "templateVersion"),
      status: status as never,
      placeholderChecked: bool(req.body, "placeholderChecked"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.aiBuildProjects.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "ai-build-project:update",
      `ai-build-projects/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { aiBuildProject: updated.value });
  });

  router.delete("/api/v1/ai-build-projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai-build-project", "write")) {
      forbidden(res, "ai-build-project:write");
      return;
    }
    const existing = await repositories.aiBuildProjects.findById(
      aiBuildProjectId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "ai build project");
      return;
    }
    await repositories.aiBuildProjects.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "ai-build-project:delete",
      `ai-build-projects/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
