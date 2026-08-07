/**
 * WebUI static file server.
 *
 * Serves the unpacked design bundle (`webui/dist`) with zero runtime
 * dependencies (node:http + node:fs). Mirrors the API server factory style:
 * `createWebuiServer` wires everything but does not bind — the caller owns
 * the listen() lifecycle.
 *
 * Security posture:
 * - Path traversal is blocked by resolving against the root and requiring
 *   the result to stay inside it.
 * - Only GET/HEAD are accepted (405 otherwise).
 * - CSP allows 'unsafe-eval' for scripts because the design runtime compiles
 *   its `text/x-dc` component source with `new Function` — a constraint of
 *   the delivered design bundle, isolated to this static host process.
 * - UUID-named assets are immutable-cached; index.html is always revalidated.
 */

import { createServer as httpCreateServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { extname, resolve, sep } from "node:path";

import { PLATFORM_VERSION } from "../version.ts";
import { clientIpFromRequest } from "../api/client-ip.ts";
import { type AccessLogger, nullAccessLogger } from "./access-log.ts";

export interface WebuiServerConfig {
  /** Directory containing index.html and assets/ (the unpacked bundle). */
  readonly rootDir: string;
  /** Optional access logger; defaults to a no-op. */
  readonly accessLogger?: AccessLogger;
}

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
};

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
    "font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; " +
    "form-action 'none'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

function applySecurityHeaders(res: ServerResponse): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown, head: boolean): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(head ? undefined : payload);
}

export function createWebuiServer(config: WebuiServerConfig): Server {
  const rootDir = resolve(config.rootDir);
  const accessLogger = config.accessLogger ?? nullAccessLogger;

  const server = httpCreateServer((req: IncomingMessage, res: ServerResponse): void => {
    const startedAt = process.hrtime.bigint();
    res.setHeader("X-Request-Id", randomUUID());
    const method = req.method ?? "GET";
    const rawPath = (req.url ?? "/").split("?")[0] ?? "/";

    // Log page-level traffic only: asset fan-out (500+ fonts on first paint)
    // would multiply row volume without adding operational signal.
    res.on("finish", () => {
      if (rawPath.startsWith("/assets/")) return;
      const durationMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
      const entry = {
        method,
        path: rawPath.slice(0, 512),
        statusCode: res.statusCode,
        durationMs,
        ...(req.socket.remoteAddress !== undefined ? { remoteAddr: clientIpFromRequest(req) } : {}),
        ...(typeof req.headers["user-agent"] === "string"
          ? { userAgent: req.headers["user-agent"].slice(0, 256) }
          : {}),
      };
      accessLogger.log(entry);
    });

    applySecurityHeaders(res);

    const head = method === "HEAD";
    if (method !== "GET" && method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      sendJson(res, 405, { error: "Method Not Allowed" }, head);
      return;
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent(rawPath);
    } catch {
      sendJson(res, 400, { error: "Bad Request", message: "malformed percent-encoding" }, head);
      return;
    }
    if (pathname.includes("\0")) {
      sendJson(res, 400, { error: "Bad Request", message: "invalid path" }, head);
      return;
    }

    if (pathname === "/healthz") {
      sendJson(res, 200, { status: "ok", service: "ceop-webui", version: PLATFORM_VERSION }, head);
      return;
    }

    // The design bundle is a single-page app whose screens live in client
    // state (no deep-link routes), so extension-less paths fall back to the
    // shell; only real file lookups can 404.
    const wantsFile = extname(pathname) !== "";
    const relative = pathname === "/" || !wantsFile ? "index.html" : pathname.slice(1);

    const filePath = resolve(rootDir, relative);
    if (filePath !== rootDir && !filePath.startsWith(rootDir + sep)) {
      sendJson(res, 404, { error: "Not Found" }, head);
      return;
    }

    let size: number;
    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        sendJson(res, 404, { error: "Not Found" }, head);
        return;
      }
      size = stats.size;
    } catch {
      sendJson(res, 404, { error: "Not Found" }, head);
      return;
    }

    const mime = MIME_BY_EXTENSION[extname(filePath)] ?? "application/octet-stream";
    // UUID-named assets never change content under the same name; the shell
    // document must always be revalidated so redeploys take effect.
    const cacheControl = pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache";
    res.writeHead(200, {
      "Content-Type": mime,
      "Content-Length": size,
      "Cache-Control": cacheControl,
    });
    if (head) {
      res.end();
      return;
    }
    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on("error", () => {
      // File disappeared between stat and read; terminate the response.
      res.destroy();
    });
  });

  server.headersTimeout = 60_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  return server;
}
