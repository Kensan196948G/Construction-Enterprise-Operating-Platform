// FILE: src/api/routes/entity-crud.ts
/**
 * CRUD API routes for all platform domain entities.
 *
 * Each resource follows:
 *   GET    /api/v1/:resource/:id  — get by id
 *   POST   /api/v1/:resource      — create
 *   PUT    /api/v1/:resource/:id  — update mutable fields
 *   DELETE /api/v1/:resource/:id  — hard delete (users: soft deactivate)
 *
 * GET list endpoints (/organizations, /users, /applications, /devices) are
 * registered in dashboard.ts to avoid duplication.
 * GET /api/v1/roles (list) is registered here — it was missing from dashboard.ts.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { createOrganization, organizationId } from "../../domain/organization.ts";
import type { OrganizationType, OrganizationStatus } from "../../domain/organization.ts";
import { createUser, userId } from "../../domain/user.ts";
import type { UserStatus } from "../../domain/user.ts";
import { createRole, roleId } from "../../domain/role.ts";
import type { RoleScope } from "../../domain/role.ts";
import { createDevice, deviceId } from "../../domain/device.ts";
import type { DeviceKind, DeviceStatus } from "../../domain/device.ts";
import { createApplication, applicationId } from "../../domain/application.ts";
import type { ApplicationCategory, ApplicationHealth } from "../../domain/application.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { AppContainer } from "../types.ts";

// ---------------------------------------------------------------------------
// Internal body-extraction helpers
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

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

function noContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
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

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerEntityCrudRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  // ── Organizations ─────────────────────────────────────────────────────────

  router.get("/api/v1/organizations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "organization", "read")) { forbidden(res, "organization:read"); return; }
    const org = await repositories.organizations.findById(organizationId(req.params["id"] ?? ""));
    if (org === null) { notFound(res, "organization"); return; }
    writeJson(res, 200, org);
  });

  router.post("/api/v1/organizations", async (req, ctx, res) => {
    if (!hasPermission(ctx, "organization", "write")) { forbidden(res, "organization:write"); return; }
    const parentId = str(req.body, "parentId");
    const result = createOrganization({
      id: str(req.body, "id") ?? randomUUID(),
      name: str(req.body, "name") ?? "",
      type: (str(req.body, "type") ?? "") as OrganizationType,
      status: (str(req.body, "status") ?? "active") as OrganizationStatus,
      createdAt: nowTs(),
      ...(parentId !== undefined ? { parentId } : {}),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.organizations.save(result.value);
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/organizations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "organization", "write")) { forbidden(res, "organization:write"); return; }
    const existing = await repositories.organizations.findById(organizationId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "organization"); return; }
    const parentId = existing.parentId as string | undefined;
    const result = createOrganization({
      id: existing.id,
      name: str(req.body, "name") ?? existing.name,
      type: existing.type,
      status: (str(req.body, "status") ?? existing.status) as OrganizationStatus,
      createdAt: existing.createdAt,
      ...(parentId !== undefined ? { parentId } : {}),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.organizations.save(result.value);
    writeJson(res, 200, result.value);
  });

  router.delete("/api/v1/organizations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "organization", "write")) { forbidden(res, "organization:write"); return; }
    const existing = await repositories.organizations.findById(organizationId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "organization"); return; }
    await repositories.organizations.delete(existing.id);
    noContent(res);
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  router.get("/api/v1/users/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "user", "read")) { forbidden(res, "user:read"); return; }
    const user = await repositories.users.findById(userId(req.params["id"] ?? ""));
    if (user === null) { notFound(res, "user"); return; }
    writeJson(res, 200, user);
  });

  router.post("/api/v1/users", async (req, ctx, res) => {
    if (!hasPermission(ctx, "user", "write")) { forbidden(res, "user:write"); return; }
    const email = str(req.body, "email") ?? "";
    if (email && (await repositories.users.findByEmail(email)) !== null) {
      writeJson(res, 409, { error: "Conflict", message: "email address already in use" });
      return;
    }
    const result = createUser({
      id: str(req.body, "id") ?? randomUUID(),
      organizationId: str(req.body, "organizationId") ?? "",
      displayName: str(req.body, "displayName") ?? "",
      email,
      status: (str(req.body, "status") ?? "invited") as UserStatus,
      roleIds: strArr(req.body, "roleIds") ?? [],
      createdAt: nowTs(),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.users.save(result.value);
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/users/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "user", "write")) { forbidden(res, "user:write"); return; }
    const existing = await repositories.users.findById(userId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "user"); return; }
    const result = createUser({
      id: existing.id,
      organizationId: existing.organizationId,
      displayName: str(req.body, "displayName") ?? existing.displayName,
      email: existing.email,
      status: (str(req.body, "status") ?? existing.status) as UserStatus,
      roleIds: strArr(req.body, "roleIds") ?? ([...existing.roleIds] as string[]),
      createdAt: existing.createdAt,
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.users.save(result.value);
    writeJson(res, 200, result.value);
  });

  // Soft delete: deactivate rather than erase, to preserve audit trail references.
  router.delete("/api/v1/users/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "user", "write")) { forbidden(res, "user:write"); return; }
    const existing = await repositories.users.findById(userId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "user"); return; }
    const result = createUser({
      id: existing.id,
      organizationId: existing.organizationId,
      displayName: existing.displayName,
      email: existing.email,
      status: "deactivated",
      roleIds: [...existing.roleIds] as string[],
      createdAt: existing.createdAt,
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.users.save(result.value);
    writeJson(res, 200, result.value);
  });

  // ── Roles (list + CRUD) ───────────────────────────────────────────────────

  router.get("/api/v1/roles", async (_req, ctx, res) => {
    if (!hasPermission(ctx, "role", "read")) { forbidden(res, "role:read"); return; }
    const roles = await repositories.roles.findAll();
    writeJson(res, 200, { roles, count: roles.length });
  });

  router.get("/api/v1/roles/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "role", "read")) { forbidden(res, "role:read"); return; }
    const role = await repositories.roles.findById(roleId(req.params["id"] ?? ""));
    if (role === null) { notFound(res, "role"); return; }
    writeJson(res, 200, role);
  });

  router.post("/api/v1/roles", async (req, ctx, res) => {
    if (!hasPermission(ctx, "role", "write")) { forbidden(res, "role:write"); return; }
    const name = str(req.body, "name") ?? "";
    if (name && (await repositories.roles.findByName(name)) !== null) {
      writeJson(res, 409, { error: "Conflict", message: "role name already exists" });
      return;
    }
    const result = createRole({
      id: str(req.body, "id") ?? randomUUID(),
      name,
      description: str(req.body, "description") ?? "",
      scope: (str(req.body, "scope") ?? "organization") as RoleScope,
      permissions: strArr(req.body, "permissions") ?? [],
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.roles.save(result.value);
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/roles/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "role", "write")) { forbidden(res, "role:write"); return; }
    const existing = await repositories.roles.findById(roleId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "role"); return; }
    const result = createRole({
      id: existing.id,
      name: existing.name,
      description: str(req.body, "description") ?? existing.description,
      scope: existing.scope,
      permissions: strArr(req.body, "permissions") ?? ([...existing.permissions] as string[]),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.roles.save(result.value);
    writeJson(res, 200, result.value);
  });

  router.delete("/api/v1/roles/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "role", "write")) { forbidden(res, "role:write"); return; }
    const existing = await repositories.roles.findById(roleId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "role"); return; }
    await repositories.roles.delete(existing.id);
    noContent(res);
  });

  // ── Devices ───────────────────────────────────────────────────────────────

  router.get("/api/v1/devices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "read")) { forbidden(res, "device:read"); return; }
    const device = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (device === null) { notFound(res, "device"); return; }
    writeJson(res, 200, device);
  });

  router.post("/api/v1/devices", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) { forbidden(res, "device:write"); return; }
    const assignedUserId = str(req.body, "assignedUserId");
    const lastSeenAt = str(req.body, "lastSeenAt");
    const result = createDevice({
      id: str(req.body, "id") ?? randomUUID(),
      organizationId: str(req.body, "organizationId") ?? "",
      kind: (str(req.body, "kind") ?? "") as DeviceKind,
      status: (str(req.body, "status") ?? "provisioned") as DeviceStatus,
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(lastSeenAt !== undefined ? { lastSeenAt: lastSeenAt as IsoTimestamp } : {}),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.devices.save(result.value);
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/devices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) { forbidden(res, "device:write"); return; }
    const existing = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "device"); return; }
    const assignedUserId =
      str(req.body, "assignedUserId") ?? (existing.assignedUserId as string | undefined);
    const lastSeenAtRaw = str(req.body, "lastSeenAt");
    const lastSeenAt = (lastSeenAtRaw !== undefined
      ? lastSeenAtRaw
      : (existing.lastSeenAt as string | undefined)) as IsoTimestamp | undefined;
    const result = createDevice({
      id: existing.id,
      organizationId: existing.organizationId,
      kind: existing.kind,
      status: (str(req.body, "status") ?? existing.status) as DeviceStatus,
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(lastSeenAt !== undefined ? { lastSeenAt } : {}),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.devices.save(result.value);
    writeJson(res, 200, result.value);
  });

  router.delete("/api/v1/devices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) { forbidden(res, "device:write"); return; }
    const existing = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "device"); return; }
    await repositories.devices.delete(existing.id);
    noContent(res);
  });

  // ── Applications ──────────────────────────────────────────────────────────

  router.get("/api/v1/applications/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "application", "read")) { forbidden(res, "application:read"); return; }
    const app = await repositories.applications.findById(applicationId(req.params["id"] ?? ""));
    if (app === null) { notFound(res, "application"); return; }
    writeJson(res, 200, app);
  });

  router.post("/api/v1/applications", async (req, ctx, res) => {
    if (!hasPermission(ctx, "application", "write")) { forbidden(res, "application:write"); return; }
    const key = str(req.body, "key") ?? "";
    if (key && (await repositories.applications.findByKey(key)) !== null) {
      writeJson(res, 409, { error: "Conflict", message: "application key already exists" });
      return;
    }
    const result = createApplication({
      id: str(req.body, "id") ?? randomUUID(),
      key,
      name: str(req.body, "name") ?? "",
      category: (str(req.body, "category") ?? "") as ApplicationCategory,
      health: (str(req.body, "health") ?? "unknown") as ApplicationHealth,
      ownerOrganizationId: str(req.body, "ownerOrganizationId") ?? "",
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.applications.save(result.value);
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/applications/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "application", "write")) { forbidden(res, "application:write"); return; }
    const existing = await repositories.applications.findById(applicationId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "application"); return; }
    const result = createApplication({
      id: existing.id,
      key: existing.key,
      name: str(req.body, "name") ?? existing.name,
      category: existing.category,
      health: (str(req.body, "health") ?? existing.health) as ApplicationHealth,
      ownerOrganizationId: existing.ownerOrganizationId,
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.applications.save(result.value);
    writeJson(res, 200, result.value);
  });

  router.delete("/api/v1/applications/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "application", "write")) { forbidden(res, "application:write"); return; }
    const existing = await repositories.applications.findById(applicationId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "application"); return; }
    await repositories.applications.delete(existing.id);
    noContent(res);
  });
}
