import type { Organization, OrganizationId } from "../../domain/organization.ts";
import type { OrganizationRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link OrganizationRepository}.
 */
export class InMemoryOrganizationRepository implements OrganizationRepository {
  readonly #store = new Map<string, Organization>();

  async findById(id: OrganizationId): Promise<Organization | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Organization[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Organization): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: OrganizationId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findHeadquarters(): Promise<readonly Organization[]> {
    const results: Organization[] = [];
    for (const org of this.#store.values()) {
      if (org.type === "headquarters") {
        results.push(org);
      }
    }
    return results;
  }

  async findByParent(parentId: OrganizationId): Promise<readonly Organization[]> {
    const results: Organization[] = [];
    for (const org of this.#store.values()) {
      if (org.parentId !== undefined && (org.parentId as string) === (parentId as string)) {
        results.push(org);
      }
    }
    return results;
  }
}
