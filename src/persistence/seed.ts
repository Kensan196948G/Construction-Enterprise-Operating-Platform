/**
 * Demo data seeder for local development and integration testing.
 *
 * Seeds a realistic construction-company setup:
 *   - 1 headquarters org, 1 branch office, 1 construction site
 *   - 3 users  (admin / site-manager / field-worker)
 *   - 3 roles  (platform-admin / site-manager / field-operator)
 *   - 4 policies (read-all-allow / write-governance-admin-only /
 *                 field-devices-allow / sensitive-deny)
 *   - 3 applications (CMDB / ITSM / IMS)
 *   - 2 devices (tablet / sensor)
 */

import {
  type Organization,
  createOrganization,
} from "../domain/organization.ts";
import { type User, createUser } from "../domain/user.ts";
import { type Role, createRole } from "../domain/role.ts";
import { type Device, createDevice } from "../domain/device.ts";
import { type Application, createApplication } from "../domain/application.ts";
import { type Policy, createPolicy } from "../domain/policy.ts";
import type { IsoTimestamp } from "../domain/common.ts";
import type { Repositories } from "./ports.ts";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface SeedResult {
  readonly organizations: {
    readonly hq: Organization;
    readonly branch: Organization;
    readonly site: Organization;
  };
  readonly users: {
    readonly admin: User;
    readonly siteManager: User;
    readonly fieldWorker: User;
  };
  readonly roles: {
    readonly platformAdmin: Role;
    readonly siteManager: Role;
    readonly fieldOperator: Role;
  };
  readonly policies: {
    readonly readAllAllow: Policy;
    readonly writeGovernanceAdminOnly: Policy;
    readonly fieldDevicesAllow: Policy;
    readonly sensitiveDeny: Policy;
  };
  readonly applications: {
    readonly cmdb: Application;
    readonly itsm: Application;
    readonly ims: Application;
  };
  readonly devices: {
    readonly tablet: Device;
    readonly sensor: Device;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Produce a branded IsoTimestamp from a known-valid ISO-8601 string. */
function ts(value: string): IsoTimestamp {
  return value as IsoTimestamp;
}

/**
 * Unwrap a domain factory result or throw with context.
 * Seed data is hard-coded; any validation error is a programming mistake.
 */
function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: unknown }, label: string): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`[seed] Failed to create ${label}: ${JSON.stringify(result.error)}`);
}

// ---------------------------------------------------------------------------
// Public seed function
// ---------------------------------------------------------------------------

/**
 * Populate the given repositories with demo entities and return the created
 * objects. Calling this multiple times will overwrite existing entries with
 * the same ids (upsert semantics from {@link Repository.save}).
 */
