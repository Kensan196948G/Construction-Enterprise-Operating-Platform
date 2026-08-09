/**
 * ISO integrated-management API (Civil-Construction-IMS absorption).
 *
 * Canonical surface (kind-agnostic):
 *   GET/POST     /api/v1/iso
 *   GET/PUT/DELETE /api/v1/iso/:id
 *   POST         /api/v1/iso/:id/action
 *   GET          /api/v1/iso/analytics
 *
 * IMS-compatible aliases (/quality/plans, /environment/aspects, /assets, …)
 * are thin wrappers over the same kind-discriminated store so existing IMS
 * clients keep working during migration.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import {
  ISO_KIND_LABELS,
  applyIsoAction,
  createIsoRecord,
  isoAnalytics,
  isoKind,
  isoRecordId,
  updateIsoRecord,
  type IsoKind,
  type IsoRecord,
} from "../../domain/iso.ts";
import { recordAudit, type AuditMetadata } from "../audit.ts";
import { parsePagination, paginate } from "../pagination.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { canAccessOrganization, hasPermission } from "./governance.ts";
import type { ApiKeyContext, AppContainer } from "../types.ts";

const PERM_RESOURCE = "iso";

const RESERVED_KEYS = new Set([
  "id",
  "kind",
  "organizationId",
  "projectId",
  "parentId",
  "number",
  "title",
  "status",
  "payload",
  "createdBy",
  "createdAt",
]);

function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse, resource: string): void {
  writeJson(res, 404, { error: "Not Found", message: `${resource} not found` });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function audit(
  container: AppContainer,
  ctx: ApiKeyContext | null,
  action: string,
  resource: string,
  metadata: AuditMetadata = {},
): void {
  recordAudit(container.auditLog, ctx, action, resource, "success", metadata);
}

/**
 * Extract the caller-visible payload. Fields nested under `payload` win over
 * top-level IMS-style fields; reserved CEOP keys are never treated as payload.
 */
function bodyPayload(body: unknown): Readonly<Record<string, unknown>> {
  if (typeof body !== "object" || body === null) return {};
  const raw = body as Record<string, unknown>;
  const nested =
    typeof raw["payload"] === "object" && raw["payload"] !== null && !Array.isArray(raw["payload"])
      ? (raw["payload"] as Record<string, unknown>)
      : {};
  const topLevel: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!RESERVED_KEYS.has(key)) topLevel[key] = value;
  }
  return { ...topLevel, ...nested };
}

function resolveOrganizationId(
  body: unknown,
  ctx: ApiKeyContext | null,
  res: ServerResponse,
): { ok: true; orgId: string } | { ok: false } {
  if (ctx?.organizationId !== undefined) return { ok: true, orgId: ctx.organizationId };
  const requested = str(body, "organizationId");
  if (requested === undefined || requested === "") {
    badRequest(res, [{ field: "organizationId", message: "organizationId is required" }]);
    return { ok: false };
  }
  return { ok: true, orgId: requested };
}

async function loadRecord(
  container: AppContainer,
  ctx: ApiKeyContext | null,
  id: string,
  res: ServerResponse,
): Promise<{ ok: true; record: IsoRecord } | { ok: false }> {
  const record = await container.repositories.isoRecords.findById(isoRecordId(id));
  if (record === null || !canAccessOrganization(ctx, record.organizationId)) {
    notFound(res, "iso record");
    return { ok: false };
  }
  return { ok: true, record };
}

/** Filter a record list by the authenticated organisation scope. */
async function scopedRecords(
  container: AppContainer,
  ctx: ApiKeyContext | null,
): Promise<readonly IsoRecord[]> {
  const all = await container.repositories.isoRecords.findAll();
  return ctx?.organizationId !== undefined
    ? all.filter((record) => record.organizationId === ctx.organizationId)
    : all;
}

function filterRecords(
  items: readonly IsoRecord[],
  query: Readonly<Record<string, string>>,
): readonly IsoRecord[] {
  let filtered: readonly IsoRecord[] = items;
  const kind = query["kind"];
  if (kind !== undefined) filtered = filtered.filter((r) => r.kind === kind);
  const projectId = query["projectId"];
  if (projectId !== undefined) filtered = filtered.filter((r) => r.projectId === projectId);
  const status = query["status"];
  if (status !== undefined) filtered = filtered.filter((r) => r.status === status);
  const parentId = query["parentId"];
  if (parentId !== undefined) filtered = filtered.filter((r) => r.parentId === parentId);
  const search = query["q"];
  if (search !== undefined && search !== "") {
    const needle = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.number ?? "").toLowerCase().includes(needle) ||
        JSON.stringify(r.payload).toLowerCase().includes(needle),
    );
  }
  return filtered;
}

