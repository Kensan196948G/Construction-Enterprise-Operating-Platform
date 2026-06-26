/**
 * Shared type definitions for the HTTP API layer.
 *
 * This module is the single source of truth for cross-cutting API types
 * (auth context, request/response shapes, DI container) so that circular
 * import cycles between the router, middleware, and route modules are avoided.
 */

import type { Permission } from "../domain/role.ts";
import type { Repositories } from "../persistence/ports.ts";
import type { AuditLog } from "../governance/audit-log.ts";

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
}

// ---------------------------------------------------------------------------
// Dependency-injection container
// ---------------------------------------------------------------------------

/** Application-level service container wired up at bootstrap. */
export interface AppContainer {
  readonly repositories: Repositories;
  readonly auditLog: AuditLog;
  readonly apiKeyStore: ApiKeyStore;
}
