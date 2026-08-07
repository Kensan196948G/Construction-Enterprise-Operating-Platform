import type {
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowInstanceStatus,
} from "../../domain/workflow-instance.ts";
import type { WorkflowInstanceRepository } from "../ports.ts";
import type { OrganizationId } from "../../domain/organization.ts";

/** In-memory implementation of {@link WorkflowInstanceRepository}. */
export class InMemoryWorkflowInstanceRepository implements WorkflowInstanceRepository {
  readonly #store = new Map<string, WorkflowInstance>();

  async findById(id: WorkflowInstanceId): Promise<WorkflowInstance | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly WorkflowInstance[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: WorkflowInstance): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: WorkflowInstanceId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByOrganization(orgId: OrganizationId): Promise<readonly WorkflowInstance[]> {
    const results: WorkflowInstance[] = [];
    for (const instance of this.#store.values()) {
      if (instance.organizationId === orgId) {
        results.push(instance);
      }
    }
    return results;
  }

  async findByStatus(status: WorkflowInstanceStatus): Promise<readonly WorkflowInstance[]> {
    const results: WorkflowInstance[] = [];
    for (const instance of this.#store.values()) {
      if (instance.status === status) {
        results.push(instance);
      }
    }
    return results;
  }
}
