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
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import { buildDashboard } from "../../dashboard/dashboard.ts";
import type { Policy } from "../../domain/policy.ts";
import type { Router } from "../router.ts";
import type { AppContainer } from "../types.ts";
import {
  renderDashboard,
  renderGovernance,
  renderIsoPage,
  type GovernancePolicyRow,
} from "../../web/renderer.ts";
import { hasPermission } from "./governance.ts";

/** Write a complete HTML response with browser security headers. */
function sendHtml(res: ServerResponse, status: number, html: string): void {
  const buf = Buffer.from(html, "utf-8");
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": buf.byteLength,
    // default-src 'self' acts as fallback for style-src/script-src, blocking all inline.
    "Content-Security-Policy":
      "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "same-origin",
    // Prevent authenticated dashboard pages from being cached by browsers or proxies.
    "Cache-Control": "no-store",
    // Instruct browsers to enforce HTTPS for 2 years including subdomains.
    // Safe to send even over HTTP (proxied TLS termination) — browsers ignore HSTS on plain HTTP.
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  });
  res.end(buf);
}

/** Redirect to another path with a 302. */
function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  });
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
  const staticDirCandidates = [
    fileURLToPath(new URL("../../web/static/", import.meta.url)),
    join(process.cwd(), "src", "web", "static"),
  ];
  const staticDir =
    staticDirCandidates.find((p) => existsSync(p)) ?? join(process.cwd(), "src", "web", "static");

  const sendFile = async (
    res: ServerResponse,
    filePath: string,
    contentType: string,
  ): Promise<void> => {
    try {
      const buf = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": buf.byteLength,
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      });
      res.end(buf);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    }
  };

  // Static assets — CSP allows only 'self', so styles/scripts are external files.
  // The public ingress (Cloudflare Tunnel) routes every /assets/* path to the
  // WebUI static host, so the API's SSR pages must reference their assets under
  // /api/assets/* to reach this server. The legacy /assets/* routes stay for
  // direct/local deployments where no path-split proxy is in front.
  router.get(
    "/api/assets/app.css",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "app.css"), "text/css; charset=utf-8");
    },
    false,
  );
  router.get(
    "/api/assets/app.js",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "app.js"), "text/javascript; charset=utf-8");
    },
    false,
  );
  router.get(
    "/api/assets/iso.js",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "iso.js"), "text/javascript; charset=utf-8");
    },
    false,
  );
  router.get(
    "/api/assets/favicon.svg",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "favicon.svg"), "image/svg+xml; charset=utf-8");
    },
    false,
  );
  router.get(
    "/api/assets/favicon.ico",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "favicon.ico"), "image/x-icon");
    },
    false,
  );
  router.get(
    "/assets/app.css",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "app.css"), "text/css; charset=utf-8");
    },
    false,
  );
  router.get(
    "/assets/app.js",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "app.js"), "text/javascript; charset=utf-8");
    },
    false,
  );
  router.get(
    "/assets/iso.js",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "iso.js"), "text/javascript; charset=utf-8");
    },
    false,
  );
  router.get(
    "/assets/favicon.svg",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "favicon.svg"), "image/svg+xml; charset=utf-8");
    },
    false,
  );
  router.get(
    "/assets/favicon.ico",
    async (_req, _ctx, res) => {
      await sendFile(res, join(staticDir, "favicon.ico"), "image/x-icon");
    },
    false,
  );

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
      const webToken =
        container.jwtIssuer !== undefined
          ? container.jwtIssuer.issue(subject, permissions, ctx!.organizationId)
          : "";

      const [users, applications, devices, policies] = await Promise.all([
        container.repositories.users.findAll(),
        container.repositories.applications.findAll(),
        container.repositories.devices.findAll(),
        container.repositories.policies.findAll(),
      ]);

      const view = buildDashboard({
        viewer: {
          subject,
          permissions,
          ...(ctx?.organizationId !== undefined ? { organizationId: ctx.organizationId } : {}),
        },
        policies,
        generatedAt: new Date().toISOString() as IsoTimestamp,
        users,
        applications,
        devices,
        pendingApprovals: [],
        auditLog: container.auditLog,
      });

      sendHtml(res, 200, await renderDashboard(view, webToken));
    },
    true,
  );

  router.get(
    "/governance",
    async (_req, ctx, res) => {
      if (!hasPermission(ctx, "policy", "read")) {
        sendHtml(
          res,
          403,
          "<html><body><h1>403 Forbidden</h1><p>requires policy:read permission</p></body></html>",
        );
        return;
      }
      const policyRows = (await container.repositories.policies.findAll()).map(policyToRow);
      const webToken =
        container.jwtIssuer !== undefined
          ? container.jwtIssuer.issue(ctx!.subject, ctx!.permissions, ctx!.organizationId)
          : "";
      sendHtml(res, 200, await renderGovernance(policyRows, webToken));
    },
    true,
  );

  router.get(
    "/iso-app",
    async (_req, ctx, res) => {
      if (!hasPermission(ctx, "iso", "read")) {
        sendHtml(
          res,
          403,
          "<html><body><h1>403 Forbidden</h1><p>requires iso:read permission</p></body></html>",
        );
        return;
      }
      const webToken =
        container.jwtIssuer !== undefined
          ? container.jwtIssuer.issue(ctx!.subject, ctx!.permissions, ctx!.organizationId)
          : "";
      sendHtml(res, 200, await renderIsoPage(webToken));
    },
    true,
  );
}
