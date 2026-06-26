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
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerHealthRoutes } from "./routes/health.ts";
import { registerGovernanceRoutes } from "./routes/governance.ts";
import { registerDashboardRoutes } from "./routes/dashboard.ts";
import { registerWebRoutes } from "./routes/web.ts";
import type { AppContainer } from "./types.ts";

export interface ServerConfig {
  readonly port: number;
  readonly host?: string;
  readonly corsOrigin?: string;
}

export function createServer(config: ServerConfig, container: AppContainer): Server {
  const corsOrigin = config.corsOrigin ?? "*";
  const router = new Router({
    apiKeyStore: container.apiKeyStore,
    ...(container.jwtIssuer !== undefined ? { jwtIssuer: container.jwtIssuer } : {}),
  });
  registerHealthRoutes(router);
  if (container.jwtIssuer !== undefined) {
    registerAuthRoutes(router, container.apiKeyStore, container.jwtIssuer);
  }
  registerGovernanceRoutes(router, container);
  registerDashboardRoutes(router, container);
  registerWebRoutes(router, container);

  return httpCreateServer((req: IncomingMessage, res: ServerResponse): void => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    router.handle(req, res).catch((e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[server] fatal dispatch error:", message);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  });
}
