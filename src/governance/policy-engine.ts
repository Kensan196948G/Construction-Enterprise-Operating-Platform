import { type Permission } from "../domain/role.ts";
import { type Role } from "../domain/role.ts";
import { type Policy, type PolicyId, patternMatches } from "../domain/policy.ts";

/**
 * A request to perform `action` on `resource`, optionally carrying subject /
 * environment attributes consulted by ABAC-style policy conditions.
 */
export interface AccessRequest {
  readonly subject: string;
  readonly resource: string;
  readonly action: string;
  readonly attributes?: Readonly<Record<string, string>>;
}

export type Decision = "allow" | "deny";

export interface AccessDecision {
  readonly decision: Decision;
  readonly reason: string;
  readonly matchedPolicyIds: readonly PolicyId[];
}

export interface EvaluationInput {
  readonly request: AccessRequest;
  /** Permissions resolved from the subject's roles (see {@link resolvePermissions}). */
  readonly permissions: readonly Permission[];
  readonly policies: readonly Policy[];
}

/** Flatten and de-duplicate the permissions granted by a set of roles. */
export function resolvePermissions(roles: readonly Role[]): Permission[] {
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

/** True when a `resource:action` permission token covers the request. */
function permissionGrants(permission: Permission, request: AccessRequest): boolean {
  const [resource, action] = permission.split(":");
  if (resource === undefined || action === undefined) {
    return false;
  }
  return patternMatches(resource, request.resource) && patternMatches(action, request.action);
}

function conditionsHold(policy: Policy, request: AccessRequest): boolean {
  const attributes = request.attributes ?? {};
  return policy.conditions.every(
    (condition) => attributes[condition.attribute] === condition.equals,
  );
}

/** True when a policy targets the request's resource, action, and attributes. */
function policyMatches(policy: Policy, request: AccessRequest): boolean {
  const resourceMatch = policy.resources.some((p) => patternMatches(p, request.resource));
  const actionMatch = policy.actions.some((p) => patternMatches(p, request.action));
  return resourceMatch && actionMatch && conditionsHold(policy, request);
}

/**
 * Evaluate an access request with deny-overrides precedence:
 *
 *   explicit deny  >  explicit allow  >  RBAC grant  >  default deny
 *
 * The default decision is always `deny`, so an action that no rule speaks to is
 * refused rather than silently permitted.
 */
export function evaluateAccess(input: EvaluationInput): AccessDecision {
  const { request, permissions, policies } = input;
  const matching = policies.filter((policy) => policyMatches(policy, request));

  const denials = matching.filter((policy) => policy.effect === "deny");
  if (denials.length > 0) {
    return {
      decision: "deny",
      reason: `explicit deny by policy: ${denials.map((p) => p.id).join(", ")}`,
      matchedPolicyIds: denials.map((p) => p.id),
    };
  }

  const allows = matching.filter((policy) => policy.effect === "allow");
  if (allows.length > 0) {
    return {
      decision: "allow",
      reason: `allowed by policy: ${allows.map((p) => p.id).join(", ")}`,
      matchedPolicyIds: allows.map((p) => p.id),
    };
  }

  const grantingPermission = permissions.find((permission) =>
    permissionGrants(permission, request),
  );
  if (grantingPermission !== undefined) {
    return {
      decision: "allow",
      reason: `granted by role permission: ${grantingPermission}`,
      matchedPolicyIds: [],
    };
  }

  return {
    decision: "deny",
    reason: "default deny: no matching policy or role permission",
    matchedPolicyIds: [],
  };
}
