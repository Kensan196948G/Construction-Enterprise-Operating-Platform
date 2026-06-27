/**
 * Runnable quickstart — wires the platform together end to end.
 *
 *   node examples/quickstart.ts   (Node v22.6+, native TypeScript)
 *
 * It builds a tiny governed scene, makes an access decision, records audit
 * evidence, renders a role-based dashboard, and generates a document.
 */
import {
  createApplication,
  createDevice,
  createRole,
  createUser,
  createPolicy,
  createAuditEvent,
  toIsoTimestamp,
  workflowId,
} from "../src/domain/index.ts";
import { AuditLog, evaluateAccess, resolvePermissions } from "../src/governance/index.ts";
import { buildDashboard } from "../src/dashboard/index.ts";
import { InMemoryDocumentAdapter } from "../src/adapters/index.ts";

function must<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!result.ok) {
    throw new Error(`validation failed: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

const now = must(toIsoTimestamp(new Date().toISOString()));

// A field supervisor who may read applications and devices, but not approvals.
const role = must(
  createRole({
    id: "role-supervisor",
    name: "Field Supervisor",
    description: "field read access",
    scope: "site",
    permissions: ["application:read", "device:read"],
  }),
);
const permissions = resolvePermissions([role]);

const supervisor = must(
  createUser({
    id: "u-sup",
    organizationId: "org-site-42",
    displayName: "Sato",
    email: "sato@example.com",
    status: "active",
    roleIds: [role.id],
    createdAt: now,
  }),
);

const applications = [
  must(
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
  must(
    createDevice({ id: "d-1", organizationId: "org-site-42", kind: "tablet", status: "active" }),
  ),
];

const denyApprovals = must(
  createPolicy({
    id: "p-deny-approvals",
    name: "supervisors cannot read approvals",
    effect: "deny",
    actions: ["read"],
    resources: ["approval"],
  }),
);

// 1. Access decision (governed, deny-overrides).
const decision = evaluateAccess({
  request: { subject: supervisor.id, resource: "approval", action: "read" },
  permissions,
  policies: [denyApprovals],
});
console.log("access(approval:read) =>", decision.decision, "—", decision.reason);

// 2. Tamper-evident audit trail.
const auditLog = new AuditLog();
auditLog.append(
  must(
    createAuditEvent({
      id: "ev-1",
      at: now,
      actor: supervisor.id,
      action: "read",
      resource: "approval",
      outcome: "denied",
    }),
  ),
);
console.log("audit integrity =>", auditLog.verify());

// 3. Role-based dashboard (access-filtered).
const view = buildDashboard({
  viewer: { subject: supervisor.id, permissions },
  policies: [denyApprovals],
  generatedAt: now,
  users: [supervisor],
  applications,
  devices,
  pendingApprovals: [
    {
      id: "ap-1",
      workflowId: workflowId("wf-approval"),
      stepKey: "review",
      requestedBy: "u-x",
      requestedAt: now,
    },
  ],
  auditLog,
});
console.log("dashboard =>", {
  visibleApps: view.applications.length,
  visibleDevices: view.devices.length,
  hiddenApprovals: view.hidden.approvals,
  unhealthyApps: view.governance.unhealthyApplications,
  deniedEvents: view.governance.deniedAccessEvents,
});

// 4. Document generation (Document Control adapter).
const documents = new InMemoryDocumentAdapter(() => now);
try {
  const artifact = await documents.generate({
    template: "Site {{site}}: {{apps}} app(s) visible, {{denied}} denied event(s).",
    title: "Governance Evidence",
    variables: {
      site: supervisor.organizationId,
      apps: String(view.applications.length),
      denied: String(view.governance.deniedAccessEvents),
    },
  });
  console.log("document =>", artifact.content);
} catch (error) {
  console.error("[quickstart] document generation failed:", error);
  process.exit(1);
}
