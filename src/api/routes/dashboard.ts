// FILE: src/api/routes/dashboard.ts
/**
 * Dashboard and entity-listing routes.
 *
 * The dashboard view is role-filtered through the Governance Core and scoped to
 * the authenticated subject. The supporting list endpoints expose raw entity
 * collections for portal screens.
 */

import type { IsoTimestamp } from "../../domain/common.ts";
import { buildDashboard } from "../../dashboard/dashboard.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
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
      viewer: { subject: ctx.subject, permissions: ctx.permissions },
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

  // GET /api/v1/organizations
  router.get("/api/v1/organizations", async (_req, _ctx, res) => {
    const organizations = await container.repositories.organizations.findAll();
    writeJson(res, 200, { organizations, count: organizations.length });
  });

  // GET /api/v1/users
  router.get("/api/v1/users", async (_req, _ctx, res) => {
    const users = await container.repositories.users.findAll();
    writeJson(res, 200, { users, count: users.length });
  });

  // GET /api/v1/applications
  router.get("/api/v1/applications", async (_req, _ctx, res) => {
    const applications = await container.repositories.applications.findAll();
    writeJson(res, 200, { applications, count: applications.length });
  });

  // GET /api/v1/devices
  router.get("/api/v1/devices", async (_req, _ctx, res) => {
    const devices = await container.repositories.devices.findAll();
    writeJson(res, 200, { devices, count: devices.length });
  });
}
