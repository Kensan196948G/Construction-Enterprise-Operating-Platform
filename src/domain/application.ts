import { type Brand, type Result, ValidationBuilder, err, ok } from "./common.ts";
import { type OrganizationId, organizationId } from "./organization.ts";

export type ApplicationId = Brand<string, "ApplicationId">;
export const applicationId = (value: string): ApplicationId => value as ApplicationId;

/** Functional categories aligned with the README module map. */
export const APPLICATION_CATEGORIES = [
  "portal",
  "governance",
  "field",
  "workflow",
  "document",
] as const;
export type ApplicationCategory = (typeof APPLICATION_CATEGORIES)[number];

/** Operational health reported into the role-based dashboard. */
export const APPLICATION_HEALTH = ["healthy", "degraded", "down", "unknown"] as const;
export type ApplicationHealth = (typeof APPLICATION_HEALTH)[number];

export interface Application {
  readonly id: ApplicationId;
  /** Stable machine key, e.g. `enterprise-portal`. */
  readonly key: string;
  readonly name: string;
  readonly category: ApplicationCategory;
  readonly health: ApplicationHealth;
  readonly ownerOrganizationId: OrganizationId;
}

export interface CreateApplicationInput {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly category: ApplicationCategory;
  readonly health: ApplicationHealth;
  readonly ownerOrganizationId: string;
}

const KEY_PATTERN = /^[a-z][a-z0-9-]*$/;

export function createApplication(input: CreateApplicationInput): Result<Application> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.name, "name")
    .nonEmpty(input.ownerOrganizationId, "ownerOrganizationId")
    .require(KEY_PATTERN.test(input.key), "key", "key must be kebab-case (a-z, 0-9, -)")
    .oneOf(input.category, APPLICATION_CATEGORIES, "category")
    .oneOf(input.health, APPLICATION_HEALTH, "health")
    .build();

  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    id: applicationId(input.id),
    key: input.key,
    name: input.name,
    category: input.category,
    health: input.health,
    ownerOrganizationId: organizationId(input.ownerOrganizationId),
  });
}

/** Health states that should surface as actionable on a governance dashboard. */
export const isUnhealthy = (app: Application): boolean =>
  app.health === "degraded" || app.health === "down";
