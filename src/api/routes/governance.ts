// FILE: src/api/routes/governance.ts
/**
 * Governance API routes.
 *
 * Exposes the Governance Core (policy evaluation + tamper-evident audit log)
 * over HTTP so external systems can perform access checks and retrieve audit
 * evidence without embedding the evaluation engine themselves.
 *
 * Also provides full Policy CRUD so the policy set can be managed at runtime
 * without restarting the server.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { createAuditEvent } from "../../domain/audit-event.ts";
import { createPolicy, policyId } from "../../domain/policy.ts";
import type { PolicyEffect, PolicyCondition } from "../../domain/policy.ts";
import type { Permission } from "../../domain/role.ts";
import { evaluateAccess, resolvePermissions } from "../../governance/policy-engine.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { parsePagination, paginate } from "../pagination.ts";
import type { AppContainer } from "../types.ts";

const AUDIT_LIMIT_DEFAULT = 50;
const AUDIT_LIMIT_MAX = 200;

/**
 * Check whether a context's permissions include a specific resource:action grant.
 * Wildcards supported: `*:*`, `*:<action>`, `<resource>:*`.
 */
export function hasPermission(
  ctx: { readonly permissions: readonly Permission[] } | null,
  resource: string,
  action: string,
): boolean {
  return (
    ctx?.permissions.some(
      (p) =>
        p === `${resource}:${action}` ||
        p === `${resource}:*` ||
        p === `*:${action}` ||
        p === "*:*",
    ) ?? false
  );
}

/**
 * Tenant-scope check: a globally-scoped credential may access any organization;
 * an organization-scoped credential may only access its own organization.
 */
export function canAccessOrganization(
  ctx: { readonly organizationId?: string } | null,
  orgId: string | undefined,
): boolean {
  if (ctx === null) return false;
  if (ctx.organizationId === undefined) return true;
  return ctx.organizationId === orgId;
}

/** True when a single target permission is covered by the grantor's permissions. */
function coversPermission(
  grantor: readonly Permission[],
  target: string,
): boolean {
  const colonIdx = target.indexOf(":");
  if (colonIdx === -1) return false;
  const resource = target.slice(0, colonIdx);
  const action = target.slice(colonIdx + 1);
  return grantor.some(
    (p) =>
      p === "*:*" ||
      p === `${resource}:*` ||
      p === `*:${action}` ||
      p === target,
  );
}

/**
 * Anti-escalation check: the grantor must already hold every permission they
 * are about to grant (wildcards count). Prevents `user:write`/`role:write`
 * holders from minting `*:*` roles or assigning roles above their own level.
 */
export function coversPermissions(
  grantor: readonly Permission[],
  target: readonly Permission[],
): boolean {
  return target.every((t) => coversPermission(grantor, String(t)));
}

interface EvaluateBody {
  readonly subject?: unknown;
  readonly resource?: unknown;
  readonly action?: unknown;
  readonly roleIds?: unknown;
  readonly attributes?: unknown;
}

/** Narrow an arbitrary value to `Record<string, string>`, or return null. */
function asStringRecord(value: unknown): Record<string, string> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val !== "string") {
      return null;
    }
    out[key] = val;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Policy body helpers
// ---------------------------------------------------------------------------

function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function strArr(body: unknown, key: string): string[] | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  if (!Array.isArray(v)) return undefined;
  if (!(v as unknown[]).every((x) => typeof x === "string")) return undefined;
  return v as string[];
}

function bodyHasKey(body: unknown, key: string): boolean {
  return typeof body === "object" && body !== null && key in (body as Record<string, unknown>);
}

function conditionsArr(body: unknown, key: string): PolicyCondition[] | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  if (!Array.isArray(v)) return undefined;
  const result: PolicyCondition[] = [];
  for (const item of v as unknown[]) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>)["attribute"] !== "string" ||
      typeof (item as Record<string, unknown>)["equals"] !== "string"
    ) {
      return undefined;
    }
    result.push({
      attribute: (item as Record<string, unknown>)["attribute"] as string,
      equals: (item as Record<string, unknown>)["equals"] as string,
    });
  }
  return result;
}

