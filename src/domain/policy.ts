import { type Brand, type Result, ValidationBuilder, err, ok } from "./common.ts";

export type PolicyId = Brand<string, "PolicyId">;
export const policyId = (value: string): PolicyId => value as PolicyId;

export const POLICY_EFFECTS = ["allow", "deny"] as const;
export type PolicyEffect = (typeof POLICY_EFFECTS)[number];

/**
 * An attribute equality requirement evaluated against an access-request context.
 * All conditions on a policy must hold (logical AND) for the policy to match.
 */
export interface PolicyCondition {
  readonly attribute: string;
  readonly equals: string;
}

/**
 * A governance rule combining RBAC-style action/resource matching with optional
 * ABAC-style attribute conditions. Patterns support a single `*` wildcard token.
 */
export interface Policy {
  readonly id: PolicyId;
  readonly name: string;
  readonly effect: PolicyEffect;
  readonly actions: readonly string[];
  readonly resources: readonly string[];
  readonly conditions: readonly PolicyCondition[];
}

export interface CreatePolicyInput {
  readonly id: string;
  readonly name: string;
  readonly effect: PolicyEffect;
  readonly actions: readonly string[];
  readonly resources: readonly string[];
  readonly conditions?: readonly PolicyCondition[];
}

export function createPolicy(input: CreatePolicyInput): Result<Policy> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.name, "name")
    .oneOf(input.effect, POLICY_EFFECTS, "effect")
    .require(input.actions.length > 0, "actions", "a policy must target at least one action")
    .require(input.resources.length > 0, "resources", "a policy must target at least one resource")
    .build();

  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    id: policyId(input.id),
    name: input.name,
    effect: input.effect,
    actions: [...input.actions],
    resources: [...input.resources],
    conditions: [...(input.conditions ?? [])],
  });
}

/** True when `pattern` (`*` or an exact token) matches `value`. */
export const patternMatches = (pattern: string, value: string): boolean =>
  pattern === "*" || pattern === value;
