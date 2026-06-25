import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  isEmailLike,
  ok,
} from "./common.ts";
import { type OrganizationId, organizationId } from "./organization.ts";
import { type RoleId, roleId } from "./role.ts";

export type UserId = Brand<string, "UserId">;
export const userId = (value: string): UserId => value as UserId;

export const USER_STATUSES = ["invited", "active", "suspended", "deactivated"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  readonly id: UserId;
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly email: string;
  readonly status: UserStatus;
  readonly roleIds: readonly RoleId[];
  readonly createdAt: IsoTimestamp;
}

export interface CreateUserInput {
  readonly id: string;
  readonly organizationId: string;
  readonly displayName: string;
  readonly email: string;
  readonly status: UserStatus;
  readonly roleIds: readonly string[];
  readonly createdAt: IsoTimestamp;
}

export function createUser(input: CreateUserInput): Result<User> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.displayName, "displayName")
    .oneOf(input.status, USER_STATUSES, "status")
    .require(isEmailLike(input.email), "email", "email must be a valid address")
    .build();

  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    id: userId(input.id),
    organizationId: organizationId(input.organizationId),
    displayName: input.displayName,
    email: input.email,
    status: input.status,
    roleIds: input.roleIds.map(roleId),
    createdAt: input.createdAt,
  });
}

/** A user can act only when their account is active. */
export const isActiveUser = (user: User): boolean => user.status === "active";
