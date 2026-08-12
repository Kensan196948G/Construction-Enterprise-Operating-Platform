/**
 * Daily report console UI (v0.12.0 MVP).
 *
 * Serves the SSR page at /daily-reports for authenticated users with
 * `daily-report:read`. The page embeds a short-lived JWT in a hidden input
 * (never localStorage) and talks to the existing JSON API from
 * /api/assets/daily-reports.js.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLATFORM_VERSION } from "../../version.ts";
import type { Router } from "../router.ts";
import type { AppContainer } from "../types.ts";
import { hasPermission } from "./governance.ts";
import { forbidden } from "./route-helpers.ts";
import { sendHtml } from "./web.ts";

const TEMPLATE_PATH = join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "web",
  "templates",
  "daily-reports.html",
);

function renderPage(token: string): Promise<string> {
  return readFile(TEMPLATE_PATH, "utf8").then((html) =>
    html.replaceAll("{{API_TOKEN}}", token).replaceAll("{{VERSION}}", PLATFORM_VERSION),
  );
}

export function registerDailyReportUiRoutes(router: Router, container: AppContainer): void {
  router.get("/daily-reports", async (_req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "read")) {
      forbidden(res, "daily-report:read");
      return;
    }
    const subject = ctx?.subject ?? "unknown";
    const permissions = ctx?.permissions ?? [];
    const webToken =
      container.jwtIssuer !== undefined
        ? container.jwtIssuer.issue(subject, permissions, ctx?.organizationId)
        : "";
    const html = await renderPage(webToken);
    sendHtml(res, 200, html);
  });
}
