/**
 * CEOP gateway reverse proxy.
 *
 * Forwards an authenticated/authorized API request to a registered
 * integration service. Identity is propagated to the upstream through
 * `X-CEOP-*` headers (set by CEOP, never trusted from the client), and an
 * optional service-to-service Bearer token is attached from the environment.
 */

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { ServerResponse } from "node:http";
import type { GatewayService } from "../../domain/gateway-service.ts";
import type { ApiKeyContext, ApiRequest } from "../types.ts";
import { writeJson } from "../router.ts";

/** Headers that are safe to relay to an upstream integration service. */
const FORWARD_HEADERS = new Set(["content-type", "accept", "accept-encoding"]);

/**
 * Sanitize the captured proxy suffix before it is appended to the upstream
 * base URL. Returns `null` when the path is unsafe (traversal, control
 * characters, double-encoding).
 */
export function sanitizeProxyPath(suffix: string): string | null {
  const clean = suffix.replace(/^\/+/, "");
  if (clean.length === 0) {
    return "";
  }
  if (clean.includes("\0") || clean.includes("\\") || clean.includes("%")) {
    return null;
  }
  const segments = clean.split("/");
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    return null;
  }
  return clean;
}

const GATEWAY_RESPONSE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
} as const;

/**
 * Forward `req` to the integration service and stream the upstream response.
 *
 * Returns the upstream HTTP status (or a synthesized 502/504). The caller is
 * responsible for audit recording.
 */
export function forwardToUpstream(
  service: GatewayService,
  req: ApiRequest,
  res: ServerResponse,
  ctx: ApiKeyContext,
  suffix: string,
): Promise<number> {
  return new Promise<number>((resolve) => {
    const path = sanitizeProxyPath(suffix);
    if (path === null) {
      writeJson(res, 400, { error: "Bad Request", message: "invalid proxy path" });
      resolve(400);
      return;
    }

    let base: URL;
    try {
      base = new URL(service.baseUrl);
    } catch {
      writeJson(res, 502, { error: "Bad Gateway", message: "invalid upstream base URL" });
      resolve(502);
      return;
    }

    const queryIdx = req.url.indexOf("?");
    const query = queryIdx === -1 ? "" : req.url.slice(queryIdx);
    const basePath = base.pathname.replace(/\/+$/, "");
    const upstreamPath = path === "" ? basePath || "/" : `${basePath}/${path}`;
    const target = `${service.baseUrl}${upstreamPath}${query}`;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (FORWARD_HEADERS.has(lower) && typeof value === "string") {
        headers[key] = value;
      }
    }
    headers["X-CEOP-Subject"] = ctx.subject;
    headers["X-CEOP-Organization-Id"] = ctx.organizationId ?? "";
    headers["X-CEOP-Permissions"] = JSON.stringify(ctx.permissions);
    headers["X-CEOP-Service-Id"] = service.id;
    if (service.upstreamTokenEnv !== undefined) {
      const token = process.env[service.upstreamTokenEnv];
      if (token !== undefined && token !== "") {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const transport = base.protocol === "https:" ? httpsRequest : httpRequest;
    let settled = false;
    const fail = (status: number, error: string, message: string): void => {
      if (settled) return;
      settled = true;
      if (!res.headersSent && !res.writableEnded) {
        writeJson(res, status, { error, message });
      }
      resolve(status);
    };

    const upstreamReq = transport(target, { method: req.method, headers }, (upstreamRes) => {
      if (settled) return;
      settled = true;
      const status = upstreamRes.statusCode ?? 502;
      res.writeHead(status, {
        "Content-Type": upstreamRes.headers["content-type"] ?? "application/octet-stream",
        ...GATEWAY_RESPONSE_HEADERS,
      });
      upstreamRes.pipe(res);
      upstreamRes.on("error", () => {
        if (!res.writableEnded) res.destroy();
      });
      upstreamRes.on("end", () => resolve(status));
    });

    const timer = setTimeout(() => {
      upstreamReq.destroy(new Error("gateway upstream timeout"));
      fail(504, "Gateway Timeout", `upstream timeout after ${service.timeoutMs}ms: ${service.id}`);
    }, service.timeoutMs);
    timer.unref();

    upstreamReq.on("error", (e) => {
      clearTimeout(timer);
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EHOSTUNREACH") {
        fail(502, "Bad Gateway", `upstream unreachable: ${service.id}`);
      } else if (!settled) {
        fail(502, "Bad Gateway", `upstream error: ${service.id}`);
      }
    });

    if (req.body !== undefined) {
      upstreamReq.write(JSON.stringify(req.body));
    }
    upstreamReq.end();
  });
}
