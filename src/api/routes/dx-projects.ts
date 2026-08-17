/**
 * DX project portfolio API (DX-Project-Portfolio-Atlas).
 */

import { randomUUID } from "node:crypto";
import {
  DX_LIFECYCLE_STATES,
  DX_PORTFOLIO_TYPES,
  createDxProject,
  dxProjectId,
  updateDxProject,
} from "../../domain/dx-project.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerDxProjectRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/dx-projects", async (req, ctx, res) => {
    if (!hasPermission(ctx, "dx-project", "read")) {
      forbidden(res, "dx-project:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.dxProjects.findByOrganization(orgId)
        : await repositories.dxProjects.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      dxProjects: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/dx-projects", async (req, ctx, res) => {
    if (!hasPermission(ctx, "dx-project", "write")) {
      forbidden(res, "dx-project:write");
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
    const portfolioType = str(req.body, "portfolioType");
    if (portfolioType !== undefined && !DX_PORTFOLIO_TYPES.includes(portfolioType as never)) {
      badRequest(res, [
        {
          field: "portfolioType",
          message: `portfolioType must be one of: ${DX_PORTFOLIO_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const lifecycleState = str(req.body, "lifecycleState");
    if (lifecycleState !== undefined && !DX_LIFECYCLE_STATES.includes(lifecycleState as never)) {
      badRequest(res, [
        {
          field: "lifecycleState",
          message: `lifecycleState must be one of: ${DX_LIFECYCLE_STATES.join(", ")}`,
        },
      ]);
      return;
    }
    const companyAssetUse = str(req.body, "companyAssetUse");
    if (
      companyAssetUse !== undefined &&
      !["yes", "no", "review"].includes(companyAssetUse as never)
    ) {
      badRequest(res, [
        { field: "companyAssetUse", message: "companyAssetUse must be one of: yes, no, review" },
      ]);
      return;
    }
    const slug = str(req.body, "slug") ?? "";
    if (slug && (await repositories.dxProjects.findBySlug(slug)) !== null) {
      writeJson(res, 409, { error: "Conflict", message: "slug already exists" });
      return;
    }
    const created = createDxProject({
      id: `dx-project-${randomUUID()}`,
      organizationId,
      slug,
      nameJa: str(req.body, "nameJa") ?? "",
      nameEn: str(req.body, "nameEn"),
      shortName: str(req.body, "shortName"),
      summary: str(req.body, "summary"),
      portfolioType: portfolioType as never,
      companyAssetUse: companyAssetUse as never,
      domainCode: str(req.body, "domainCode"),
      lifecycleState: lifecycleState as never,
      importance: num(req.body, "importance"),
      ownerTeam: str(req.body, "ownerTeam"),
      approvedProgress: num(req.body, "approvedProgress"),
      progressMilestone: str(req.body, "progressMilestone"),
      progressEvidenceUrl: str(req.body, "progressEvidenceUrl"),
      nextReviewAt: str(req.body, "nextReviewAt"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    try {
      await repositories.dxProjects.save(created.value);
    } catch (e) {
      if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) {
        writeJson(res, 409, { error: "Conflict", message: "slug already exists" });
        return;
      }
      throw e;
    }
    recordAudit(
      container.auditLog,
      ctx,
      "dx-project:create",
      `dx-projects/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { dxProject: created.value });
  });

  router.get("/api/v1/dx-projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "dx-project", "read")) {
      forbidden(res, "dx-project:read");
      return;
    }
    const project = await repositories.dxProjects.findById(dxProjectId(req.params["id"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "dx project");
      return;
    }
    writeJson(res, 200, { dxProject: project });
  });

  router.put("/api/v1/dx-projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "dx-project", "write")) {
      forbidden(res, "dx-project:write");
      return;
    }
    const existing = await repositories.dxProjects.findById(dxProjectId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "dx project");
      return;
    }
    const portfolioType = str(req.body, "portfolioType");
    if (portfolioType !== undefined && !DX_PORTFOLIO_TYPES.includes(portfolioType as never)) {
      badRequest(res, [
        {
          field: "portfolioType",
          message: `portfolioType must be one of: ${DX_PORTFOLIO_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const lifecycleState = str(req.body, "lifecycleState");
    if (lifecycleState !== undefined && !DX_LIFECYCLE_STATES.includes(lifecycleState as never)) {
      badRequest(res, [
        {
          field: "lifecycleState",
          message: `lifecycleState must be one of: ${DX_LIFECYCLE_STATES.join(", ")}`,
        },
      ]);
      return;
    }
    const companyAssetUse = str(req.body, "companyAssetUse");
    if (
      companyAssetUse !== undefined &&
      !["yes", "no", "review"].includes(companyAssetUse as never)
    ) {
      badRequest(res, [
        { field: "companyAssetUse", message: "companyAssetUse must be one of: yes, no, review" },
      ]);
      return;
    }
    const updated = updateDxProject(existing, {
      nameJa: str(req.body, "nameJa"),
      nameEn: str(req.body, "nameEn"),
      shortName: str(req.body, "shortName"),
      summary: str(req.body, "summary"),
      portfolioType: portfolioType as never,
      companyAssetUse: companyAssetUse as never,
      domainCode: str(req.body, "domainCode"),
      lifecycleState: lifecycleState as never,
      importance: num(req.body, "importance"),
      ownerTeam: str(req.body, "ownerTeam"),
      approvedProgress: num(req.body, "approvedProgress"),
      progressMilestone: str(req.body, "progressMilestone"),
      progressEvidenceUrl: str(req.body, "progressEvidenceUrl"),
      nextReviewAt: str(req.body, "nextReviewAt"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.dxProjects.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "dx-project:update",
      `dx-projects/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { dxProject: updated.value });
  });

  router.delete("/api/v1/dx-projects/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "dx-project", "write")) {
      forbidden(res, "dx-project:write");
      return;
    }
    const existing = await repositories.dxProjects.findById(dxProjectId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "dx project");
      return;
    }
    await repositories.dxProjects.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "dx-project:delete",
      `dx-projects/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
