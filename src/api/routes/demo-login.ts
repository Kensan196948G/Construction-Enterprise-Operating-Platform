/**
 * Demo-only browser login (MVP / Prototype review).
 *
 * Exchanges an API key for a short-lived HttpOnly JWT session cookie so a
 * reviewer can operate the SSR consoles (/dashboard, /daily-reports,
 * /iso-app) from a browser without attaching Bearer headers manually.
 *
 * These routes are registered ONLY when the server runs in demo mode
 * (development + CEOP_SEED_DEMO / CEOP_SEED_RICH_DEMO) — never in production.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ServerResponse } from "node:http";
import { DEMO_SESSION_COOKIE } from "../router.ts";
import { writeJson } from "../router.ts";
import { validateApiKey } from "../middleware/auth.ts";
import { createRateLimiter } from "../middleware/rate-limiter.ts";
import type { Router } from "../router.ts";
import type { ApiRequest, AppContainer } from "../types.ts";
import { PLATFORM_VERSION } from "../../version.ts";

const LOGIN_PAGE_PATH = join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "web",
  "templates",
  "demo-login.html",
);

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8h — covers a review session.

function setSessionCookie(res: ServerResponse, token: string, secure: boolean): void {
  const parts = [
    `${DEMO_SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res: ServerResponse): void {
  res.setHeader("Set-Cookie", `${DEMO_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

/** Behind Cloudflare Tunnel the origin sees HTTP; the browser sees HTTPS. */
function isSecureRequest(req: ApiRequest): boolean {
  const proto = req.headers["x-forwarded-proto"];
  return typeof proto === "string" && proto.toLowerCase() === "https";
}

async function renderLoginPage(): Promise<string> {
  const keyId = process.env["CEOP_E2E_API_KEY_ID"] ?? "";
  const secret = process.env["CEOP_E2E_API_KEY_SECRET"] ?? "";
  const html = await readFile(LOGIN_PAGE_PATH, "utf8");
  return html
    .replaceAll("{{DEMO_KEY}}", keyId)
    .replaceAll("{{DEMO_SECRET}}", secret)
    .replaceAll("{{VERSION}}", PLATFORM_VERSION);
}

export function registerDemoLoginRoutes(router: Router, container: AppContainer): void {
  const jwtIssuer = container.jwtIssuer;
  if (jwtIssuer === undefined) {
    return;
  }
  const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

  router.get(
    "/demo-login",
    async (_req, _ctx, res) => {
      const buf = Buffer.from(await renderLoginPage(), "utf8");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": buf.byteLength,
        "Cache-Control": "no-store",
      });
      res.end(buf);
    },
    false,
  );

  router.post(
    "/api/v1/auth/demo-login",
    async (req, _ctx, res) => {
      const key = req.remoteAddress;
      if (key !== undefined) {
        const rl = rateLimiter.check(key);
        if (!rl.allowed) {
          writeJson(res, 429, {
            error: "Too Many Requests",
            message: "rate limit exceeded — retry after the reset time",
          });
          return;
        }
      }

      const body = req.body as Record<string, unknown> | undefined;
      const keyId = typeof body?.["keyId"] === "string" ? body["keyId"] : "";
      const secret = typeof body?.["secret"] === "string" ? body["secret"] : "";
      if (keyId === "" || secret === "") {
        writeJson(res, 400, {
          error: "Bad Request",
          message: 'body must be { "keyId": "...", "secret": "..." }',
        });
        return;
      }

      const result = validateApiKey(`${keyId}:${secret}`, container.apiKeyStore);
      if (!result.ok) {
        writeJson(res, 401, { error: "Unauthorized", message: "invalid credentials" });
        return;
      }

      const token = jwtIssuer.issue(
        result.value.subject,
        result.value.permissions,
        result.value.organizationId,
      );
      setSessionCookie(res, token, isSecureRequest(req));
      writeJson(res, 200, { ok: true, redirect: "/dashboard" });
    },
    false,
  );

  router.post(
    "/api/v1/auth/demo-logout",
    async (_req, _ctx, res) => {
      clearSessionCookie(res);
      writeJson(res, 200, { ok: true, redirect: "/demo-login" });
    },
    false,
  );
}