export async function seed(repos: Repositories): Promise<SeedResult> {
  const now = ts("2026-06-01T00:00:00.000Z");

  // -------------------------------------------------------------------------
  // Organizations
  // -------------------------------------------------------------------------

  const hq = unwrap(
    createOrganization({
      id: "org-hq",
      name: "建設本社",
      type: "headquarters",
      status: "active",
      createdAt: now,
    }),
    "org-hq",
  );

  const branch = unwrap(
    createOrganization({
      id: "org-branch",
      name: "東京支社",
      type: "branch",
      status: "active",
      parentId: "org-hq",
      createdAt: now,
    }),
    "org-branch",
  );

  const site = unwrap(
    createOrganization({
      id: "org-site",
      name: "渋谷現場",
      type: "site",
      status: "active",
      parentId: "org-branch",
      createdAt: now,
    }),
    "org-site",
  );

  await repos.organizations.save(hq);
  await repos.organizations.save(branch);
  await repos.organizations.save(site);

  // -------------------------------------------------------------------------
  // Roles
  // -------------------------------------------------------------------------

  const platformAdmin = unwrap(
    createRole({
      id: "role-platform-admin",
      name: "Platform Admin",
      description: "Full platform access — governance, configuration, and field OS.",
      scope: "global",
      permissions: ["*:*"],
    }),
    "role-platform-admin",
  );

  const siteManagerRole = unwrap(
    createRole({
      id: "role-site-manager",
      name: "Site Manager",
      description: "Manages a single construction site and its field devices.",
      scope: "organization",
      permissions: [
        "application:read",
        "device:read",
        "device:write",
        "workflow:read",
        "workflow:write",
        "audit:read",
      ],
    }),
    "role-site-manager",
  );

  const fieldOperator = unwrap(
    createRole({
      id: "role-field-operator",
      name: "Field Operator",
      description: "Field crew member with read-only access to devices and workflows.",
      scope: "site",
      permissions: ["device:read", "workflow:read"],
    }),
    "role-field-operator",
  );

  await repos.roles.save(platformAdmin);
  await repos.roles.save(siteManagerRole);
  await repos.roles.save(fieldOperator);

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  const adminUser = unwrap(
    createUser({
      id: "user-admin",
      organizationId: "org-hq",
      displayName: "システム管理者",
      email: "admin@construction.example",
      status: "active",
      roleIds: ["role-platform-admin"],
      createdAt: now,
    }),
    "user-admin",
  );

  const siteManagerUser = unwrap(
    createUser({
      id: "user-site-manager",
      organizationId: "org-branch",
      displayName: "現場所長",
      email: "site-manager@construction.example",
      status: "active",
      roleIds: ["role-site-manager"],
      createdAt: now,
    }),
    "user-site-manager",
  );

  const fieldWorker = unwrap(
    createUser({
      id: "user-field-worker",
      organizationId: "org-site",
      displayName: "現場作業員",
      email: "field-worker@construction.example",
      status: "active",
      roleIds: ["role-field-operator"],
      createdAt: now,
    }),
    "user-field-worker",
  );

  await repos.users.save(adminUser);
  await repos.users.save(siteManagerUser);
  await repos.users.save(fieldWorker);

  // -------------------------------------------------------------------------
  // Policies
  // -------------------------------------------------------------------------

  const readAllAllow = unwrap(
    createPolicy({
      id: "policy-read-all-allow",
      name: "Read All Allow",
      effect: "allow",
      actions: ["read"],
      resources: ["*"],
      conditions: [],
    }),
    "policy-read-all-allow",
  );

  const writeGovernanceAdminOnly = unwrap(
    createPolicy({
      id: "policy-write-governance-admin-only",
      name: "Write Governance Admin Only",
      effect: "deny",
      actions: ["write", "delete"],
      resources: ["governance"],
      conditions: [],
    }),
    "policy-write-governance-admin-only",
  );

  const fieldDevicesAllow = unwrap(
    createPolicy({
      id: "policy-field-devices-allow",
      name: "Field Devices Allow",
      effect: "allow",
      actions: ["read", "write"],
      resources: ["device"],
      conditions: [{ attribute: "org.type", equals: "site" }],
    }),
    "policy-field-devices-allow",
  );

  const sensitiveDeny = unwrap(
    createPolicy({
      id: "policy-sensitive-deny",
      name: "Sensitive Data Deny",
      effect: "deny",
      actions: ["*"],
      resources: ["sensitive"],
      conditions: [],
    }),
    "policy-sensitive-deny",
  );

  await repos.policies.save(readAllAllow);
  await repos.policies.save(writeGovernanceAdminOnly);
  await repos.policies.save(fieldDevicesAllow);
  await repos.policies.save(sensitiveDeny);

  // -------------------------------------------------------------------------
  // Applications
  // -------------------------------------------------------------------------

  const cmdb = unwrap(
    createApplication({
      id: "app-cmdb",
      key: "cmdb",
      name: "CMDB",
      category: "governance",
      health: "healthy",
      ownerOrganizationId: "org-hq",
    }),
    "app-cmdb",
  );

  const itsm = unwrap(
    createApplication({
      id: "app-itsm",
      key: "itsm",
      name: "ITSM",
      category: "workflow",
      health: "healthy",
      ownerOrganizationId: "org-hq",
    }),
    "app-itsm",
  );

  const ims = unwrap(
    createApplication({
      id: "app-ims",
      key: "ims",
      name: "IMS",
      category: "portal",
      health: "degraded",
      ownerOrganizationId: "org-branch",
    }),
    "app-ims",
  );

  await repos.applications.save(cmdb);
  await repos.applications.save(itsm);
  await repos.applications.save(ims);

  // -------------------------------------------------------------------------
  // Devices
  // -------------------------------------------------------------------------

  const tablet = unwrap(
    createDevice({
      id: "device-tablet",
      organizationId: "org-site",
      kind: "tablet",
      status: "active",
      assignedUserId: "user-field-worker",
      lastSeenAt: ts("2026-06-01T08:30:00.000Z"),
    }),
    "device-tablet",
  );

  const sensor = unwrap(
    createDevice({
      id: "device-sensor",
      organizationId: "org-site",
      kind: "sensor",
      status: "provisioned",
      lastSeenAt: ts("2026-05-28T14:00:00.000Z"),
    }),
    "device-sensor",
  );

  await repos.devices.save(tablet);
  await repos.devices.save(sensor);

  // -------------------------------------------------------------------------
  // Return collected entities
  // -------------------------------------------------------------------------

  return {
    organizations: { hq, branch, site },
    users: { admin: adminUser, siteManager: siteManagerUser, fieldWorker },
    roles: { platformAdmin, siteManager: siteManagerRole, fieldOperator },
    policies: { readAllAllow, writeGovernanceAdminOnly, fieldDevicesAllow, sensitiveDeny },
    applications: { cmdb, itsm, ims },
    devices: { tablet, sensor },
  };
}
