/**
 * In-memory ISO record + integration event repositories.
 */

import type { IsoRecord, IsoRecordId, IsoKind } from "../../domain/iso.ts";
import type {
  IntegrationEvent,
  IntegrationEventId,
  IntegrationEventStatus,
  IntegrationSystem,
} from "../../domain/integration.ts";
import type { IntegrationEventRepository, IsoRecordRepository } from "../ports.ts";

class InMemoryRepo<T extends { id: string }> {
  readonly #store = new Map<string, T>();
  async findById(id: string): Promise<T | null> {
    return this.#store.get(id) ?? null;
  }
  async findAll(): Promise<readonly T[]> {
    return Array.from(this.#store.values());
  }
  async save(entity: T): Promise<void> {
    this.#store.set(entity.id, entity);
  }
  async delete(id: string): Promise<void> {
    this.#store.delete(id);
  }
}

export class InMemoryIsoRecordRepository
  extends InMemoryRepo<IsoRecord>
  implements IsoRecordRepository
{
  override async findById(id: IsoRecordId): Promise<IsoRecord | null> {
    return super.findById(id as string);
  }
  override async delete(id: IsoRecordId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly IsoRecord[]> {
    return (await this.findAll()).filter((record) => record.organizationId === orgId);
  }
  async findByKind(kind: IsoKind): Promise<readonly IsoRecord[]> {
    return (await this.findAll()).filter((record) => record.kind === kind);
  }
  async findByProject(projectId: string): Promise<readonly IsoRecord[]> {
    return (await this.findAll()).filter((record) => record.projectId === projectId);
  }
  async findByStatus(status: string): Promise<readonly IsoRecord[]> {
    return (await this.findAll()).filter((record) => record.status === status);
  }
  async findByParent(parentId: string): Promise<readonly IsoRecord[]> {
    return (await this.findAll()).filter((record) => record.parentId === parentId);
  }
}

export class InMemoryIntegrationEventRepository
  extends InMemoryRepo<IntegrationEvent>
  implements IntegrationEventRepository
{
  override async findById(id: IntegrationEventId): Promise<IntegrationEvent | null> {
    return super.findById(id as string);
  }
  override async delete(id: IntegrationEventId): Promise<void> {
    return super.delete(id as string);
  }
  async findBySystem(system: IntegrationSystem): Promise<readonly IntegrationEvent[]> {
    return (await this.findAll()).filter((event) => event.system === system);
  }
  async findByStatus(status: IntegrationEventStatus): Promise<readonly IntegrationEvent[]> {
    return (await this.findAll()).filter((event) => event.status === status);
  }
  async findByDirection(direction: "inbound" | "outbound"): Promise<readonly IntegrationEvent[]> {
    return (await this.findAll()).filter((event) => event.direction === direction);
  }
  async findByIdempotencyKey(
    system: IntegrationSystem,
    key: string,
  ): Promise<IntegrationEvent | null> {
    const all = await this.findAll();
    return all.find((event) => event.system === system && event.idempotencyKey === key) ?? null;
  }
}
