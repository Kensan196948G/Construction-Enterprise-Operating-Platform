/**
 * Workflow CRUD API routes.
 *
 *   GET    /api/v1/workflows            — paginated list (optional ?type=, ?status= filter)
 *   GET    /api/v1/workflows/:id        — get by id
 *   POST   /api/v1/workflows            — create
 *   PUT    /api/v1/workflows/:id        — update mutable fields
 *   DELETE /api/v1/workflows/:id        — hard delete
 *
 * Authorization: workflow:read for reads, workflow:write for mutations.
 */

import { randomUUID } from "node:crypto";
import {
  createWorkflow,
  workflowId,
  WORKFLOW_TYPES,
  WORKFLOW_STATUSES,
} from "../../domain/workflow.ts";
import type { WorkflowStep, WorkflowType, WorkflowStatus } from "../../domain/workflow.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, bodyHasKey, forbidden, noContent, notFound, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

// ---------------------------------------------------------------------------
// Workflow-specific body parsing
// ---------------------------------------------------------------------------
function parseSteps(body: unknown): WorkflowStep[] | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)["steps"];
  if (!Array.isArray(v)) return undefined;
  const result: WorkflowStep[] = [];
  for (const item of v as unknown[]) {
    if (typeof item !== "object" || item === null) return undefined;
    const it = item as Record<string, unknown>;
    const key = it["key"];
    const name = it["name"];
    const requiredPermission = it["requiredPermission"];
    if (
      typeof key !== "string" ||
      typeof name !== "string" ||
      typeof requiredPermission !== "string"
    ) {
      return undefined;
    }
    result.push({ key, name, requiredPermission });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerWorkflowRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  // ── List (with optional type/status filter) ───────────────────────────────

  router.get("/api/v1/workflows", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "read")) {
      forbidden(res, "workflow:read");
      return;
    }

    const typeFilter = req.query["type"];
    const statusFilter = req.query["status"];

    let all = await repositories.workflows.findAll();

    if (typeof typeFilter === "string" && WORKFLOW_TYPES.includes(typeFilter as WorkflowType)) {
      all = all.filter((w) => w.type === typeFilter);
    }
    if (
      typeof statusFilter === "string" &&
      WORKFLOW_STATUSES.includes(statusFilter as WorkflowStatus)
    ) {
      all = all.filter((w) => w.status === statusFilter);
    }

    const pg = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      workflows: pg.items,
      count: pg.count,
      total: pg.total,
      limit: pg.limit,
      offset: pg.offset,
    });
  });

  // ── Get by id ─────────────────────────────────────────────────────────────

  router.get("/api/v1/workflows/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "read")) {
      forbidden(res, "workflow:read");
      return;
    }
    const workflow = await repositories.workflows.findById(workflowId(req.params["id"] ?? ""));
    if (workflow === null) {
      notFound(res, "workflow");
      return;
    }
    writeJson(res, 200, workflow);
  });

  // ── Create ────────────────────────────────────────────────────────────────

  router.post("/api/v1/workflows", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "write")) {
      forbidden(res, "workflow:write");
      return;
    }

    const steps = parseSteps(req.body);
    if (steps === undefined) {
      badRequest(res, [
        { field: "steps", message: "steps must be an array of {key, name, requiredPermission}" },
      ]);
      return;
    }

    if (bodyHasKey(req.body, "id") && str(req.body, "id") === undefined) {
      badRequest(res, [{ field: "id", message: "id must be a string" }]);
      return;
    }
    if (bodyHasKey(req.body, "name") && str(req.body, "name") === undefined) {
      badRequest(res, [{ field: "name", message: "name must be a string" }]);
      return;
    }
    if (bodyHasKey(req.body, "type") && str(req.body, "type") === undefined) {
      badRequest(res, [{ field: "type", message: "type must be a string" }]);
      return;
    }
    if (bodyHasKey(req.body, "status") && str(req.body, "status") === undefined) {
      badRequest(res, [{ field: "status", message: "status must be a string" }]);
      return;
    }

    const result = createWorkflow({
      id: str(req.body, "id") ?? randomUUID(),
      name: str(req.body, "name") ?? "",
      type: (str(req.body, "type") ?? "") as WorkflowType,
      status: (str(req.body, "status") ?? "draft") as WorkflowStatus,
      steps,
    });
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await repositories.workflows.save(result.value);
    recordAudit(container.auditLog, ctx, "workflow:create", result.value.id, "success", {
      name: result.value.name,
      type: result.value.type,
      status: result.value.status,
    });
    writeJson(res, 201, result.value);
  });

  // ── Update ────────────────────────────────────────────────────────────────

  router.put("/api/v1/workflows/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "write")) {
      forbidden(res, "workflow:write");
      return;
    }

    const existing = await repositories.workflows.findById(workflowId(req.params["id"] ?? ""));
    if (existing === null) {
      notFound(res, "workflow");
      return;
    }

    const newStepsRaw = parseSteps(req.body);
    // If body contains `steps` key but it is malformed, reject.
    const bodyObj =
      typeof req.body === "object" && req.body !== null
        ? (req.body as Record<string, unknown>)
        : {};
    if ("steps" in bodyObj && newStepsRaw === undefined) {
      badRequest(res, [
        { field: "steps", message: "steps must be an array of {key, name, requiredPermission}" },
      ]);
      return;
    }
    const steps = newStepsRaw ?? [...existing.steps];

    if (bodyHasKey(req.body, "name") && str(req.body, "name") === undefined) {
      badRequest(res, [{ field: "name", message: "name must be a string" }]);
      return;
    }
    if (bodyHasKey(req.body, "status") && str(req.body, "status") === undefined) {
      badRequest(res, [{ field: "status", message: "status must be a string" }]);
      return;
    }

    const result = createWorkflow({
      id: existing.id,
      name: str(req.body, "name") ?? existing.name,
      type: existing.type,
      status: (str(req.body, "status") ?? existing.status) as WorkflowStatus,
      steps,
    });
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await repositories.workflows.save(result.value);
    recordAudit(container.auditLog, ctx, "workflow:update", existing.id, "success", {
      name: result.value.name,
      type: result.value.type,
      status: result.value.status,
    });
    writeJson(res, 200, result.value);
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  router.delete("/api/v1/workflows/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "write")) {
      forbidden(res, "workflow:write");
      return;
    }
    const existing = await repositories.workflows.findById(workflowId(req.params["id"] ?? ""));
    if (existing === null) {
      notFound(res, "workflow");
      return;
    }
    await repositories.workflows.delete(existing.id);
    recordAudit(container.auditLog, ctx, "workflow:delete", existing.id, "success", {
      name: existing.name,
    });
    noContent(res);
  });
}
