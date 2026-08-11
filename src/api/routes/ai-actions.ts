/**
 * AI action governance API (integration Y-09 / L-07).
 *
 *   GET  /api/v1/ai-actions                 — tenant-scoped, paginated list
 *   POST /api/v1/ai-actions                 — create a pending governed AI request
 *   POST /api/v1/ai-actions/:id/decision    — approve / reject a pending request
 *
 * Authorization: ai:read for reads, ai:write for creation, ai:approve for
 * decisions. Every mutation is recorded in the audit log.
 */

import { randomUUID } from "node:crypto";
import {
  AI_ACTION_DECISIONS,
  AI_OPERATION_STATUSES,
  AI_ACTION_STATUSES,
  createAiAction,
  decideAiAction,
  aiActionId,
  setAiOperationStatus,
} from "../../domain/ai-action.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerAiActionRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/ai-actions", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai", "read")) {
      forbidden(res, "ai:read");
      return;
    }
    const statusFilter = req.query["status"];
    if (
      statusFilter !== undefined &&
      !AI_ACTION_STATUSES.includes(statusFilter as (typeof AI_ACTION_STATUSES)[number])
    ) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${AI_ACTION_STATUSES.join(", ")}` },
      ]);
      return;
    }
    let items =
      ctx?.organizationId !== undefined
        ? await repositories.aiActions.findByOrganization(ctx.organizationId)
        : await repositories.aiActions.findAll();
    if (statusFilter !== undefined) {
      items = items.filter((a) => a.status === statusFilter);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      aiActions: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/ai-actions", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai", "write")) {
      forbidden(res, "ai:write");
      return;
    }
    const model = str(req.body, "model");
    const purpose = str(req.body, "purpose");
    const promptHash = str(req.body, "promptHash");
    const evidenceRefsRaw = (req.body as Record<string, unknown>)["evidenceRefs"];
    const evidenceRefs =
      Array.isArray(evidenceRefsRaw) && evidenceRefsRaw.every((r) => typeof r === "string")
        ? (evidenceRefsRaw as string[])
        : undefined;
    const inputRetentionDays = (req.body as Record<string, unknown>)["inputRetentionDays"];
    const piiSensitive = (req.body as Record<string, unknown>)["piiSensitive"];
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
    const created = createAiAction({
      id: `ai-${randomUUID()}`,
      requester: ctx?.subject ?? "system",
      ...(organizationId !== undefined ? { organizationId } : {}),
      model: model ?? "",
      purpose: purpose ?? "",
      promptHash: promptHash ?? "",
      ...(evidenceRefs !== undefined ? { evidenceRefs } : {}),
      ...(typeof inputRetentionDays === "number" ? { inputRetentionDays } : {}),
      ...(typeof piiSensitive === "boolean" ? { piiSensitive } : {}),
      ...(str(req.body, "wrongAnswerMitigation") !== undefined
        ? { wrongAnswerMitigation: str(req.body, "wrongAnswerMitigation") }
        : {}),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.aiActions.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "ai-action:create",
      `ai-actions/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { aiAction: created.value });
  });

  router.post("/api/v1/ai-actions/:id/decision", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai", "approve")) {
      forbidden(res, "ai:approve");
      return;
    }
    const action = await repositories.aiActions.findById(aiActionId(req.params["id"] ?? ""));
    if (action === null) {
      notFound(res, "ai action");
      return;
    }
    if (
      ctx?.organizationId !== undefined &&
      action.organizationId !== undefined &&
      action.organizationId !== ctx.organizationId
    ) {
      notFound(res, "ai action");
      return;
    }
    const decision = str(req.body, "decision");
    if (decision === undefined || !AI_ACTION_DECISIONS.includes(decision as never)) {
      badRequest(res, [
        {
          field: "decision",
          message: `decision must be one of: ${AI_ACTION_DECISIONS.join(", ")}`,
        },
      ]);
      return;
    }
    const note = str(req.body, "note");
    const decided = decideAiAction(action, {
      decision: decision as never,
      decidedBy: ctx?.subject ?? "system",
      decidedAt: nowTs(),
      ...(note !== undefined ? { note } : {}),
    });
    if (!decided.ok) {
      badRequest(res, decided.error);
      return;
    }
    await repositories.aiActions.save(decided.value);
    recordAudit(container.auditLog, ctx, "ai-action:decide", `ai-actions/${action.id}`, "success", {
      decision: decided.value.status,
    });
    writeJson(res, 200, { aiAction: decided.value });
  });

  router.post("/api/v1/ai-actions/:id/status", async (req, ctx, res) => {
    if (!hasPermission(ctx, "ai", "approve")) {
      forbidden(res, "ai:approve");
      return;
    }
    const action = await repositories.aiActions.findById(aiActionId(req.params["id"] ?? ""));
    if (action === null) {
      notFound(res, "ai action");
      return;
    }
    if (
      ctx?.organizationId !== undefined &&
      action.organizationId !== undefined &&
      action.organizationId !== ctx.organizationId
    ) {
      notFound(res, "ai action");
      return;
    }
    const status = str(req.body, "status");
    if (status === undefined || !AI_OPERATION_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${AI_OPERATION_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const reason = str(req.body, "reason");
    const updated = setAiOperationStatus(action, {
      status: status as never,
      actor: ctx?.subject ?? "system",
      at: nowTs(),
      ...(reason !== undefined ? { reason } : {}),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.aiActions.save(updated.value);
    recordAudit(container.auditLog, ctx, "ai-action:status", `ai-actions/${action.id}`, "success", {
      operationStatus: updated.value.operationStatus,
    });
    writeJson(res, 200, { aiAction: updated.value });
  });
}