function notFound(res: ServerResponse, resource: string): void {
  writeJson(res, 404, { error: "Not Found", message: `${resource} not found` });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function noContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerGovernanceRoutes(router: Router, container: AppContainer): void {
  // ── Governance evaluation ─────────────────────────────────────────────────

  // POST /api/v1/governance/evaluate  (requires governance:evaluate or wildcard permission)
  router.post("/api/v1/governance/evaluate", async (req, ctx, res) => {
    if (!hasPermission(ctx, "governance", "evaluate")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'governance:evaluate' permission" });
      return;
    }
    const body = (req.body ?? {}) as EvaluateBody;
    const { subject, resource, action, roleIds, attributes } = body;

    if (typeof subject !== "string" || subject.length === 0) {
      writeJson(res, 400, { error: "Bad Request", message: "'subject' must be a non-empty string" });
      return;
    }
    if (typeof resource !== "string" || resource.length === 0) {
      writeJson(res, 400, { error: "Bad Request", message: "'resource' must be a non-empty string" });
      return;
    }
    if (typeof action !== "string" || action.length === 0) {
      writeJson(res, 400, { error: "Bad Request", message: "'action' must be a non-empty string" });
      return;
    }
    if (!Array.isArray(roleIds) || roleIds.some((r) => typeof r !== "string")) {
      writeJson(res, 400, { error: "Bad Request", message: "'roleIds' must be an array of strings" });
      return;
    }

    let parsedAttributes: Record<string, string> | undefined;
    if (attributes !== undefined && attributes !== null) {
      const attrs = asStringRecord(attributes);
      if (attrs === null) {
        writeJson(res, 400, {
          error: "Bad Request",
          message: "'attributes' must be an object of string values",
        });
        return;
      }
      parsedAttributes = attrs;
    }

    const requestedRoleIds = roleIds as readonly string[];
    const [allRoles, policies] = await Promise.all([
      container.repositories.roles.findAll(),
      container.repositories.policies.findAll(),
    ]);
    const matchedRoles = allRoles.filter((role) => requestedRoleIds.includes(role.id));
    const permissions: readonly Permission[] = resolvePermissions(matchedRoles);

    const decision = evaluateAccess({
      request: {
        subject,
        resource,
        action,
        ...(parsedAttributes !== undefined ? { attributes: parsedAttributes } : {}),
      },
      permissions,
      policies,
    });

    // Use the authenticated API key's subject as actor to prevent audit log spoofing.
    // The evaluated subject is recorded in metadata for traceability.
    const callerSubject = ctx?.subject ?? "anonymous";
    const auditEvent = createAuditEvent({
      id: randomUUID(),
      at: new Date().toISOString() as IsoTimestamp,
      actor: callerSubject,
      action: "governance:evaluate",
      resource,
      outcome: decision.decision === "allow" ? "success" : "denied",
      metadata: {
        evaluatedSubject: subject,
        requestedAction: action,
        decision: decision.decision,
        reason: decision.reason,
      },
    });
    if (auditEvent.ok) {
      container.auditLog.append(auditEvent.value);
    } else {
      // Audit failure must not be silent — log for investigation without exposing request details.
      console.error("[governance] failed to create audit event:", auditEvent.error);
    }

    writeJson(res, 200, {
      decision: decision.decision,
      reason: decision.reason,
      matchedPolicyIds: decision.matchedPolicyIds,
      subject,
      resource,
      action,
    });
  });

  // ── Audit log ─────────────────────────────────────────────────────────────

  // GET /api/v1/governance/audit?limit=&offset=  (requires audit:read or wildcard permission)
  router.get("/api/v1/governance/audit", async (req, ctx, res) => {
    if (!hasPermission(ctx, "audit", "read")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'audit:read' permission" });
      return;
    }
    const rawLimit = req.query["limit"];
    const parsed = rawLimit !== undefined ? Number.parseInt(rawLimit, 10) : AUDIT_LIMIT_DEFAULT;
    const limit =
      Number.isNaN(parsed) || parsed < 1 ? AUDIT_LIMIT_DEFAULT : Math.min(parsed, AUDIT_LIMIT_MAX);
    const rawOffset = req.query["offset"];
    const parsedOffset = rawOffset !== undefined ? Number.parseInt(rawOffset, 10) : 0;
    const offset = Number.isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;

    const allEntries = container.auditLog.entries;
    const end = Math.max(0, allEntries.length - offset);
    const entries = allEntries.slice(Math.max(0, end - limit), end);

    writeJson(res, 200, {
      entries,
      count: entries.length,
      total: allEntries.length,
      limit,
      offset,
    });
  });

  // ── Policy CRUD ───────────────────────────────────────────────────────────

  // GET /api/v1/governance/policies?limit=&offset=  (requires policy:read or wildcard)
  router.get("/api/v1/governance/policies", async (req, ctx, res) => {
    if (!hasPermission(ctx, "policy", "read")) {
      forbidden(res, "policy:read");
      return;
    }
    const all = await container.repositories.policies.findAll();
    const pg = paginate(all, parsePagination(req.query));
    writeJson(res, 200, { policies: pg.items, count: pg.count, total: pg.total, limit: pg.limit, offset: pg.offset });
  });

  // GET /api/v1/governance/policies/:id  (requires policy:read or wildcard)
  router.get("/api/v1/governance/policies/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "policy", "read")) { forbidden(res, "policy:read"); return; }
    const policy = await container.repositories.policies.findById(policyId(req.params["id"] ?? ""));
    if (policy === null) { notFound(res, "policy"); return; }
    writeJson(res, 200, policy);
  });

  // POST /api/v1/governance/policies  (requires policy:write or wildcard)
  router.post("/api/v1/governance/policies", async (req, ctx, res) => {
    if (!hasPermission(ctx, "policy", "write")) { forbidden(res, "policy:write"); return; }
    const parsedConditions = conditionsArr(req.body, "conditions");
    if (parsedConditions === undefined && bodyHasKey(req.body, "conditions")) {
      badRequest(res, [{ field: "conditions", message: "each condition must have string 'attribute' and 'equals' fields" }]);
      return;
    }
    const result = createPolicy({
      id: str(req.body, "id") ?? randomUUID(),
      name: str(req.body, "name") ?? "",
      effect: (str(req.body, "effect") ?? "") as PolicyEffect,
      actions: strArr(req.body, "actions") ?? [],
      resources: strArr(req.body, "resources") ?? [],
      conditions: parsedConditions ?? [],
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await container.repositories.policies.save(result.value);
    recordAudit(container.auditLog, ctx, "policy:create", result.value.id, "success", {
      name: result.value.name,
      effect: result.value.effect,
    });
    writeJson(res, 201, result.value);
  });

  // PUT /api/v1/governance/policies/:id  (requires policy:write or wildcard)
  router.put("/api/v1/governance/policies/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "policy", "write")) { forbidden(res, "policy:write"); return; }
    const existing = await container.repositories.policies.findById(policyId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "policy"); return; }
    if (bodyHasKey(req.body, "name") && str(req.body, "name") === undefined) {
      badRequest(res, [{ field: "name", message: "name must be a string" }]);
      return;
    }
    if (bodyHasKey(req.body, "actions") && strArr(req.body, "actions") === undefined) {
      badRequest(res, [{ field: "actions", message: "actions must be an array of strings" }]);
      return;
    }
    if (bodyHasKey(req.body, "resources") && strArr(req.body, "resources") === undefined) {
      badRequest(res, [{ field: "resources", message: "resources must be an array of strings" }]);
      return;
    }
    const parsedConditions = conditionsArr(req.body, "conditions");
    if (parsedConditions === undefined && bodyHasKey(req.body, "conditions")) {
      badRequest(res, [{ field: "conditions", message: "each condition must have string 'attribute' and 'equals' fields" }]);
      return;
    }
    const result = createPolicy({
      id: existing.id,
      name: str(req.body, "name") ?? existing.name,
      effect: existing.effect,
      actions: strArr(req.body, "actions") ?? ([...existing.actions] as string[]),
      resources: strArr(req.body, "resources") ?? ([...existing.resources] as string[]),
      conditions: parsedConditions ?? ([...existing.conditions] as PolicyCondition[]),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await container.repositories.policies.save(result.value);
    recordAudit(container.auditLog, ctx, "policy:update", existing.id, "success", {
      name: result.value.name,
      effect: result.value.effect,
    });
    writeJson(res, 200, result.value);
  });

  // DELETE /api/v1/governance/policies/:id  (requires policy:write or wildcard)
  router.delete("/api/v1/governance/policies/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "policy", "write")) { forbidden(res, "policy:write"); return; }
    const existing = await container.repositories.policies.findById(policyId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "policy"); return; }
    await container.repositories.policies.delete(existing.id);
    recordAudit(container.auditLog, ctx, "policy:delete", existing.id, "success", {
      name: existing.name,
    });
    noContent(res);
  });
}
