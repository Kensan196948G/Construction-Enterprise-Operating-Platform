// FILE: src/api/routes/dashboard.ts
/**
 * Dashboard and entity-listing routes.
 *
 * The dashboard view is role-filtered through the Governance Core and scoped to
 * the authenticated subject. The supporting list endpoints expose raw entity
 * collections for portal screens and support ?limit=&offset= pagination.
 */

import type { IsoTimestamp } from "../../domain/common.ts";
import { buildDashboard } from "../../dashboard/dashboard.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { hasPermission } from "./governance.ts";
import type { AppContainer } from "../types.ts";

export function registerDashboardRoutes(router: Router, container: AppContainer): void {
  // GET /api/v1/dashboard
  router.get("/api/v1/dashboard", async (_req, ctx, res) => {
    if (ctx === null) {
      writeJson(res, 401, { error: "Unauthorized", message: "authentication required" });
      return;
    }

    const [users, applications, devices, policies] = await Promise.all([
      container.repositories.users.findAll(),
      container.repositories.applications.findAll(),
      container.repositories.devices.findAll(),
      container.repositories.policies.findAll(),
    ]);

    const view = buildDashboard({
      viewer: {
        subject: ctx.subject,
        permissions: ctx.permissions,
        ...(ctx.organizationId !== undefined ? { organizationId: ctx.organizationId } : {}),
      },
      policies,
      generatedAt: new Date().toISOString() as IsoTimestamp,
      users,
      applications,
      devices,
      pendingApprovals: [],
      auditLog: container.auditLog,
    });

    writeJson(res, 200, view);
  });

  // GET /api/v1/organizations?limit=&offset=  (requires organization:read or wildcard)
  router.get("/api/v1/organizations", async (req, ctx, res) => {
    if (!hasPermission(ctx, "organization", "read")) {
      writeJson(res, 403, {
        error: "Forbidden",
        message: "requires 'organization:read' permission",
      });
      return;
    }
    const all = await container.repositories.organizations.findAll();
    const scoped =
      ctx?.organizationId !== undefined ? all.filter((o) => o.id === ctx.organizationId) : all;
    const pg = paginate(scoped, parsePagination(req.query));
    writeJson(res, 200, {
      organizations: pg.items,
      count: pg.count,
      total: pg.total,
      limit: pg.limit,
      offset: pg.offset,
    });
  });

  // GET /api/v1/users?limit=&offset=  (requires user:read or wildcard)
  router.get("/api/v1/users", async (req, ctx, res) => {
    if (!hasPermission(ctx, "user", "read")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'user:read' permission" });
      return;
    }
    const all = await container.repositories.users.findAll();
    const scoped =
      ctx?.organizationId !== undefined
        ? all.filter((u) => u.organizationId === ctx.organizationId)
        : all;
    const pg = paginate(scoped, parsePagination(req.query));
    writeJson(res, 200, {
      users: pg.items,
      count: pg.count,
      total: pg.total,
      limit: pg.limit,
      offset: pg.offset,
    });
  });

  // GET /api/v1/applications?limit=&offset=  (requires application:read or wildcard)
  router.get("/api/v1/applications", async (req, ctx, res) => {
    if (!hasPermission(ctx, "application", "read")) {
      writeJson(res, 403, {
        error: "Forbidden",
        message: "requires 'application:read' permission",
      });
      return;
    }
    const all = await container.repositories.applications.findAll();
    const scoped =
      ctx?.organizationId !== undefined
        ? all.filter((a) => a.ownerOrganizationId === ctx.organizationId)
        : all;
    const pg = paginate(scoped, parsePagination(req.query));
    writeJson(res, 200, {
      applications: pg.items,
      count: pg.count,
      total: pg.total,
      limit: pg.limit,
      offset: pg.offset,
    });
  });

  // GET /api/v1/devices?limit=&offset=  (requires device:read or wildcard)
  router.get("/api/v1/devices", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "read")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'device:read' permission" });
      return;
    }
    const all = await container.repositories.devices.findAll();
    const scoped =
      ctx?.organizationId !== undefined
        ? all.filter((d) => d.organizationId === ctx.organizationId)
        : all;
    const pg = paginate(scoped, parsePagination(req.query));
    writeJson(res, 200, {
      devices: pg.items,
      count: pg.count,
      total: pg.total,
      limit: pg.limit,
      offset: pg.offset,
    });
  });
}
