/**
 * Gateway service domain — a registered integration service that CEOP proxies.
 *
 * P1 (integration gateway): each service declares an upstream base URL, a
 * CEOP path prefix, and the permissions required to call it. Requests are
 * authenticated/authorized by CEOP, forwarded with internal identity headers,
 * and recorded in the audit log.
 */

import { ValidationBuilder, err, ok, type Result, type ValidationIssue } from "./common.ts";
import { toPermission, type Permission } from "./role.ts";

const ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;

/** Raw, untrusted gateway service configuration (env JSON / test input). */
export interface GatewayServiceInput {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly pathPrefix: string;
  readonly readPermissions: readonly string[];
  readonly writePermissions: readonly string[];
  readonly timeoutMs?: number;
  /** Environment variable name holding the upstream service's Bearer token. */
  readonly upstreamTokenEnv?: string;
  readonly enabled?: boolean;
}

/** Validated gateway service registration. */
export interface GatewayService {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly pathPrefix: string;
  readonly readPermissions: readonly Permission[];
  readonly writePermissions: readonly Permission[];
  readonly timeoutMs: number;
  readonly upstreamTokenEnv?: string;
  readonly enabled: boolean;
}

function validateUrl(value: string, issues: ValidationBuilder): boolean {
  if (!/^https?:\/\//i.test(value)) {
    issues.require(false, "baseUrl", "baseUrl must start with http:// or https://");
    return false;
  }
  try {
    const url = new URL(value);
    if (url.username !== "" || url.password !== "") {
      issues.require(false, "baseUrl", "baseUrl must not contain credentials");
      return false;
    }
    if (url.search !== "" || url.hash !== "") {
      issues.require(false, "baseUrl", "baseUrl must not contain query or fragment");
      return false;
    }
    return true;
  } catch {
    issues.require(false, "baseUrl", `invalid baseUrl: ${value}`);
    return false;
  }
}

function validatePrefix(value: string, issues: ValidationBuilder): boolean {
  if (!/^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(value)) {
    issues.require(
      false,
      "pathPrefix",
      "pathPrefix must match /segments of [a-z0-9-] and not end with /",
    );
    return false;
  }
  return true;
}

/** Create a validated gateway service. Invalid input returns field issues. */
export function createGatewayService(input: GatewayServiceInput): Result<GatewayService> {
  const issues = new ValidationBuilder();
  issues.require(
    ID_PATTERN.test(String(input.id ?? "")),
    "id",
    "id must match [a-z][a-z0-9-]{0,63}",
  );
  issues.require(
    typeof input.name === "string" && input.name.trim().length > 0,
    "name",
    "name is required",
  );
  const urlOk = validateUrl(String(input.baseUrl ?? ""), issues);
  const prefixOk = validatePrefix(String(input.pathPrefix ?? ""), issues);

  const readPerms: Permission[] = [];
  for (const raw of Array.isArray(input.readPermissions) ? input.readPermissions : []) {
    const parsed = toPermission(String(raw ?? ""));
    if (parsed.ok) {
      readPerms.push(parsed.value);
    } else {
      issues.require(false, "readPermissions", `invalid permission: ${raw}`);
    }
  }
  const writePerms: Permission[] = [];
  for (const raw of Array.isArray(input.writePermissions) ? input.writePermissions : []) {
    const parsed = toPermission(String(raw ?? ""));
    if (parsed.ok) {
      writePerms.push(parsed.value);
    } else {
      issues.require(false, "writePermissions", `invalid permission: ${raw}`);
    }
  }
  issues.require(readPerms.length > 0, "readPermissions", "readPermissions must not be empty");
  issues.require(writePerms.length > 0, "writePermissions", "writePermissions must not be empty");

  const timeoutMs =
    input.timeoutMs === undefined
      ? DEFAULT_TIMEOUT_MS
      : Number.isSafeInteger(input.timeoutMs) && input.timeoutMs > 0
        ? input.timeoutMs
        : 0;
  issues.require(
    timeoutMs > 0 && timeoutMs <= MAX_TIMEOUT_MS,
    "timeoutMs",
    `timeoutMs must be between 1 and ${MAX_TIMEOUT_MS}`,
  );

  if (input.upstreamTokenEnv !== undefined) {
    issues.require(
      /^[A-Z][A-Z0-9_]{0,127}$/.test(input.upstreamTokenEnv),
      "upstreamTokenEnv",
      "upstreamTokenEnv must be an UPPER_SNAKE environment variable name",
    );
  }

  const problems = issues.build();
  if (problems.length > 0 || !urlOk || !prefixOk) {
    return err(problems);
  }

  return ok({
    id: input.id,
    name: input.name.trim(),
    baseUrl: input.baseUrl.replace(/\/+$/, ""),
    pathPrefix: input.pathPrefix,
    readPermissions: readPerms,
    writePermissions: writePerms,
    timeoutMs,
    ...(input.upstreamTokenEnv !== undefined ? { upstreamTokenEnv: input.upstreamTokenEnv } : {}),
    enabled: input.enabled !== false,
  });
}

/** Resolve the permission list for a method (GET/HEAD → read, others → write). */
export function permissionsForMethod(
  service: GatewayService,
  method: string,
): readonly Permission[] {
  return method === "GET" || method === "HEAD" ? service.readPermissions : service.writePermissions;
}

export type { ValidationIssue };
