// FILE: src/api/routes/governance.ts
/**
 * Governance API routes.
 *
 * Exposes the Governance Core (policy evaluation + tamper-evident audit log)
 * over HTTP so external systems can perform access checks and retrieve audit
 * evidence without embedding the evaluation engine themselves.
 */

import { randomUUID } from "node:crypto";
import type { IsoTimestamp } from "../../domain/common.ts";
import { createAuditEvent } from "../../domain/audit-event.ts";
import type { Permission } from "../../domain/role.ts";
import { evaluateAccess, resolvePermissions } from "../../governance/policy-engine.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import type { AppContainer } from "../types.ts";

const AUDIT_LIMIT_DEFAULT = 50;
const AUDIT_LIMIT_MAX = 200;

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

export function registerGovernanceRoutes(router: Router, container: AppContainer): void {
  // POST /api/v1/governance/evaluate
  router.post("/api/v1/governance/evaluate", async (req, ctx, res) => {
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

  // GET /api/v1/governance/audit  (requires audit:read or wildcard permission)
  router.get("/api/v1/governance/audit", async (req, ctx, res) => {
    const hasAuditRead =
      ctx?.permissions.some((p) => p === "audit:read" || p === "*:*" || p === "*:read") ?? false;
    if (!hasAuditRead) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'audit:read' permission" });
      return;
    }
    const rawLimit = req.query["limit"];
    const parsed = rawLimit !== undefined ? Number.parseInt(rawLimit, 10) : AUDIT_LIMIT_DEFAULT;
    const limit =
      Number.isNaN(parsed) || parsed < 1 ? AUDIT_LIMIT_DEFAULT : Math.min(parsed, AUDIT_LIMIT_MAX);

    const allEntries = container.auditLog.entries;
    const entries = allEntries.slice(Math.max(0, allEntries.length - limit));

    writeJson(res, 200, { entries, count: entries.length });
  });

  // GET /api/v1/governance/policies  (requires policy:read or wildcard permission)
  router.get("/api/v1/governance/policies", async (_req, ctx, res) => {
    const hasPolicyRead =
      ctx?.permissions.some((p) => p === "policy:read" || p === "*:*" || p === "*:read") ?? false;
    if (!hasPolicyRead) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'policy:read' permission" });
      return;
    }
    const policies = await container.repositories.policies.findAll();
    writeJson(res, 200, { policies, count: policies.length });
  });
}
