// FILE: src/domain/access-inventory.ts
/**
 * Access inventory — "who can access what" aggregation for RBAC audits.
 *
 * This module contains no persistence of its own: it is a pure projection over
 * the existing {@link User} and {@link Role} domain models, built fresh on every
 * call from whatever repository snapshot the caller supplies. That keeps the
 * report always consistent with the live role/user data and avoids introducing
 * a second source of truth for permission grants.
 */

import type { IsoTimestamp } from "./common.ts";
import type { Permission, Role, RoleId, RoleScope } from "./role.ts";
import type { User, UserId, UserStatus } from "./user.ts";
import type { OrganizationId } from "./organization.ts";

/** Minimal role facts surfaced per user — enough to explain *why* a permission was granted. */
export interface AccessInventoryRoleSummary {
  readonly id: RoleId;
  readonly name: string;
  readonly scope: RoleScope;
}

/** One user's resolved access: their roles and the permissions those roles grant. */
export interface AccessInventoryEntry {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly email: string;
  readonly status: UserStatus;
  readonly roles: readonly AccessInventoryRoleSummary[];
  /** De-duplicated union of permissions granted by `roles`, in first-seen order. */
  readonly permissions: readonly Permission[];
  /**
   * `roleIds` on the user record that did not resolve to a known role (e.g. a
   * role deleted after assignment). Surfaced rather than silently dropped so an
   * auditor can spot orphaned assignments.
   */
  readonly unresolvedRoleIds: readonly RoleId[];
}

/** Aggregate counters over the full entry set, computed before any pagination. */
export interface AccessInventorySummary {
  readonly totalUsers: number;
  readonly totalRoles: number;
  /** Number of distinct users holding each permission, keyed by permission string. */
  readonly usersByPermission: Readonly<Record<string, number>>;
}

export interface AccessInventoryReport {
  readonly generatedAt: IsoTimestamp;
  readonly entries: readonly AccessInventoryEntry[];
  readonly summary: AccessInventorySummary;
}

/** Flatten and de-duplicate the permissions granted by a set of roles. */
function flattenPermissions(roles: readonly Role[]): Permission[] {
  const seen = new Set<string>();
  const result: Permission[] = [];
  for (const role of roles) {
    for (const permission of role.permissions) {
      if (!seen.has(permission)) {
        seen.add(permission);
        result.push(permission);
      }
    }
  }
  return result;
}

/**
 * Build a full access-inventory report: for every user, which roles they hold
 * and which permissions those roles resolve to, plus a platform-wide summary.
 *
 * Pure function — no I/O, no mutation of its inputs. Callers are expected to
 * pass an already-scoped `users` slice (e.g. filtered to one organization) when
 * a tenant-scoped view is required; `roles` is typically the full role set
 * since roles are not themselves organization-scoped records.
 */
export function buildAccessInventory(
  users: readonly User[],
  roles: readonly Role[],
  generatedAt: IsoTimestamp,
): AccessInventoryReport {
  const roleById = new Map<RoleId, Role>(roles.map((role) => [role.id, role]));
  const usersByPermission: Record<string, number> = {};

  const entries: AccessInventoryEntry[] = users.map((user) => {
    const matchedRoles: Role[] = [];
    const unresolvedRoleIds: RoleId[] = [];
    for (const roleId of user.roleIds) {
      const role = roleById.get(roleId);
      if (role !== undefined) {
        matchedRoles.push(role);
      } else {
        unresolvedRoleIds.push(roleId);
      }
    }

    const permissions = flattenPermissions(matchedRoles);
    for (const permission of permissions) {
      usersByPermission[permission] = (usersByPermission[permission] ?? 0) + 1;
    }

    return {
      userId: user.id,
      organizationId: user.organizationId,
      displayName: user.displayName,
      email: user.email,
      status: user.status,
      roles: matchedRoles.map((role) => ({ id: role.id, name: role.name, scope: role.scope })),
      permissions,
      unresolvedRoleIds,
    };
  });

  return {
    generatedAt,
    entries,
    summary: {
      totalUsers: users.length,
      totalRoles: roles.length,
      usersByPermission,
    },
  };
}
