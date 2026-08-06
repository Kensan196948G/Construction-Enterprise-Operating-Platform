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
import { parsePagination, paginate } from "../pagination.ts";
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
import { recordAudit, type AuditMetadata } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { ApiKeyContext, AppContainer } from "../types.ts";

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

/** Record a successful mutation in the tamper-evident audit log. */
function audit(
  container: AppContainer,
  ctx: ApiKeyContext | null,
  action: string,
  resource: string,
  metadata: AuditMetadata = {},
): void {
  recordAudit(container.auditLog, ctx, action, resource, "success", metadata);
}

// Catches DB-level UNIQUE constraint violations from node:sqlite.
// The findBy*/save pattern has a TOCTOU window; full atomicity requires UNIQUE
// constraints in the DB schema (planned for M11). This catch handles the concurrent-write case.
function isConstraintViolation(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return e.message.includes("UNIQUE constraint failed") || e.message.includes("SQLITE_CONSTRAINT");
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
    audit(container, ctx, "organization:create", result.value.id, {
      name: result.value.name,
      type: result.value.type,
    });
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
    audit(container, ctx, "organization:update", existing.id, {
      name: result.value.name,
      status: result.value.status,
    });
    writeJson(res, 200, result.value);
  });

  // Fix #1: Prevent deletion when dependent records still reference this organization.
  router.delete("/api/v1/organizations/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "organization", "write")) { forbidden(res, "organization:write"); return; }
    const existing = await repositories.organizations.findById(organizationId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "organization"); return; }
    const [depUsers, depDevices, depApps] = await Promise.all([
      repositories.users.findByOrganization(existing.id),
      repositories.devices.findByOrganization(existing.id),
      repositories.applications.findByOwner(existing.id),
    ]);
    if (depUsers.length > 0 || depDevices.length > 0 || depApps.length > 0) {
      writeJson(res, 409, {
        error: "Conflict",
        message: "organization has dependent records; remove or reassign users, devices, and applications first",
      });
      return;
    }
    await repositories.organizations.delete(existing.id);
    audit(container, ctx, "organization:delete", existing.id, {
      name: existing.name,
    });
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
    // TOCTOU: pre-check + isConstraintViolation catch together guard against duplicate email.
    if (email && (await repositories.users.findByEmail(email)) !== null) {
      writeJson(res, 409, { error: "Conflict", message: "email address already in use" });
      return;
    }
    const orgIdStr = str(req.body, "organizationId") ?? "";
    const roleIdsArr = strArr(req.body, "roleIds") ?? [];
    // Fix #3: Validate referenced IDs in parallel before persisting.
    const [orgRecord, roleRecords] = await Promise.all([
      orgIdStr
        ? repositories.organizations.findById(organizationId(orgIdStr))
        : Promise.resolve(null as null),
      Promise.all(roleIdsArr.map((rid) => repositories.roles.findById(roleId(rid)))),
    ]);
    if (orgIdStr && orgRecord === null) {
      badRequest(res, [{ field: "organizationId", message: "organization not found" }]);
      return;
    }
    for (let i = 0; i < roleIdsArr.length; i++) {
      if (roleRecords[i] === null) {
        badRequest(res, [{ field: `roleIds[${i}]`, message: `role '${roleIdsArr[i]}' not found` }]);
        return;
      }
    }
    const result = createUser({
      id: str(req.body, "id") ?? randomUUID(),
      organizationId: orgIdStr,
      displayName: str(req.body, "displayName") ?? "",
      email,
      status: (str(req.body, "status") ?? "invited") as UserStatus,
      roleIds: roleIdsArr,
      createdAt: nowTs(),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    // Fix #2: Catch DB-level unique constraint violation for concurrent-write edge case.
    try {
      await repositories.users.save(result.value);
    } catch (e) {
      if (isConstraintViolation(e)) {
        writeJson(res, 409, { error: "Conflict", message: "email address already in use" });
        return;
      }
      throw e;
    }
    audit(container, ctx, "user:create", result.value.id, {
      status: result.value.status,
      organizationId: result.value.organizationId,
    });
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/users/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "user", "write")) { forbidden(res, "user:write"); return; }
    const existing = await repositories.users.findById(userId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "user"); return; }
    const newRoleIds = strArr(req.body, "roleIds");
    // Fix #3: Validate updated roleIds references if the field is provided.
    if (newRoleIds !== undefined && newRoleIds.length > 0) {
      const roleRecords = await Promise.all(newRoleIds.map((rid) => repositories.roles.findById(roleId(rid))));
      for (let i = 0; i < newRoleIds.length; i++) {
        if (roleRecords[i] === null) {
          badRequest(res, [{ field: `roleIds[${i}]`, message: `role '${newRoleIds[i]}' not found` }]);
          return;
        }
      }
    }
    const result = createUser({
      id: existing.id,
      organizationId: existing.organizationId,
      displayName: str(req.body, "displayName") ?? existing.displayName,
      email: existing.email,
      status: (str(req.body, "status") ?? existing.status) as UserStatus,
      roleIds: newRoleIds ?? ([...existing.roleIds] as string[]),
      createdAt: existing.createdAt,
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.users.save(result.value);
    audit(container, ctx, "user:update", existing.id, {
      status: result.value.status,
      displayName: result.value.displayName,
    });
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
    audit(container, ctx, "user:deactivate", existing.id, {
      status: result.value.status,
    });
    writeJson(res, 200, result.value);
  });

  // ── Roles (list + CRUD) ───────────────────────────────────────────────────

  router.get("/api/v1/roles", async (req, ctx, res) => {
    if (!hasPermission(ctx, "role", "read")) { forbidden(res, "role:read"); return; }
    const all = await repositories.roles.findAll();
    const pg = paginate(all, parsePagination(req.query));
    writeJson(res, 200, { roles: pg.items, count: pg.count, total: pg.total, limit: pg.limit, offset: pg.offset });
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
    // TOCTOU: pre-check + isConstraintViolation catch together guard against duplicate name.
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
    // Fix #2: Catch DB-level unique constraint violation for concurrent-write edge case.
    try {
      await repositories.roles.save(result.value);
    } catch (e) {
      if (isConstraintViolation(e)) {
        writeJson(res, 409, { error: "Conflict", message: "role name already exists" });
        return;
      }
      throw e;
    }
    audit(container, ctx, "role:create", result.value.id, {
      name: result.value.name,
      scope: result.value.scope,
    });
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
    audit(container, ctx, "role:update", existing.id, {
      name: result.value.name,
      scope: result.value.scope,
    });
    writeJson(res, 200, result.value);
  });

  // Fix #1: Prevent deletion if any user still has this role assigned.
  router.delete("/api/v1/roles/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "role", "write")) { forbidden(res, "role:write"); return; }
    const existing = await repositories.roles.findById(roleId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "role"); return; }
    const allUsers = await repositories.users.findAll();
    const rid = String(existing.id);
    const hasAssignedUsers = allUsers.some((u) => u.roleIds.some((r) => String(r) === rid));
    if (hasAssignedUsers) {
      writeJson(res, 409, {
        error: "Conflict",
        message: "role is assigned to one or more users; unassign them first",
      });
      return;
    }
    await repositories.roles.delete(existing.id);
    audit(container, ctx, "role:delete", existing.id, {
      name: existing.name,
    });
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
    const rawOrgId = str(req.body, "organizationId") ?? "";
    const assignedUserIdStr = str(req.body, "assignedUserId");
    // Fix #3: Validate referenced IDs in parallel before persisting.
    const [orgRecord, userRecord] = await Promise.all([
      rawOrgId
        ? repositories.organizations.findById(organizationId(rawOrgId))
        : Promise.resolve(null as null),
      assignedUserIdStr !== undefined
        ? repositories.users.findById(userId(assignedUserIdStr))
        : Promise.resolve(null as null),
    ]);
    if (rawOrgId && orgRecord === null) {
      badRequest(res, [{ field: "organizationId", message: "organization not found" }]);
      return;
    }
    if (assignedUserIdStr !== undefined && userRecord === null) {
      badRequest(res, [{ field: "assignedUserId", message: "user not found" }]);
      return;
    }
    if (assignedUserIdStr !== undefined && userRecord !== null && rawOrgId &&
        String(userRecord.organizationId) !== rawOrgId) {
      badRequest(res, [{ field: "assignedUserId", message: "user must belong to the same organization as the device" }]);
      return;
    }
    const lastSeenAt = str(req.body, "lastSeenAt");
    const result = createDevice({
      id: str(req.body, "id") ?? randomUUID(),
      organizationId: rawOrgId,
      kind: (str(req.body, "kind") ?? "") as DeviceKind,
      status: (str(req.body, "status") ?? "provisioned") as DeviceStatus,
      ...(assignedUserIdStr !== undefined ? { assignedUserId: assignedUserIdStr } : {}),
      ...(lastSeenAt !== undefined ? { lastSeenAt: lastSeenAt as IsoTimestamp } : {}),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.devices.save(result.value);
    audit(container, ctx, "device:create", result.value.id, {
      kind: result.value.kind,
      status: result.value.status,
      organizationId: result.value.organizationId,
    });
    writeJson(res, 201, result.value);
  });

  router.put("/api/v1/devices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) { forbidden(res, "device:write"); return; }
    const existing = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "device"); return; }
    const newAssignedUserIdStr = str(req.body, "assignedUserId");
    // Fix #3: Validate updated assignedUserId reference if the field is provided.
    if (newAssignedUserIdStr !== undefined) {
      const userRecord = await repositories.users.findById(userId(newAssignedUserIdStr));
      if (userRecord === null) {
        badRequest(res, [{ field: "assignedUserId", message: "user not found" }]);
        return;
      }
      if (String(userRecord.organizationId) !== String(existing.organizationId)) {
        badRequest(res, [{ field: "assignedUserId", message: "user must belong to the same organization as the device" }]);
        return;
      }
    }
    const assignedUserIdVal =
      newAssignedUserIdStr ?? (existing.assignedUserId as string | undefined);
    const lastSeenAtRaw = str(req.body, "lastSeenAt");
    const lastSeenAt = (lastSeenAtRaw !== undefined
      ? lastSeenAtRaw
      : (existing.lastSeenAt as string | undefined)) as IsoTimestamp | undefined;
    const result = createDevice({
      id: existing.id,
      organizationId: existing.organizationId,
      kind: existing.kind,
      status: (str(req.body, "status") ?? existing.status) as DeviceStatus,
      ...(assignedUserIdVal !== undefined ? { assignedUserId: assignedUserIdVal } : {}),
      ...(lastSeenAt !== undefined ? { lastSeenAt } : {}),
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    await repositories.devices.save(result.value);
    audit(container, ctx, "device:update", existing.id, {
      kind: result.value.kind,
      status: result.value.status,
    });
    writeJson(res, 200, result.value);
  });

  router.delete("/api/v1/devices/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) { forbidden(res, "device:write"); return; }
    const existing = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "device"); return; }
    await repositories.devices.delete(existing.id);
    audit(container, ctx, "device:delete", existing.id, {});
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
    // TOCTOU: pre-check + isConstraintViolation catch together guard against duplicate key.
    if (key && (await repositories.applications.findByKey(key)) !== null) {
      writeJson(res, 409, { error: "Conflict", message: "application key already exists" });
      return;
    }
    const ownerOrgIdStr = str(req.body, "ownerOrganizationId") ?? "";
    // Fix #3: Validate ownerOrganizationId reference before persisting.
    if (ownerOrgIdStr) {
      const ownerOrg = await repositories.organizations.findById(organizationId(ownerOrgIdStr));
      if (ownerOrg === null) {
        badRequest(res, [{ field: "ownerOrganizationId", message: "organization not found" }]);
        return;
      }
    }
    const result = createApplication({
      id: str(req.body, "id") ?? randomUUID(),
      key,
      name: str(req.body, "name") ?? "",
      category: (str(req.body, "category") ?? "") as ApplicationCategory,
      health: (str(req.body, "health") ?? "unknown") as ApplicationHealth,
      ownerOrganizationId: ownerOrgIdStr,
    });
    if (!result.ok) { badRequest(res, result.error); return; }
    // Fix #2: Catch DB-level unique constraint violation for concurrent-write edge case.
    try {
      await repositories.applications.save(result.value);
    } catch (e) {
      if (isConstraintViolation(e)) {
        writeJson(res, 409, { error: "Conflict", message: "application key already exists" });
        return;
      }
      throw e;
    }
    audit(container, ctx, "application:create", result.value.id, {
      key: result.value.key,
      category: result.value.category,
    });
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
    audit(container, ctx, "application:update", existing.id, {
      key: result.value.key,
      health: result.value.health,
    });
    writeJson(res, 200, result.value);
  });

  router.delete("/api/v1/applications/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "application", "write")) { forbidden(res, "application:write"); return; }
    const existing = await repositories.applications.findById(applicationId(req.params["id"] ?? ""));
    if (existing === null) { notFound(res, "application"); return; }
    await repositories.applications.delete(existing.id);
    audit(container, ctx, "application:delete", existing.id, {
      key: existing.key,
    });
    noContent(res);
  });
}
