import type { Application, ApplicationId } from "../../domain/application.ts";
import type { OrganizationId } from "../../domain/organization.ts";
import type { ApplicationRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link ApplicationRepository}.
 */
export class InMemoryApplicationRepository implements ApplicationRepository {
  readonly #store = new Map<string, Application>();

  async findById(id: ApplicationId): Promise<Application | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Application[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Application): Promise<void> {
    for (const existing of this.#store.values()) {
      if (existing.key === entity.key && (existing.id as string) !== (entity.id as string)) {
        throw new Error(
          `Application key "${entity.key}" is already in use by id "${existing.id as string}"`,
        );
      }
    }
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: ApplicationId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByKey(key: string): Promise<Application | null> {
    for (const app of this.#store.values()) {
      if (app.key === key) {
        return app;
      }
    }
    return null;
  }

  async findByOwner(orgId: OrganizationId): Promise<readonly Application[]> {
    const results: Application[] = [];
    for (const app of this.#store.values()) {
      if ((app.ownerOrganizationId as string) === (orgId as string)) {
        results.push(app);
      }
    }
    return results;
  }
}
