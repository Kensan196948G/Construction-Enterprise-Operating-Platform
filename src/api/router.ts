// FILE: src/api/router.ts
/**
 * Lightweight HTTP router built on node:http primitives.
 *
 * Paths such as `/api/v1/users/:id` are compiled to a `RegExp` plus an ordered
 * list of parameter names. Handlers receive a parsed {@link ApiRequest}, the
 * resolved {@link ApiKeyContext} (or `null` for public routes), and the raw
 * `ServerResponse`, which they write to directly.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { validateApiKey } from "./middleware/auth.ts";
import type { JwtIssuer } from "./middleware/jwt.ts";
import { logRequest } from "./middleware/request-logger.ts";
import type { ApiKeyContext, ApiKeyStore, ApiRequest } from "./types.ts";

// ---------------------------------------------------------------------------
// Route types
// ---------------------------------------------------------------------------

/** A matched handler writes its response directly to `res`. */
export type RouteHandler = (
  req: ApiRequest,
  ctx: ApiKeyContext | null,
  res: ServerResponse,
) => Promise<void>;

interface Route {
  readonly method: string;
  readonly pattern: RegExp;
  readonly paramNames: readonly string[];
  readonly handler: RouteHandler;
  readonly requiresAuth: boolean;
}

const BEARER_PREFIX = "Bearer ";

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export interface RouterOptions {
  readonly apiKeyStore: ApiKeyStore;
  /** When present, Bearer JWT tokens are verified in addition to API key credentials. */
  readonly jwtIssuer?: JwtIssuer;
}

export class Router {
  readonly #routes: Route[] = [];
  readonly #apiKeyStore: ApiKeyStore;
  readonly #jwtIssuer: JwtIssuer | undefined;

  constructor(options: RouterOptions | ApiKeyStore) {
    if (options instanceof Map) {
      // Backward-compatible: accept a raw Map when jwtIssuer is not needed (e.g. tests).
      this.#apiKeyStore = options;
    } else {
      this.#apiKeyStore = options.apiKeyStore;
      this.#jwtIssuer = options.jwtIssuer;
    }
  }

