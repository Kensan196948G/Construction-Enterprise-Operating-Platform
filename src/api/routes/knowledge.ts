/**
 * Knowledge article API (ServiceHub S-06).
 *
 * AI-generated articles require a governed AI action (`aiGenerated: true` +
 * `aiActionId`), tying knowledge ingestion into the AI Gateway approval trail.
 */

import { randomUUID } from "node:crypto";
import {
  KNOWLEDGE_CATEGORIES,
  createKnowledgeArticle,
  knowledgeId,
} from "../../domain/knowledge.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, bool, forbidden, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerKnowledgeRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/knowledge", async (req, ctx, res) => {
    if (!hasPermission(ctx, "knowledge", "read")) {
      forbidden(res, "knowledge:read");
      return;
    }
    let items =
      ctx?.organizationId !== undefined
        ? await repositories.knowledgeArticles.findByOrganization(ctx.organizationId)
        : await repositories.knowledgeArticles.findAll();
    const category = req.query["category"];
    if (category !== undefined) {
      if (!KNOWLEDGE_CATEGORIES.includes(category as never)) {
        badRequest(res, [
          {
            field: "category",
            message: `category must be one of: ${KNOWLEDGE_CATEGORIES.join(", ")}`,
          },
        ]);
        return;
      }
      items = items.filter((k) => k.category === category);
    }
    const q = (req.query["q"] ?? "").toLowerCase();
    if (q !== "") {
      items = items.filter(
        (k) =>
          k.title.toLowerCase().includes(q) ||
          k.content.toLowerCase().includes(q) ||
          k.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      knowledgeArticles: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/knowledge", async (req, ctx, res) => {
    if (!hasPermission(ctx, "knowledge", "write")) {
      forbidden(res, "knowledge:write");
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
    const category = str(req.body, "category");
    if (category !== undefined && !KNOWLEDGE_CATEGORIES.includes(category as never)) {
      badRequest(res, [
        {
          field: "category",
          message: `category must be one of: ${KNOWLEDGE_CATEGORIES.join(", ")}`,
        },
      ]);
      return;
    }
    const aiGenerated = bool(req.body, "aiGenerated") ?? false;
    const aiActionId = str(req.body, "aiActionId");
    if (aiGenerated && aiActionId === undefined) {
      badRequest(res, [
        { field: "aiActionId", message: "aiActionId is required when aiGenerated is true" },
      ]);
      return;
    }
    if (aiGenerated && aiActionId !== undefined) {
      const action = await repositories.aiActions.findById(aiActionId as never);
      if (action === null || action.status !== "approved") {
        badRequest(res, [
          { field: "aiActionId", message: "aiActionId must reference an approved AI action" },
        ]);
        return;
      }
    }
    const tags = Array.isArray((req.body as Record<string, unknown> | undefined)?.["tags"])
      ? ((req.body as Record<string, unknown>)["tags"] as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : undefined;
    const created = createKnowledgeArticle({
      id: `knowledge-${randomUUID()}`,
      organizationId,
      title: str(req.body, "title") ?? "",
      content: str(req.body, "content") ?? "",
      category: category as never,
      tags,
      isPublished: bool(req.body, "isPublished"),
      aiGenerated,
      aiActionId,
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.knowledgeArticles.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "knowledge:create",
      `knowledge/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { knowledgeArticle: created.value });
  });

  router.get("/api/v1/knowledge/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "knowledge", "read")) {
      forbidden(res, "knowledge:read");
      return;
    }
    const article = await repositories.knowledgeArticles.findById(
      knowledgeId(req.params["id"] ?? ""),
    );
    if (
      article === null ||
      (ctx?.organizationId !== undefined && article.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "knowledge article");
      return;
    }
    writeJson(res, 200, { knowledgeArticle: article });
  });

  router.delete("/api/v1/knowledge/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "knowledge", "write")) {
      forbidden(res, "knowledge:write");
      return;
    }
    const article = await repositories.knowledgeArticles.findById(
      knowledgeId(req.params["id"] ?? ""),
    );
    if (
      article === null ||
      (ctx?.organizationId !== undefined && article.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "knowledge article");
      return;
    }
    await repositories.knowledgeArticles.delete(article.id);
    recordAudit(container.auditLog, ctx, "knowledge:delete", `knowledge/${article.id}`, "success");
    writeJson(res, 200, { deleted: true });
  });
}
