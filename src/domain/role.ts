import { type Brand, type Result, ValidationBuilder, err, ok } from "./common.ts";

export type RoleId = Brand<string, "RoleId">;
export const roleId = (value: string): RoleId => value as RoleId;

/**
 * A permission string in `resource:action` form, e.g. `application:read`
 * (resource `application`, action `read`).
 * The wildcard `*` is allowed on either side, e.g. `*:*`, `audit:*`.
 */
export type Permission = Brand<string, "Permission">;

const PERMISSION_PATTERN = /^(\*|[a-z][a-z0-9-]*):(\*|[a-z][a-z0-9-]*)$/;

export function toPermission(value: string): Result<Permission> {
  if (!PERMISSION_PATTERN.test(value)) {
    return err([{ path: "permission", message: `invalid permission: ${value}` }]);
  }
  return ok(value as Permission);
}

/** Governs how widely a role's permissions apply. */
export const ROLE_SCOPES = ["global", "organization", "site"] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

export interface Role {
  readonly id: RoleId;
  readonly name: string;
  readonly description: string;
  readonly scope: RoleScope;
  readonly permissions: readonly Permission[];
}

export interface CreateRoleInput {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly scope: RoleScope;
  readonly permissions: readonly string[];
}

export function createRole(input: CreateRoleInput): Result<Role> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.name, "name")
    .oneOf(input.scope, ROLE_SCOPES, "scope")
    .require(
      input.permissions.length > 0,
      "permissions",
      "a role must grant at least one permission",
    )
    .build();

  const permissions: Permission[] = [];
  input.permissions.forEach((raw, index) => {
    const parsed = toPermission(raw);
    if (parsed.ok) {
      permissions.push(parsed.value);
    } else {
      issues.push({ path: `permissions[${index}]`, message: `invalid permission: ${raw}` });
    }
  });

  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    id: roleId(input.id),
    name: input.name,
    description: input.description,
    scope: input.scope,
    permissions,
  });
}
