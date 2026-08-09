/**
 * Shared type definitions for the HTTP API layer.
 *
 * This module is the single source of truth for cross-cutting API types
 * (auth context, request/response shapes, DI container) so that circular
 * import cycles between the router, middleware, and route modules are avoided.
 */

import type { Permission } from "../domain/role.ts";
import type { Repositories } from "../persistence/ports.ts";
import type { ApiKeyRepository } from "../persistence/sqlite/api-key-repository.ts";
import type { IAuditLog } from "../governance/audit-log.ts";
import type { JwtIssuer } from "./middleware/jwt.ts";
import type { GatewayService } from "../domain/gateway-service.ts";

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

/** Parsed incoming API request with routing metadata already extracted. */
export interface ApiRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly body?: unknown;
  /** Raw UTF-8 request body (POST/PUT/PATCH), used for signature verification. */
  readonly rawBody?: string;
  /**
   * TCP-layer remote address (`socket.remoteAddress`).
   * Populated by the router; use this for rate-limiting — it cannot be
   * spoofed by clients, unlike X-Forwarded-For.
   */
  readonly remoteAddress?: string;
}

/** Successful API response envelope. */
export interface ApiResponse<T> {
  readonly status: number;
  readonly data: T;
}

/** Standard error response body emitted on failures. */
export interface ErrorResponse {
  readonly error: string;
  readonly message: string;
  readonly details?: unknown;
}

// ---------------------------------------------------------------------------
// API key auth types
// ---------------------------------------------------------------------------

/** Record stored in the ApiKeyStore for a registered credential. */
export interface ApiKeyRecord {
  readonly keyId: string;
  readonly subject: string;
  readonly permissions: readonly Permission[];
  /** Organization the credential is scoped to; undefined = global (platform-level). */
  readonly organizationId?: string;
  /** HMAC-SHA256 of the secret, keyed on keyId. Never store the raw secret. */
  readonly secretHash: string;
}

/**
 * In-memory map of keyId → ApiKeyRecord.
 * Production deployments would replace this with a persistent store.
 */
export type ApiKeyStore = Map<string, ApiKeyRecord>;

/** Identity context resolved from a validated API key, attached to route handlers. */
export interface ApiKeyContext {
  readonly keyId: string;
  readonly subject: string;
  readonly permissions: readonly Permission[];
  /** Organization scope of the authenticated identity; undefined = global. */
  readonly organizationId?: string;
  /** How the caller authenticated — used for JWT-specific operations (e.g. revocation). */
  readonly authKind: "apikey" | "jwt";
}

// ---------------------------------------------------------------------------
// Dependency-injection container
// ---------------------------------------------------------------------------

/** Re-export so callers only need to import from this module. */
export type { JwtIssuer };

/** Application-level service container wired up at bootstrap. */
export interface AppContainer {
  readonly repositories: Repositories;
  readonly auditLog: IAuditLog;
  readonly apiKeyStore: ApiKeyStore;
  /** Persistent API key management surface (SQLite mode); absent for in-memory/file tiers. */
  readonly apiKeyRepository?: ApiKeyRepository;
  /** Persistence tier in use — used by the readiness probe. */
  readonly storageTier?: "in-memory" | "file" | "sqlite";
  /** Optional JWT issuer/verifier — when present, Bearer JWT tokens are accepted. */
  readonly jwtIssuer?: JwtIssuer;
  /** Validated integration gateway service registrations (P1). */
  readonly gatewayServices?: readonly GatewayService[];
}
