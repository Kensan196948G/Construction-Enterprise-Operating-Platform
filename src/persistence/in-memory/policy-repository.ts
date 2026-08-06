import type { Policy, PolicyEffect, PolicyId } from "../../domain/policy.ts";
import type { PolicyRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link PolicyRepository}.
 */
export class InMemoryPolicyRepository implements PolicyRepository {
  readonly #store = new Map<string, Policy>();

  async findById(id: PolicyId): Promise<Policy | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Policy[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Policy): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: PolicyId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByEffect(effect: PolicyEffect): Promise<readonly Policy[]> {
    const results: Policy[] = [];
    for (const policy of this.#store.values()) {
      if (policy.effect === effect) {
        results.push(policy);
      }
    }
    return results;
  }
}