function registerKindAliasRoutes(
  router: Router,
  container: AppContainer,
  basePath: string,
  kind: IsoKind,
): void {
  router.get(basePath, async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const items = filterRecords(await scopedRecords(container, ctx), {
      ...req.query,
      kind,
    });
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      isoRecords: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post(basePath, async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "iso:write");
      return;
    }
    const org = resolveOrganizationId(req.body, ctx, res);
    if (!org.ok) return;
    const created = createIsoRecord({
      id: `iso-${randomUUID()}`,
      kind,
      organizationId: org.orgId,
      ...(str(req.body, "projectId") !== undefined
        ? { projectId: str(req.body, "projectId") }
        : {}),
      ...(str(req.body, "parentId") !== undefined ? { parentId: str(req.body, "parentId") } : {}),
      ...(str(req.body, "number") !== undefined ? { number: str(req.body, "number") } : {}),
      title: str(req.body, "title") ?? "",
      ...(str(req.body, "status") !== undefined ? { status: str(req.body, "status") } : {}),
      payload: bodyPayload(req.body),
      createdBy: ctx?.subject ?? "system",
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await container.repositories.isoRecords.save(created.value);
    audit(container, ctx, "iso.create", `iso:${kind}`, { id: created.value.id });
    writeJson(res, 201, { isoRecord: created.value });
  });

  router.get(`${basePath}/:id`, async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    if (loaded.record.kind !== kind) {
      notFound(res, "iso record");
      return;
    }
    writeJson(res, 200, { isoRecord: loaded.record });
  });

  router.put(`${basePath}/:id`, async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "iso:write");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    const updated = updateIsoRecord(loaded.record, bodyPayload(req.body), nowTs());
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await container.repositories.isoRecords.save(updated.value);
    audit(container, ctx, "iso.update", `iso:${loaded.record.kind}`, { id: loaded.record.id });
    writeJson(res, 200, { isoRecord: updated.value });
  });

  router.delete(`${basePath}/:id`, async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "delete")) {
      forbidden(res, "iso:delete");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    await container.repositories.isoRecords.delete(loaded.record.id);
    audit(container, ctx, "iso.delete", `iso:${loaded.record.kind}`, { id: loaded.record.id });
    res.writeHead(204);
    res.end();
  });

  router.post(`${basePath}/:id/action`, async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "approve")) {
      forbidden(res, "iso:approve");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    const action = str(req.body, "action") ?? "";
    const result = applyIsoAction(loaded.record, action, ctx?.subject ?? "system", nowTs());
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await container.repositories.isoRecords.save(result.value);
    audit(container, ctx, `iso.action.${action}`, `iso:${loaded.record.kind}`, {
      id: loaded.record.id,
    });
    writeJson(res, 200, { isoRecord: result.value });
  });
}

const ISO_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["/api/v1/assets/maintenance-plans", "asset-maintenance-plan"],
  ["/api/v1/assets/inspections", "asset-inspection"],
  ["/api/v1/assets/risk-assessments", "asset-risk-assessment"],
  ["/api/v1/assets/disposals", "asset-disposal"],
  ["/api/v1/assets/handovers", "asset-handover"],
  ["/api/v1/quality/plans", "quality-plan"],
  ["/api/v1/quality/inspections", "quality-inspection"],
  ["/api/v1/quality/nonconformities", "nonconformity"],
  ["/api/v1/environment/aspects", "environmental-aspect"],
  ["/api/v1/environment/legal-requirements", "legal-requirement"],
  ["/api/v1/environment/waste-records", "waste-record"],
  ["/api/v1/safety/hazards", "hazard"],
  ["/api/v1/safety/near-misses", "near-miss"],
  ["/api/v1/safety/educations", "safety-education"],
  ["/api/v1/safety/toolbox-talks", "toolbox-talk"],
  ["/api/v1/safety/inspections", "safety-inspection"],
  ["/api/v1/safety/incidents", "safety-incident"],
  ["/api/v1/assets", "asset"],
  ["/api/v1/bim/eirs", "bim-eir"],
  ["/api/v1/bim/beps", "bim-bep"],
  ["/api/v1/bim/containers", "bim-container"],
  ["/api/v1/bim/coordination-issues", "bim-coordination-issue"],
  ["/api/v1/audit/plans", "audit-plan"],
  ["/api/v1/audit/findings", "audit-finding"],
  ["/api/v1/corrective-actions", "corrective-action"],
  ["/api/v1/isms/assets", "isms-asset"],
  ["/api/v1/isms/threats", "isms-threat"],
  ["/api/v1/isms/risk-assessments", "isms-risk-assessment"],
  ["/api/v1/isms/incidents", "isms-incident"],
  ["/api/v1/bcp/plans", "bcp-plan"],
  ["/api/v1/bcp/scenarios", "bcp-risk-scenario"],
  ["/api/v1/bcp/drills", "bcp-drill"],
];