  /**
   * Compile a path template into an anchored `RegExp` and its parameter names.
   * `/api/v1/users/:id` → `{ pattern: /^\/api\/v1\/users\/([^/]+)\/?$/, paramNames: ["id"] }`
   */
  #parsePath(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const compiled = path
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          paramNames.push(segment.slice(1));
          return "([^/]+)";
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    return { pattern: new RegExp(`^${compiled}/?$`), paramNames };
  }

  #add(method: string, path: string, handler: RouteHandler, requiresAuth: boolean): this {
    const { pattern, paramNames } = this.#parsePath(path);
    this.#routes.push({ method, pattern, paramNames, handler, requiresAuth });
    return this;
  }

  get(path: string, handler: RouteHandler, requiresAuth = true): this {
    return this.#add("GET", path, handler, requiresAuth);
  }

  post(path: string, handler: RouteHandler, requiresAuth = true): this {
    return this.#add("POST", path, handler, requiresAuth);
  }

  /** Find the first route matching `method` + `path`, extracting path params. */
  #match(method: string, path: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.#routes) {
      if (route.method !== method) {
        continue;
      }
      const groups = route.pattern.exec(path);
      if (groups === null) {
        continue;
      }
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        const value = groups[index + 1];
        if (value !== undefined) {
          params[name] = decodeURIComponent(value);
        }
      });
      return { route, params };
    }
    return null;
  }

  /** Resolve a request end-to-end: match, auth, body-parse, dispatch, log. */
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const startMs = Date.now();
    const method = (req.method ?? "GET").toUpperCase();
    const rawUrl = req.url ?? "/";

    const queryIdx = rawUrl.indexOf("?");
    const path = queryIdx === -1 ? rawUrl : rawUrl.slice(0, queryIdx);
    const search = queryIdx === -1 ? "" : rawUrl.slice(queryIdx + 1);
    const query = parseQueryString(search);

    const finish = (status: number): void => {
      logRequest(method, path, status, Date.now() - startMs);
    };

    let matched: { route: Route; params: Record<string, string> } | null;
    try {
      matched = this.#match(method, path);
    } catch {
      writeJson(res, 400, { error: "Bad Request", message: "malformed URL path encoding" });
      finish(400);
      return;
    }
    if (matched === null) {
      writeJson(res, 404, { error: "Not Found", message: `No route for ${method} ${path}` });
      finish(404);
      return;
    }

    let ctx: ApiKeyContext | null = null;
    if (matched.route.requiresAuth) {
      const header = req.headers["authorization"];
      const credential =
        typeof header === "string" && header.startsWith(BEARER_PREFIX)
          ? header.slice(BEARER_PREFIX.length).trim()
          : "";

      if (!credential) {
        writeJson(res, 401, {
          error: "Unauthorized",
          message: "a valid Bearer credential is required",
        });
        finish(401);
        return;
      }

      if (credential.includes(":")) {
        // API key format: keyId:secret — ":" is never present in base64url.
        const result = validateApiKey(credential, this.#apiKeyStore);
        if (!result.ok) {
          writeJson(res, 401, { error: "Unauthorized", message: "invalid credentials" });
          finish(401);
          return;
        }
        ctx = result.value;
      } else if (this.#jwtIssuer !== undefined) {
        // JWT Bearer token — base64url characters contain only [A-Za-z0-9_-] and ".".
        const result = this.#jwtIssuer.verify(credential);
        if (!result.ok) {
          const message = result.reason === "expired" ? "token expired" : "invalid credentials";
          writeJson(res, 401, { error: "Unauthorized", message });
          finish(401);
          return;
        }
        // JwtPayload.permissions are emitted as Permission-branded strings; cast is safe.
        ctx = {
          keyId: result.payload.jti,
          subject: result.payload.sub,
          permissions: result.payload.permissions as unknown as ApiKeyContext["permissions"],
        };
      } else {
        writeJson(res, 401, { error: "Unauthorized", message: "invalid credentials" });
        finish(401);
        return;
      }
    }

    let body: unknown;
    if (method === "POST") {
      try {
        body = await readJsonBody(req);
      } catch (e) {
        const message =
          e instanceof Error && e.message === "request body too large"
            ? "request body exceeds 1 MiB limit"
            : "request body must be valid JSON";
        writeJson(res, 400, { error: "Bad Request", message });
        finish(400);
        return;
      }
    }

    const apiRequest: ApiRequest = {
      method,
      url: rawUrl,
      headers: req.headers,
      params: matched.params,
      query,
      ...(body !== undefined ? { body } : {}),
      ...(req.socket?.remoteAddress !== undefined
        ? { remoteAddress: req.socket.remoteAddress }
        : {}),
    };

    try {
      await matched.route.handler(apiRequest, ctx, res);
    } catch (e) {
      console.error("[router] unhandled handler error:", e);
      if (!res.headersSent) {
        writeJson(res, 500, { error: "Internal Server Error", message: "unexpected error" });
      }
    }
    finish(res.statusCode);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 MiB — guard against heap-exhaustion DoS

/** Buffer the request body and JSON-parse it; empty bodies resolve to `undefined`. */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    const succeed = (value: unknown): void => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const fail = (error: Error): void => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        const error = new Error("request body too large");
        fail(error);
        req.destroy(error);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8").trim();
      if (raw.length === 0) {
        succeed(undefined);
        return;
      }
      try {
        succeed(JSON.parse(raw));
      } catch (e) {
        fail(e instanceof Error ? e : new Error(String(e)));
      }
    });
    req.on("error", (e: Error) => {
      fail(e);
    });
    req.on("close", () => {
      fail(new Error("request body aborted"));
    });
  });
}

/** Write a JSON response with the given status and `application/json` content type. */
export function writeJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

/** Parse a URL query string into a flat record; duplicate keys keep the last value. */
export function parseQueryString(search: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    result[key] = value;
  }
  return result;
}
