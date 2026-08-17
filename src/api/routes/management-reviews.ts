/**
 * Management review API (Civil-Construction-Management-Platform マネジメントレビュー).
 */

import { randomUUID } from "node:crypto";
import {
  MANAGEMENT_REVIEW_STATUSES,
  createManagementReview,
  managementReviewId,
  updateManagementReview,
} from "../../domain/management-review.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerManagementReviewRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/management-reviews", async (req, ctx, res) => {
    if (!hasPermission(ctx, "management-review", "read")) {
      forbidden(res, "management-review:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.managementReviews.findByOrganization(orgId)
        : await repositories.managementReviews.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      managementReviews: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/management-reviews", async (req, ctx, res) => {
    if (!hasPermission(ctx, "management-review", "write")) {
      forbidden(res, "management-review:write");
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
    if (status !== undefined && !MANAGEMENT_REVIEW_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${MANAGEMENT_REVIEW_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createManagementReview({
      id: `management-review-${randomUUID()}`,
      organizationId,
      title: str(req.body, "title") ?? "",
      status: status as never,
      reviewDate: str(req.body, "reviewDate") ?? "",
      nextReviewDate: str(req.body, "nextReviewDate"),
      agenda: str(req.body, "agenda"),
      outcomes: str(req.body, "outcomes"),
      isoClause: str(req.body, "isoClause"),
      facilitatorId: str(req.body, "facilitatorId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.managementReviews.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "management-review:create",
      `management-reviews/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { managementReview: created.value });
  });

  router.get("/api/v1/management-reviews/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "management-review", "read")) {
      forbidden(res, "management-review:read");
      return;
    }
    const review = await repositories.managementReviews.findById(
      managementReviewId(req.params["id"] ?? ""),
    );
    if (
      review === null ||
      (ctx?.organizationId !== undefined && review.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "management review");
      return;
    }
    writeJson(res, 200, { managementReview: review });
  });

  router.put("/api/v1/management-reviews/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "management-review", "write")) {
      forbidden(res, "management-review:write");
      return;
    }
    const existing = await repositories.managementReviews.findById(
      managementReviewId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "management review");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !MANAGEMENT_REVIEW_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${MANAGEMENT_REVIEW_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const updated = updateManagementReview(existing, {
      title: str(req.body, "title"),
      status: status as never,
      reviewDate: str(req.body, "reviewDate"),
      nextReviewDate: str(req.body, "nextReviewDate"),
      agenda: str(req.body, "agenda"),
      outcomes: str(req.body, "outcomes"),
      isoClause: str(req.body, "isoClause"),
      facilitatorId: str(req.body, "facilitatorId"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.managementReviews.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "management-review:update",
      `management-reviews/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { managementReview: updated.value });
  });

  router.delete("/api/v1/management-reviews/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "management-review", "write")) {
      forbidden(res, "management-review:write");
      return;
    }
    const existing = await repositories.managementReviews.findById(
      managementReviewId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "management review");
      return;
    }
    await repositories.managementReviews.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "management-review:delete",
      `management-reviews/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
