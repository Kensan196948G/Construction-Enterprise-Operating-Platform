// FILE: src/api/server.ts
/**
 * HTTP server factory.
 *
 * Wires the router, route groups, and DI container into a single node:http
 * Server. The factory is pure: it does not bind to a port — the caller controls
 * lifecycle via `server.listen()`.
 */

import { createServer as httpCreateServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Router } from "./router.ts";
import { createRateLimiter } from "./middleware/rate-limiter.ts";
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerHealthRoutes } from "./routes/health.ts";
import { registerGovernanceRoutes } from "./routes/governance.ts";
import { registerDashboardRoutes } from "./routes/dashboard.ts";
import { registerWebRoutes } from "./routes/web.ts";
import { registerEntityCrudRoutes } from "./routes/entity-crud.ts";
import { registerWorkflowRoutes } from "./routes/workflows.ts";
import type { AppContainer } from "./types.ts";

export interface ServerConfig {
  readonly port: number;
  readonly host?: string;
  readonly corsOrigin?: string;
  /** Optional global API rate limit (per socket IP). Defaults from env or 300 req/min. */
  readonly rateLimit?: { readonly maxRequests: number; readonly windowMs: number };
}

export function createServer(config: ServerConfig, container: AppContainer): Server {
  // CORS is opt-in: only emit Access-Control-* headers when an explicit origin is
  // provided via config or the CEOP_CORS_ORIGIN environment variable.
  // Defaulting to "*" would allow any origin to read authenticated API responses.
  const corsOrigin = config.corsOrigin ?? process.env["CEOP_CORS_ORIGIN"];
  const rateLimitMaxRaw = Number(process.env["CEOP_RATE_LIMIT_MAX"] ?? "300");
  const rateLimitWindowRaw = Number(process.env["CEOP_RATE_LIMIT_WINDOW_MS"] ?? "60000");
  const rateLimit =
    config.rateLimit ??
    (Number.isSafeInteger(rateLimitMaxRaw) &&
    rateLimitMaxRaw > 0 &&
    Number.isSafeInteger(rateLimitWindowRaw) &&
    rateLimitWindowRaw > 0
      ? { maxRequests: rateLimitMaxRaw, windowMs: rateLimitWindowRaw }
      : { maxRequests: 300, windowMs: 60_000 });
  const apiRateLimiter = createRateLimiter({
    maxRequests: rateLimit.maxRequests,
    windowMs: rateLimit.windowMs,
  });
  const router = new Router({
    apiKeyStore: container.apiKeyStore,
    ...(container.jwtIssuer !== undefined ? { jwtIssuer: container.jwtIssuer } : {}),
  });
  registerHealthRoutes(router, container);
  if (container.jwtIssuer !== undefined) {
    registerAuthRoutes(router, container.apiKeyStore, container.jwtIssuer, container.auditLog);
  }
  registerGovernanceRoutes(router, container);
  registerDashboardRoutes(router, container);
  registerEntityCrudRoutes(router, container);
  registerWorkflowRoutes(router, container);
  registerWebRoutes(router, container);

  return httpCreateServer((req: IncomingMessage, res: ServerResponse): void => {
    if (corsOrigin !== undefined) {
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Max-Age", "86400");
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Global API rate limit (per socket IP) — applies to all /api/v1/* paths.
    const pathOnly = (req.url ?? "/").split("?")[0] ?? "/";
    if (pathOnly.startsWith("/api/v1/")) {
      const clientIp = req.socket?.remoteAddress;
      if (clientIp !== undefined) {
        const rl = apiRateLimiter.check(clientIp);
        res.setHeader("X-RateLimit-Limit", String(rateLimit.maxRequests));
        res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
        res.setHeader("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
        if (!rl.allowed) {
          res.writeHead(429, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Too Many Requests", message: "rate limit exceeded" }));
          return;
        }
      }
    }

    router.handle(req, res).catch((e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[server] fatal dispatch error:", message);
      if (!res.headersSent && !res.writableEnded) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });
}
