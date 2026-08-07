/**
 * Authentication routes.
 *
 * POST /api/v1/auth/token — exchange an API key credential for a short-lived JWT.
 *
 * The endpoint is public (no Bearer header required for the route itself), but
 * is guarded by a rate limiter to prevent credential-stuffing attacks.
 * The JWT carries the same subject + permissions as the API key; downstream
 * routes accept both API key and JWT Bearer tokens.
 */

import type { ServerResponse } from "node:http";
import type { IAuditLog } from "../../governance/audit-log.ts";
import { recordAudit } from "../audit.ts";
import { validateApiKey } from "../middleware/auth.ts";
import type { JwtIssuer } from "../middleware/jwt.ts";
import { createRateLimiter } from "../middleware/rate-limiter.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import type { ApiKeyStore, ApiRequest } from "../types.ts";
import type { ApiKeyInfo, ApiKeyRepository } from "../../persistence/sqlite/api-key-repository.ts";
import { hasPermission } from "./governance.ts";

/**
 * Return the TCP-layer remote address as the rate-limit key, or null when the
 * socket address is unavailable.
 *
 * X-Forwarded-For and X-Real-IP are intentionally ignored: they are
 * request headers that any client can forge, which would let attackers
 * bypass the rate limiter by cycling through fake IPs.  The socket's
 * remoteAddress is set by the OS and cannot be spoofed by the client.
 *
 * When the server runs behind a trusted reverse proxy, the proxy MUST be
 * configured to SNAT / rewrite the source IP so that Node.js sees the
 * real client IP on the socket (the default for most Docker/K8s setups).
 */
function clientKey(req: ApiRequest): string | null {
  return req.remoteAddress ?? null;
}

export function registerAuthRoutes(
  router: Router,
  apiKeyStore: ApiKeyStore,
  jwtIssuer: JwtIssuer,
  auditLog: IAuditLog,
  apiKeyRepository?: ApiKeyRepository,
): void {
  // 10 requests per minute per client IP — enough for interactive use, tight
  // enough to blunt credential-stuffing at scale.
  const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

  /**
   * POST /api/v1/auth/token
   *
   * Request body: { "credential": "keyId:secret" }
   * Response:     { "token": "<jwt>", "expiresIn": 3600, "subject": "<subject>" }
   */
  router.post(
    "/api/v1/auth/token",
    async (req: ApiRequest, _ctx, res: ServerResponse): Promise<void> => {
      // Rate limiting check.
      const key = clientKey(req);
      if (key === null) {
        writeJson(res, 400, {
          error: "Bad Request",
          message: "client address unavailable",
        });
        return;
      }
      const rl = rateLimiter.check(key);
      res.setHeader("X-RateLimit-Limit", "10");
      res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));

      if (!rl.allowed) {
        writeJson(res, 429, {
          error: "Too Many Requests",
          message: "rate limit exceeded — retry after the reset time",
        });
        return;
      }

      // Validate body shape.
      const body = req.body as Record<string, unknown> | undefined;
      if (typeof body?.["credential"] !== "string") {
        writeJson(res, 400, {
          error: "Bad Request",
          message: 'body must be { "credential": "keyId:secret" }',
        });
        return;
      }

      const credential = body["credential"] as string;

      // Authenticate the API key.
      const result = validateApiKey(credential, apiKeyStore);
      if (!result.ok) {
        writeJson(res, 401, { error: "Unauthorized", message: "invalid credentials" });
        return;
      }

      const { subject, permissions } = result.value;
      const token = jwtIssuer.issue(subject, permissions, result.value.organizationId);
      const expiresIn = jwtIssuer.ttlSeconds;

      recordAudit(
        auditLog,
        {
          keyId: result.value.keyId,
          subject,
          permissions,
          authKind: "apikey",
          ...(result.value.organizationId !== undefined
            ? { organizationId: result.value.organizationId }
            : {}),
        },
        "auth:token",
        "jwt",
        "success",
        {
          subject,
          keyId: result.value.keyId,
        },
      );
      writeJson(res, 200, { token, expiresIn, subject });
    },
    false, // public route — auth handled internally
  );

  // POST /api/v1/auth/revoke — revoke the caller's current JWT (logout).
  router.post("/api/v1/auth/revoke", async (_req, ctx, res) => {
    if (!hasPermission(ctx, "auth", "write")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'auth:write' permission" });
      return;
    }
    if (ctx === null || ctx.authKind !== "jwt") {
      writeJson(res, 400, {
        error: "Bad Request",
        message: "revocation requires a JWT Bearer token",
      });
      return;
    }
    const jti = ctx.keyId;
    jwtIssuer.revoke(jti);
    recordAudit(auditLog, ctx, "auth:revoke", jti, "success");
    writeJson(res, 200, { revoked: true });
  });

  // GET /api/v1/auth/keys — list API keys (metadata only, never the secret hash).
  // Key management is a platform-level capability: an org-scoped credential
  // must not be able to enumerate or revoke credentials outside its tenant.
  router.get("/api/v1/auth/keys", async (_req, ctx, res) => {
    if (!hasPermission(ctx, "auth", "write")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'auth:write' permission" });
      return;
    }
    if (ctx?.organizationId !== undefined) {
      writeJson(res, 403, {
        error: "Forbidden",
        message: "API key management requires a platform-level credential",
      });
      return;
    }
    const keys: readonly ApiKeyInfo[] =
      apiKeyRepository !== undefined
        ? apiKeyRepository.list()
        : [...apiKeyStore.values()].map((record) => ({
            keyId: record.keyId,
            subject: record.subject,
            permissions: record.permissions,
            ...(record.organizationId !== undefined
              ? { organizationId: record.organizationId }
              : {}),
          }));
    writeJson(res, 200, { keys });
  });

  // DELETE /api/v1/auth/keys/:keyId — revoke an API key (SEC-013).
  router.delete("/api/v1/auth/keys/:keyId", async (req, ctx, res) => {
    if (!hasPermission(ctx, "auth", "write")) {
      writeJson(res, 403, { error: "Forbidden", message: "requires 'auth:write' permission" });
      return;
    }
    if (ctx?.organizationId !== undefined) {
      writeJson(res, 403, {
        error: "Forbidden",
        message: "API key management requires a platform-level credential",
      });
      return;
    }
    const keyId = req.params["keyId"] ?? "";
    if (keyId.length === 0) {
      writeJson(res, 400, { error: "Bad Request", message: "keyId is required" });
      return;
    }
    const deleted =
      apiKeyRepository !== undefined ? apiKeyRepository.delete(keyId) : apiKeyStore.delete(keyId);
    // Keep the runtime store consistent when the row was deleted via SQLite.
    apiKeyStore.delete(keyId);
    if (!deleted) {
      writeJson(res, 404, { error: "Not Found", message: "API key not found" });
      return;
    }
    recordAudit(auditLog, ctx, "auth:key:delete", keyId, "success");
    writeJson(res, 200, { revoked: true, keyId });
  });
}
