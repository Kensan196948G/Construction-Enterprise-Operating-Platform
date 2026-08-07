/**
 * Workflow instance domain — a concrete, tenant-scoped run of a workflow
 * template (Synapse Issue→Approval→Audit / L-02 integration).
 *
 * The workflow *template* (`src/domain/workflow.ts`) is a shared definition.
 * An instance is created from a template for a specific organization and
 * requester, tracks the current step, and records who decided what when.
 * Every state change is expected to be audited by the API layer.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { type WorkflowId, workflowId } from "./workflow.ts";
import { type OrganizationId, organizationId } from "./organization.ts";

export type WorkflowInstanceId = Brand<string, "WorkflowInstanceId">;
export const workflowInstanceId = (value: string): WorkflowInstanceId =>
  value as WorkflowInstanceId;

export const WORKFLOW_INSTANCE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

/** A terminal decision made by an approver. */
export const WORKFLOW_DECISIONS = ["approve", "reject"] as const;
export type WorkflowDecision = (typeof WORKFLOW_DECISIONS)[number];

export interface WorkflowInstance {
  readonly id: WorkflowInstanceId;
  readonly workflowId: WorkflowId;
  readonly organizationId: OrganizationId;
  /** User or service that requested the workflow run. */
  readonly subject: string;
  /** Current/next step key from the template. */
  readonly stepKey: string;
  readonly stepName: string;
  readonly status: WorkflowInstanceStatus;
  readonly requestedAt: IsoTimestamp;
  readonly decidedAt?: IsoTimestamp;
  readonly decidedBy?: string;
  readonly decision?: WorkflowDecision;
  readonly comment?: string;
}

export interface CreateWorkflowInstanceInput {
  readonly id: string;
  readonly workflowId: string;
  readonly organizationId: string;
  readonly subject: string;
  readonly stepKey: string;
  readonly stepName: string;
  readonly requestedAt: string;
}

export interface DecideWorkflowInstanceInput {
  readonly decision: WorkflowDecision;
  readonly decidedBy: string;
  readonly decidedAt: string;
  readonly comment?: string;
}

/** Create a new pending workflow instance. */
export function createWorkflowInstance(
  input: CreateWorkflowInstanceInput,
): Result<WorkflowInstance> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.workflowId, "workflowId")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.subject, "subject")
    .nonEmpty(input.stepKey, "stepKey")
    .nonEmpty(input.stepName, "stepName")
    .nonEmpty(input.requestedAt, "requestedAt")
    .build();
  if (issues.length > 0) {
    return err(issues);
  }
  return ok({
    id: workflowInstanceId(input.id),
    workflowId: workflowId(input.workflowId),
    organizationId: organizationId(input.organizationId),
    subject: input.subject,
    stepKey: input.stepKey,
    stepName: input.stepName,
    status: "pending",
    requestedAt: input.requestedAt as IsoTimestamp,
  });
}

/**
 * Apply an approver's decision to a pending instance.
 * Returns an error when the instance is not pending (no state rewrites).
 */
export function decideWorkflowInstance(
  instance: WorkflowInstance,
  input: DecideWorkflowInstanceInput,
): Result<WorkflowInstance> {
  const issues = new ValidationBuilder()
    .require(instance.status === "pending", "status", "only pending instances can be decided")
    .require(WORKFLOW_DECISIONS.includes(input.decision), "decision", "invalid decision")
    .nonEmpty(input.decidedBy, "decidedBy")
    .nonEmpty(input.decidedAt, "decidedAt")
    .build();
  if (issues.length > 0) {
    return err(issues);
  }
  return ok({
    ...instance,
    status: input.decision === "approve" ? "approved" : "rejected",
    decidedAt: input.decidedAt as IsoTimestamp,
    decidedBy: input.decidedBy,
    decision: input.decision,
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
  });
}

/** Cancel a pending instance (e.g. requester withdrawal). */
export function cancelWorkflowInstance(
  instance: WorkflowInstance,
  cancelledAt: string,
): Result<WorkflowInstance> {
  const issues = new ValidationBuilder()
    .require(instance.status === "pending", "status", "only pending instances can be cancelled")
    .nonEmpty(cancelledAt, "cancelledAt")
    .build();
  if (issues.length > 0) {
    return err(issues);
  }
  return ok({
    ...instance,
    status: "cancelled",
    decidedAt: cancelledAt as IsoTimestamp,
  });
}
