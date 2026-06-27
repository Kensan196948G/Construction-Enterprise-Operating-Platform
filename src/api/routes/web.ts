// FILE: src/api/routes/web.ts
/**
 * Web routes — server-side rendered HTML pages.
 *
 * These routes serve human-readable HTML for the browser. They reuse the same
 * AppContainer as the JSON API routes, so no extra repositories or services are
 * needed. All routes require authentication — no guest-scoped views are served.
 *
 * Routes:
 *   GET /           → 302 redirect to /dashboard
 *   GET /dashboard  → role-based dashboard page (SSR)
 *   GET /governance → governance management page (SSR)
 */

import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import { buildDashboard } from "../../dashboard/dashboard.ts";
import type { Policy } from "../../domain/policy.ts";
import type { Router } from "../router.ts";
import type { AppContainer } from "../types.ts";
import {
  renderDashboard,
  renderGovernance,
  type GovernancePolicyRow,
} from "../../web/renderer.ts";

/** Write a complete HTML response with browser security headers. */
function sendHtml(res: ServerResponse, status: number, html: string): void {
  const buf = Buffer.from(html, "utf-8");
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": buf.byteLength,
    // default-src 'self' acts as fallback for style-src/script-src, blocking all inline.
    // HTML templates use inline <style> and <script> blocks, so permit 'unsafe-inline' explicitly.
    // form-action, base-uri, frame-ancestors are not covered by default-src — list them explicitly.
    "Content-Security-Policy":
      "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "same-origin",
    // Prevent authenticated dashboard pages from being cached by browsers or proxies.
    "Cache-Control": "no-store",
  });
  res.end(buf);
}

/** Redirect to another path with a 302. */
function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { Location: location });
  res.end();
}

/** Map a Policy domain object to the renderer's slim row type. */
function policyToRow(p: Policy): GovernancePolicyRow {
  return {
    id: p.id,
    name: p.name,
    effect: p.effect,
    actions: p.actions,
    resources: p.resources,
    conditionCount: p.conditions.length,
  };
}

export function registerWebRoutes(router: Router, container: AppContainer): void {
  router.get(
    "/",
    async (_req, _ctx, res) => {
      redirect(res, "/dashboard");
    },
    false,
  );

  router.get(
    "/dashboard",
    async (_req, ctx, res) => {
      const subject: string = ctx!.subject;
      const permissions: readonly Permission[] = ctx!.permissions;

      const [users, applications, devices, policies] = await Promise.all([
        container.repositories.users.findAll(),
        container.repositories.applications.findAll(),
        container.repositories.devices.findAll(),
        container.repositories.policies.findAll(),
      ]);

      const view = buildDashboard({
        viewer: { subject, permissions },
        policies,
        generatedAt: new Date().toISOString() as IsoTimestamp,
        users,
        applications,
        devices,
        pendingApprovals: [],
        auditLog: container.auditLog,
      });

      sendHtml(res, 200, await renderDashboard(view));
    },
    true,
  );

  router.get(
    "/governance",
    async (_req, _ctx, res) => {
      const policyRows = (await container.repositories.policies.findAll()).map(policyToRow);
      sendHtml(res, 200, await renderGovernance(policyRows));
    },
    true,
  );
}
