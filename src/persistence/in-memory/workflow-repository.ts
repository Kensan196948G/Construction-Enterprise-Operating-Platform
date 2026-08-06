import type { Workflow, WorkflowId, WorkflowStatus, WorkflowType } from "../../domain/workflow.ts";
import type { WorkflowRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link WorkflowRepository}.
 */
export class InMemoryWorkflowRepository implements WorkflowRepository {
  readonly #store = new Map<string, Workflow>();

  async findById(id: WorkflowId): Promise<Workflow | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Workflow[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Workflow): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: WorkflowId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByType(type: WorkflowType): Promise<readonly Workflow[]> {
    const results: Workflow[] = [];
    for (const workflow of this.#store.values()) {
      if (workflow.type === type) {
        results.push(workflow);
      }
    }
    return results;
  }

  async findByStatus(status: WorkflowStatus): Promise<readonly Workflow[]> {
    const results: Workflow[] = [];
    for (const workflow of this.#store.values()) {
      if (workflow.status === status) {
        results.push(workflow);
      }
    }
    return results;
  }
}
