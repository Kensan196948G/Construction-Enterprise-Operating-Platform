/**
 * End-to-end integration test: domain -> governance -> audit -> dashboard -> document.
 *
 * Where the per-module unit tests verify each part in isolation, this test
 * proves the parts compose into the workflow the platform actually promises.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  type IsoTimestamp,
  type Result,
  createApplication,
  createAuditEvent,
  createDevice,
  createPolicy,
  createRole,
  createUser,
  toIsoTimestamp,
  workflowId,
} from "./domain/index.ts";
import { AuditLog, evaluateAccess, resolvePermissions } from "./governance/index.ts";
import { type ApprovalRequest, buildDashboard } from "./dashboard/index.ts";
import { InMemoryDocumentAdapter } from "./adapters/index.ts";

function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

const AT: IsoTimestamp = unwrap(toIsoTimestamp("2026-06-25T00:00:00.000Z"));

test("a field supervisor's access is governed, audited, and surfaced end-to-end", async () => {
  // 1. Domain: a supervisor with read access to applications and devices only.
  const supervisorRole = unwrap(
    createRole({
      id: "role-supervisor",
      name: "Field Supervisor",
      description: "reads field apps and devices",
      scope: "site",
      permissions: ["application:read", "device:read", "audit:read"],
    }),
  );
  const permissions = resolvePermissions([supervisorRole]);

  const supervisor = unwrap(
    createUser({
      id: "u-sup",
      organizationId: "org-site-42",
      displayName: "Sato",
      email: "sato@example.com",
      status: "active",
      roleIds: ["role-supervisor"],
      createdAt: AT,
    }),
  );

  const apps = [
    unwrap(
      createApplication({
        id: "a-field",
        key: "field-os",
        name: "Field OS",
        category: "field",
        health: "degraded",
        ownerOrganizationId: "org-site-42",
      }),
    ),
  ];
  const devices = [
    unwrap(
      createDevice({ id: "d-1", organizationId: "org-site-42", kind: "tablet", status: "active" }),
    ),
  ];

  // 2. Governance: an org-wide deny policy on approvals overrides any grant.
  const denyApprovals = unwrap(
    createPolicy({
      id: "p-deny-approvals",
      name: "supervisors cannot read approvals",
      effect: "deny",
      actions: ["read"],
      resources: ["approval"],
    }),
  );

  const auditLog = new AuditLog();
  const approvalDecision = evaluateAccess({
    request: { subject: supervisor.id, resource: "approval", action: "read" },
    permissions,
    policies: [denyApprovals],
  });
  assert.equal(approvalDecision.decision, "deny");

  // 3. Audit: record the denied attempt as tamper-evident evidence.
  auditLog.append(
    unwrap(
      createAuditEvent({
        id: "ev-1",
        at: AT,
        actor: supervisor.id,
        action: "read",
        resource: "approval",
        outcome: "denied",
        metadata: { policy: approvalDecision.matchedPolicyIds.join(",") },
      }),
    ),
  );
  assert.deepEqual(auditLog.verify(), { valid: true });

  // 4. Dashboard: the supervisor sees apps + devices, but approvals are withheld.
  const approvals: ApprovalRequest[] = [
    {
      id: "ap-1",
      workflowId: workflowId("wf-approval"),
      stepKey: "review",
      requestedBy: "u-x",
      requestedAt: AT,
    },
  ];
  const view = buildDashboard({
    viewer: { subject: supervisor.id, permissions },
    policies: [denyApprovals],
    generatedAt: AT,
    users: [supervisor],
    applications: apps,
    devices,
    pendingApprovals: approvals,
    auditLog,
  });

  assert.equal(view.applications.length, 1);
  assert.equal(view.devices.length, 1);
  assert.equal(view.pendingApprovals.length, 0);
  assert.equal(view.hidden.approvals, 1);
  assert.equal(view.governance.unhealthyApplications, 1);
  assert.equal(view.governance.deniedAccessEvents, 1);

  // 5. Document: generate an audit-evidence artifact from the governed state.
  const documents = new InMemoryDocumentAdapter(() => AT);
  const artifact = await documents.generate({
    template: "Site {{site}} dashboard: {{apps}} app(s), {{denied}} denied access event(s).",
    title: "Daily Governance Evidence",
    variables: {
      site: supervisor.organizationId,
      apps: String(view.applications.length),
      denied: String(view.governance.deniedAccessEvents),
    },
  });

  assert.equal(artifact.content, "Site org-site-42 dashboard: 1 app(s), 1 denied access event(s).");
  assert.equal(artifact.generatedAt, AT);
});
