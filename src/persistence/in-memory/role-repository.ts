import type { Role, RoleId } from "../../domain/role.ts";
import type { RoleRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link RoleRepository}.
 */
export class InMemoryRoleRepository implements RoleRepository {
  readonly #store = new Map<string, Role>();

  async findById(id: RoleId): Promise<Role | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Role[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Role): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: RoleId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByName(name: string): Promise<Role | null> {
    for (const role of this.#store.values()) {
      if (role.name === name) {
        return role;
      }
    }
    return null;
  }
}
