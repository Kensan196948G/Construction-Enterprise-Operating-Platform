import { test } from "node:test";
import assert from "node:assert/strict";

import {
  type Application,
  type Device,
  type IsoTimestamp,
  type Result,
  type User,
  createApplication,
  createAuditEvent,
  createDevice,
  createPolicy,
  createRole,
  createUser,
  toIsoTimestamp,
  workflowId,
} from "../domain/index.ts";
import { AuditLog } from "../governance/audit-log.ts";
import { resolvePermissions } from "../governance/policy-engine.ts";
import { type ApprovalRequest, type DashboardInput, buildDashboard } from "./dashboard.ts";

function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

const AT: IsoTimestamp = unwrap(toIsoTimestamp("2026-06-25T00:00:00.000Z"));

const adminPermissions = resolvePermissions([
  unwrap(
    createRole({
      id: "role-admin",
      name: "Administrator",
      description: "full access",
      scope: "global",
      permissions: ["*:*"],
    }),
  ),
]);

const appOnlyPermissions = resolvePermissions([
  unwrap(
    createRole({
      id: "role-app-viewer",
      name: "App Viewer",
      description: "applications read only",
      scope: "organization",
      permissions: ["application:read"],
    }),
  ),
]);

const users: User[] = [
  unwrap(
    createUser({
      id: "u1",
      organizationId: "org-hq",
      displayName: "Alice",
      email: "alice@example.com",
      status: "active",
      roleIds: ["role-admin"],
      createdAt: AT,
    }),
  ),
  unwrap(
    createUser({
      id: "u2",
      organizationId: "org-hq",
      displayName: "Bob",
      email: "bob@example.com",
      status: "suspended",
      roleIds: ["role-app-viewer"],
      createdAt: AT,
    }),
  ),
];

const applications: Application[] = [
  unwrap(
    createApplication({
      id: "a1",
      key: "enterprise-portal",
      name: "Enterprise Portal",
      category: "portal",
      health: "healthy",
      ownerOrganizationId: "org-hq",
    }),
  ),
  unwrap(
    createApplication({
      id: "a2",
      key: "field-os",
      name: "Field OS",
      category: "field",
      health: "degraded",
      ownerOrganizationId: "org-hq",
    }),
  ),
];

const devices: Device[] = [
  unwrap(createDevice({ id: "d1", organizationId: "org-hq", kind: "tablet", status: "active" })),
];

const approvals: ApprovalRequest[] = [
  {
    id: "ap1",
    workflowId: workflowId("wf-approval"),
    stepKey: "review",
    requestedBy: "u2",
    requestedAt: AT,
  },
];

function baseInput(overrides: Partial<DashboardInput> = {}): DashboardInput {
  return {
    viewer: { subject: "u1", permissions: adminPermissions },
    policies: [],
    generatedAt: AT,
    users,
    applications,
    devices,
    pendingApprovals: approvals,
    auditLog: new AuditLog(),
    ...overrides,
  };
}

test("admin viewer sees all resources and an accurate governance summary", () => {
  const view = buildDashboard(baseInput());
  assert.equal(view.applications.length, 2);
  assert.equal(view.devices.length, 1);
  assert.equal(view.pendingApprovals.length, 1);
  assert.equal(view.governance.totalUsers, 2);
  assert.equal(view.governance.activeUsers, 1);
  assert.equal(view.governance.unhealthyApplications, 1);
  assert.equal(view.governance.openApprovals, 1);
  assert.deepEqual(view.hidden, { applications: 0, devices: 0, approvals: 0 });
});

test("a viewer without device/approval permission has those records withheld, not silently dropped", () => {
  const view = buildDashboard(
    baseInput({ viewer: { subject: "u2", permissions: appOnlyPermissions } }),
  );
  assert.equal(view.applications.length, 2);
  assert.equal(view.devices.length, 0);
  assert.equal(view.pendingApprovals.length, 0);
  assert.equal(view.hidden.devices, 1);
  assert.equal(view.hidden.approvals, 1);
  assert.equal(view.governance.visibleDevices, 0);
});

test("an explicit deny policy hides applications even from an admin", () => {
  const denyApplications = unwrap(
    createPolicy({
      id: "p-deny-apps",
      name: "deny application reads",
      effect: "deny",
      actions: ["read"],
      resources: ["application"],
    }),
  );
  const view = buildDashboard(baseInput({ policies: [denyApplications] }));
  assert.equal(view.applications.length, 0);
  assert.equal(view.hidden.applications, 2);
  assert.equal(view.governance.unhealthyApplications, 0);
});

test("governance summary reflects denied access events recorded in the audit log", () => {
  const auditLog = new AuditLog();
  auditLog.append(
    unwrap(
      createAuditEvent({
        id: "e1",
        at: AT,
        actor: "u2",
        action: "read",
        resource: "device",
        outcome: "denied",
      }),
    ),
  );
  auditLog.append(
    unwrap(
      createAuditEvent({
        id: "e2",
        at: AT,
        actor: "u1",
        action: "read",
        resource: "application",
        outcome: "success",
      }),
    ),
  );
  const view = buildDashboard(baseInput({ auditLog }));
  assert.equal(view.governance.auditEvents, 2);
  assert.equal(view.governance.deniedAccessEvents, 1);
});

test("the view is deterministic for a fixed timestamp", () => {
  const a = buildDashboard(baseInput());
  const b = buildDashboard(baseInput());
  assert.deepEqual(a.governance, b.governance);
  assert.equal(a.generatedAt, AT);
});
