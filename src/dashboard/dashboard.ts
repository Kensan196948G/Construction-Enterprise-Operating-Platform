import { type IsoTimestamp } from "../domain/common.ts";
import { type Application } from "../domain/application.ts";
import { type Device } from "../domain/device.ts";
import { type User } from "../domain/user.ts";
import { type Permission } from "../domain/role.ts";
import { type Policy } from "../domain/policy.ts";
import { type WorkflowId } from "../domain/workflow.ts";
import { isUnhealthy } from "../domain/application.ts";
import { isActiveUser } from "../domain/user.ts";
import { type IAuditLog } from "../governance/audit-log.ts";
import { type AccessRequest, evaluateAccess } from "../governance/policy-engine.ts";

/**
 * A pending approval awaiting action. This is a workflow *instance* concern, so
 * it lives in the dashboard read-model rather than inflating the core domain.
 */
export interface ApprovalRequest {
  readonly id: string;
  readonly workflowId: WorkflowId;
  readonly stepKey: string;
  readonly requestedBy: string;
  readonly requestedAt: IsoTimestamp;
}

export interface GovernanceSummary {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly visibleApplications: number;
  readonly unhealthyApplications: number;
  readonly visibleDevices: number;
  readonly openApprovals: number;
  readonly auditEvents: number;
  readonly deniedAccessEvents: number;
}

export interface AppHealthItem {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly category: Application["category"];
  readonly health: Application["health"];
}

export interface DeviceStatusItem {
  readonly id: string;
  readonly kind: Device["kind"];
  readonly status: Device["status"];
  readonly assignedUserId?: string;
}

export interface DashboardView {
  readonly viewer: string;
  readonly generatedAt: IsoTimestamp;
  readonly governance: GovernanceSummary;
  readonly applications: readonly AppHealthItem[];
  readonly devices: readonly DeviceStatusItem[];
  readonly pendingApprovals: readonly ApprovalRequest[];
  /** How many records were withheld from this viewer by access control. */
  readonly hidden: {
    readonly applications: number;
    readonly devices: number;
    readonly approvals: number;
  };
}

/** The identity whose permissions scope the dashboard. */
export interface DashboardViewer {
  readonly subject: string;
  readonly permissions: readonly Permission[];
  /** Organization scope; undefined = platform-wide viewer. */
  readonly organizationId?: string;
}

export interface DashboardInput {
  readonly viewer: DashboardViewer;
  readonly policies: readonly Policy[];
  readonly generatedAt: IsoTimestamp;
  readonly users: readonly User[];
  readonly applications: readonly Application[];
  readonly devices: readonly Device[];
  readonly pendingApprovals: readonly ApprovalRequest[];
  readonly auditLog: IAuditLog;
}

/**
 * Build a role-based dashboard view. Every resource list is filtered through the
 * Governance Core: a viewer only sees records they are permitted to `read`, and
 * the count of withheld records is reported so the redaction is never silent.
 *
 * The function is pure (the timestamp is supplied by the caller), making the
 * resulting view deterministic and trivially testable.
 */
export function buildDashboard(input: DashboardInput): DashboardView {
  const allow = (resource: string): boolean =>
    evaluateAccess({
      request: { subject: input.viewer.subject, resource, action: "read" } satisfies AccessRequest,
      permissions: input.viewer.permissions,
      policies: input.policies,
    }).decision === "allow";

  const canReadApplications = allow("application");
  const canReadDevices = allow("device");
  const canReadApprovals = allow("approval");
  const canReadUsers = allow("user");
  const orgScoped = input.viewer.organizationId !== undefined;

  const visibleApplications = canReadApplications
    ? orgScoped
      ? input.applications.filter((app) => app.ownerOrganizationId === input.viewer.organizationId)
      : input.applications
    : [];
  const applications: AppHealthItem[] = visibleApplications.map((app) => ({
        id: app.id,
        key: app.key,
        name: app.name,
        category: app.category,
        health: app.health,
      }));

  const visibleDevices = canReadDevices
    ? orgScoped
      ? input.devices.filter((device) => device.organizationId === input.viewer.organizationId)
      : input.devices
    : [];
  const devices: DeviceStatusItem[] = visibleDevices.map((device) => ({
        id: device.id,
        kind: device.kind,
        status: device.status,
        ...(device.assignedUserId !== undefined ? { assignedUserId: device.assignedUserId } : {}),
      }));

  const pendingApprovals = canReadApprovals ? [...input.pendingApprovals] : [];

  const canReadAudit = allow("audit");
  const deniedAccessEvents = canReadAudit
    ? input.auditLog.query((entry) => entry.event.outcome === "denied").length
    : 0;

  const visibleUsers = canReadUsers
    ? orgScoped
      ? input.users.filter((user) => user.organizationId === input.viewer.organizationId)
      : input.users
    : [];
  const governance: GovernanceSummary = {
    totalUsers: visibleUsers.length,
    activeUsers: visibleUsers.filter(isActiveUser).length,
    visibleApplications: applications.length,
    unhealthyApplications: visibleApplications.filter(isUnhealthy).length,
    visibleDevices: devices.length,
    openApprovals: pendingApprovals.length,
    auditEvents: canReadAudit ? input.auditLog.size : 0,
    deniedAccessEvents,
  };

  return {
    viewer: input.viewer.subject,
    generatedAt: input.generatedAt,
    governance,
    applications,
    devices,
    pendingApprovals,
    hidden: {
      applications: input.applications.length - applications.length,
      devices: input.devices.length - devices.length,
      approvals: canReadApprovals ? 0 : input.pendingApprovals.length,
    },
  };
}