export function registerIsoRoutes(router: Router, container: AppContainer): void {
  // Analytics first: literal segment must win over /iso/:id.
  router.get("/api/v1/iso/analytics", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const items = filterRecords(await scopedRecords(container, ctx), req.query);
    writeJson(res, 200, { analytics: isoAnalytics(items), kinds: ISO_KIND_LABELS });
  });

  router.get("/api/v1/analytics/iso-compliance", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const items = filterRecords(await scopedRecords(container, ctx), req.query);
    writeJson(res, 200, { analytics: isoAnalytics(items) });
  });

  router.get("/api/v1/analytics/safety-kpi", async (_req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const items = await scopedRecords(container, ctx);
    const hazards = items.filter((r) => r.kind === "hazard");
    const incidents = items.filter((r) => r.kind === "safety-incident");
    const inspections = items.filter((r) => r.kind === "safety-inspection");
    writeJson(res, 200, {
      hazardCount: hazards.length,
      openHazards: hazards.filter((r) => !["closed", "cancelled"].includes(r.status)).length,
      incidentCount: incidents.length,
      openIncidents: incidents.filter((r) => !["closed", "cancelled"].includes(r.status)).length,
      inspectionCount: inspections.length,
      closedInspections: inspections.filter((r) => r.status === "closed").length,
    });
  });

  // Canonical kind-agnostic CRUD.
  router.get("/api/v1/iso", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const items = filterRecords(await scopedRecords(container, ctx), req.query);
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      isoRecords: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/iso", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "iso:write");
      return;
    }
    const org = resolveOrganizationId(req.body, ctx, res);
    if (!org.ok) return;
    const kind = isoKind(str(req.body, "kind") ?? "");
    if (kind === null) {
      badRequest(res, [
        { field: "kind", message: "kind is required and must be a valid ISO kind" },
      ]);
      return;
    }
    const created = createIsoRecord({
      id: `iso-${randomUUID()}`,
      kind,
      organizationId: org.orgId,
      ...(str(req.body, "projectId") !== undefined
        ? { projectId: str(req.body, "projectId") }
        : {}),
      ...(str(req.body, "parentId") !== undefined ? { parentId: str(req.body, "parentId") } : {}),
      ...(str(req.body, "number") !== undefined ? { number: str(req.body, "number") } : {}),
      title: str(req.body, "title") ?? "",
      ...(str(req.body, "status") !== undefined ? { status: str(req.body, "status") } : {}),
      payload: bodyPayload(req.body),
      createdBy: ctx?.subject ?? "system",
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await container.repositories.isoRecords.save(created.value);
    audit(container, ctx, "iso.create", `iso:${kind}`, { id: created.value.id });
    writeJson(res, 201, { isoRecord: created.value });
  });

  router.get("/api/v1/iso/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "iso:read");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    writeJson(res, 200, { isoRecord: loaded.record });
  });

  router.put("/api/v1/iso/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "iso:write");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    const updated = updateIsoRecord(loaded.record, bodyPayload(req.body), nowTs());
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await container.repositories.isoRecords.save(updated.value);
    audit(container, ctx, "iso.update", `iso:${loaded.record.kind}`, { id: loaded.record.id });
    writeJson(res, 200, { isoRecord: updated.value });
  });

  router.delete("/api/v1/iso/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "delete")) {
      forbidden(res, "iso:delete");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    await container.repositories.isoRecords.delete(loaded.record.id);
    audit(container, ctx, "iso.delete", `iso:${loaded.record.kind}`, { id: loaded.record.id });
    res.writeHead(204);
    res.end();
  });

  router.post("/api/v1/iso/:id/action", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "approve")) {
      forbidden(res, "iso:approve");
      return;
    }
    const loaded = await loadRecord(container, ctx, req.params["id"] ?? "", res);
    if (!loaded.ok) return;
    const action = str(req.body, "action") ?? "";
    const result = applyIsoAction(loaded.record, action, ctx?.subject ?? "system", nowTs());
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await container.repositories.isoRecords.save(result.value);
    audit(container, ctx, `iso.action.${action}`, `iso:${loaded.record.kind}`, {
      id: loaded.record.id,
    });
    writeJson(res, 200, { isoRecord: result.value });
  });

  // IMS-compatible aliases.
  for (const [path, kind] of ISO_ALIASES) {
    const resolved = isoKind(kind);
    if (resolved !== null) registerKindAliasRoutes(router, container, path, resolved);
  }
}
