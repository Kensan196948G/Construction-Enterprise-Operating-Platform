import type { User, UserId } from "../../domain/user.ts";
import type { OrganizationId } from "../../domain/organization.ts";
import type { UserRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link UserRepository}.
 *
 * Backed by a `Map<string, User>` keyed on the string value of `UserId`.
 * Safe for single-threaded Node.js usage; not suitable for multi-process
 * deployments (use a proper database adapter for those).
 */
export class InMemoryUserRepository implements UserRepository {
  readonly #store = new Map<string, User>();

  async findById(id: UserId): Promise<User | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly User[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: User): Promise<void> {
    for (const existing of this.#store.values()) {
      if (existing.email === entity.email && (existing.id as string) !== (entity.id as string)) {
        throw new Error(
          `Email "${entity.email}" is already registered to user id "${existing.id as string}"`,
        );
      }
    }
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: UserId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.#store.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findByOrganization(orgId: OrganizationId): Promise<readonly User[]> {
    const results: User[] = [];
    for (const user of this.#store.values()) {
      if ((user.organizationId as string) === (orgId as string)) {
        results.push(user);
      }
    }
    return results;
  }
}
