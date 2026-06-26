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
import { validateApiKey } from "../middleware/auth.ts";
import type { JwtIssuer } from "../middleware/jwt.ts";
import { createRateLimiter } from "../middleware/rate-limiter.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import type { ApiKeyStore, ApiRequest } from "../types.ts";

// 10 requests per minute per client IP — enough for interactive use, tight
// enough to blunt credential-stuffing at scale.
const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

/** Extract the best available client identifier for rate-limiting purposes. */
function clientKey(req: ApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp;
  return "unknown";
}

export function registerAuthRoutes(
  router: Router,
  apiKeyStore: ApiKeyStore,
  jwtIssuer: JwtIssuer,
): void {
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
      const token = jwtIssuer.issue(subject, permissions);
      const expiresIn = 3600;

      writeJson(res, 200, { token, expiresIn, subject });
    },
    false, // public route — auth handled internally
  );
}
