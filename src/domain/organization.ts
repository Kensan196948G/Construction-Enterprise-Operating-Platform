import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type OrganizationId = Brand<string, "OrganizationId">;
export const organizationId = (value: string): OrganizationId => value as OrganizationId;

/** Construction company structural units governed by the platform. */
export const ORGANIZATION_TYPES = ["headquarters", "branch", "site", "partner"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_STATUSES = ["active", "suspended", "archived"] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly type: OrganizationType;
  readonly status: OrganizationStatus;
  /** Parent unit in the org hierarchy; absent for the top headquarters node. */
  readonly parentId?: OrganizationId;
  readonly createdAt: IsoTimestamp;
}

export interface CreateOrganizationInput {
  readonly id: string;
  readonly name: string;
  readonly type: OrganizationType;
  readonly status: OrganizationStatus;
  readonly parentId?: string;
  readonly createdAt: IsoTimestamp;
}

export function createOrganization(input: CreateOrganizationInput): Result<Organization> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.name, "name")
    .oneOf(input.type, ORGANIZATION_TYPES, "type")
    .oneOf(input.status, ORGANIZATION_STATUSES, "status")
    .require(
      input.type !== "headquarters" || input.parentId === undefined,
      "parentId",
      "headquarters must not have a parent organization",
    )
    .require(
      input.type === "headquarters" || (input.parentId !== undefined && input.parentId.trim().length > 0),
      "parentId",
      "non-headquarters organizations must specify a parent organization",
    )
    .build();

  if (issues.length > 0) {
    return err(issues);
  }

  const organization: Organization = {
    id: organizationId(input.id),
    name: input.name,
    type: input.type,
    status: input.status,
    createdAt: input.createdAt,
    ...(input.parentId !== undefined ? { parentId: organizationId(input.parentId) } : {}),
  };
  return ok(organization);
}
