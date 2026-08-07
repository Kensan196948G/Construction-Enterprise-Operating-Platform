import type { Project, ProjectId, ProjectStatus } from "../../domain/project.ts";
import type { ProjectRepository } from "../ports.ts";

/** In-memory implementation of {@link ProjectRepository}. */
export class InMemoryProjectRepository implements ProjectRepository {
  readonly #store = new Map<string, Project>();

  async findById(id: ProjectId): Promise<Project | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Project[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Project): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: ProjectId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByOrganization(orgId: string): Promise<readonly Project[]> {
    const results: Project[] = [];
    for (const project of this.#store.values()) {
      if ((project.organizationId ?? "") === orgId) results.push(project);
    }
    return results;
  }

  async findByStatus(status: ProjectStatus): Promise<readonly Project[]> {
    const results: Project[] = [];
    for (const project of this.#store.values()) {
      if (project.status === status) results.push(project);
    }
    return results;
  }

  async findByCode(code: string): Promise<Project | null> {
    for (const project of this.#store.values()) {
      if (project.projectCode === code) return project;
    }
    return null;
  }
}
