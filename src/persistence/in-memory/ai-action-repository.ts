import type { AiAction, AiActionId, AiActionStatus } from "../../domain/ai-action.ts";
import type { AiActionRepository } from "../ports.ts";

/** In-memory implementation of {@link AiActionRepository}. */
export class InMemoryAiActionRepository implements AiActionRepository {
  readonly #store = new Map<string, AiAction>();

  async findById(id: AiActionId): Promise<AiAction | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly AiAction[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: AiAction): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: AiActionId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByOrganization(orgId: string): Promise<readonly AiAction[]> {
    const results: AiAction[] = [];
    for (const action of this.#store.values()) {
      if ((action.organizationId ?? "") === orgId) {
        results.push(action);
      }
    }
    return results;
  }

  async findByStatus(status: AiActionStatus): Promise<readonly AiAction[]> {
    const results: AiAction[] = [];
    for (const action of this.#store.values()) {
      if (action.status === status) {
        results.push(action);
      }
    }
    return results;
  }
}
