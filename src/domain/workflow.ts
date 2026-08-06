import { type Brand, type Result, ValidationBuilder, err, ok } from "./common.ts";

export type WorkflowId = Brand<string, "WorkflowId">;
export const workflowId = (value: string): WorkflowId => value as WorkflowId;

export const WORKFLOW_TYPES = ["approval", "notification", "task"] as const;
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];

export const WORKFLOW_STATUSES = ["draft", "active", "suspended", "retired"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

/** A single ordered step within a workflow definition. */
export interface WorkflowStep {
  readonly key: string;
  readonly name: string;
  /** Permission required to act on this step, in `resource:action` form. */
  readonly requiredPermission: string;
}

export interface Workflow {
  readonly id: WorkflowId;
  readonly name: string;
  readonly type: WorkflowType;
  readonly status: WorkflowStatus;
  readonly steps: readonly WorkflowStep[];
}

export interface CreateWorkflowInput {
  readonly id: string;
  readonly name: string;
  readonly type: WorkflowType;
  readonly status: WorkflowStatus;
  readonly steps: readonly WorkflowStep[];
}

export function createWorkflow(input: CreateWorkflowInput): Result<Workflow> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.name, "name")
    .oneOf(input.type, WORKFLOW_TYPES, "type")
    .oneOf(input.status, WORKFLOW_STATUSES, "status")
    .require(input.steps.length > 0, "steps", "a workflow must define at least one step")
    .build();

  const seenKeys = new Set<string>();
  input.steps.forEach((step, index) => {
    if (step.key.trim().length === 0) {
      issues.push({ path: `steps[${index}].key`, message: "step key must be non-empty" });
    } else if (seenKeys.has(step.key)) {
      issues.push({ path: `steps[${index}].key`, message: `duplicate step key: ${step.key}` });
    }
    seenKeys.add(step.key);
    if (!/^[^\s:]+:[^\s:]+$/.test(step.requiredPermission)) {
      issues.push({ path: `steps[${index}].requiredPermission`, message: "requiredPermission must be in 'resource:action' format with no spaces" });
    }
  });

  if (issues.length > 0) {
    return err(issues);
  }

  return ok({
    id: workflowId(input.id),
    name: input.name,
    type: input.type,
    status: input.status,
    steps: input.steps,
  });
}
