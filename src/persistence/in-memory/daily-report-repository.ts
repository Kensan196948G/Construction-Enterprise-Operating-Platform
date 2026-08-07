import type { DailyReport, DailyReportId, DailyReportStatus } from "../../domain/daily-report.ts";
import type { ProjectId } from "../../domain/project.ts";
import type { DailyReportRepository } from "../ports.ts";

/** In-memory implementation of {@link DailyReportRepository}. */
export class InMemoryDailyReportRepository implements DailyReportRepository {
  readonly #store = new Map<string, DailyReport>();

  async findById(id: DailyReportId): Promise<DailyReport | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly DailyReport[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: DailyReport): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: DailyReportId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByProject(projectId: ProjectId): Promise<readonly DailyReport[]> {
    const results: DailyReport[] = [];
    for (const report of this.#store.values()) {
      if ((report.projectId as string) === (projectId as string)) results.push(report);
    }
    return results;
  }

  async findByStatus(status: DailyReportStatus): Promise<readonly DailyReport[]> {
    const results: DailyReport[] = [];
    for (const report of this.#store.values()) {
      if (report.status === status) results.push(report);
    }
    return results;
  }
}
