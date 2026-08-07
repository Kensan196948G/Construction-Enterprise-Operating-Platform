import type { Photo, PhotoId } from "../../domain/photo.ts";
import type {
  SafetyCheck,
  SafetyCheckId,
  QualityInspection,
  QualityInspectionId,
} from "../../domain/safety.ts";
import type { CostRecord, CostRecordId, WorkHour, WorkHourId } from "../../domain/cost.ts";
import type {
  NotificationDelivery,
  NotificationDeliveryId,
  NotificationStatus,
} from "../../domain/notification.ts";

import type { ProjectId } from "../../domain/project.ts";
import type { KnowledgeArticle, KnowledgeId } from "../../domain/knowledge.ts";
import type { Contract, ContractId } from "../../domain/contract.ts";

import type {
  PhotoRepository,
  SafetyCheckRepository,
  QualityInspectionRepository,
  CostRecordRepository,
  WorkHourRepository,
  NotificationDeliveryRepository,
  KnowledgeRepository,
  ContractRepository,
} from "../ports.ts";

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
  protected byProject(items: readonly T[], projectId: ProjectId, key: (e: T) => string): T[] {
    return items.filter((e) => key(e) === (projectId as string));
  }
}

export class InMemoryPhotoRepository extends InMemoryRepo<Photo> implements PhotoRepository {
  override async findById(id: PhotoId): Promise<Photo | null> {
    return super.findById(id as string);
  }
  override async delete(id: PhotoId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Photo[]> {
    return this.byProject(await this.findAll(), projectId, (p) => p.projectId as string);
  }
}
export class InMemorySafetyCheckRepository
  extends InMemoryRepo<SafetyCheck>
  implements SafetyCheckRepository
{
  override async findById(id: SafetyCheckId): Promise<SafetyCheck | null> {
    return super.findById(id as string);
  }
  override async delete(id: SafetyCheckId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly SafetyCheck[]> {
    return this.byProject(await this.findAll(), projectId, (s) => s.projectId as string);
  }
}
export class InMemoryQualityInspectionRepository
  extends InMemoryRepo<QualityInspection>
  implements QualityInspectionRepository
{
  override async findById(id: QualityInspectionId): Promise<QualityInspection | null> {
    return super.findById(id as string);
  }
  override async delete(id: QualityInspectionId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly QualityInspection[]> {
    return this.byProject(await this.findAll(), projectId, (q) => q.projectId as string);
  }
}
export class InMemoryCostRecordRepository
  extends InMemoryRepo<CostRecord>
  implements CostRecordRepository
{
  override async findById(id: CostRecordId): Promise<CostRecord | null> {
    return super.findById(id as string);
  }
  override async delete(id: CostRecordId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly CostRecord[]> {
    return this.byProject(await this.findAll(), projectId, (c) => c.projectId as string);
  }
}
export class InMemoryWorkHourRepository
  extends InMemoryRepo<WorkHour>
  implements WorkHourRepository
{
  override async findById(id: WorkHourId): Promise<WorkHour | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkHourId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly WorkHour[]> {
    return this.byProject(await this.findAll(), projectId, (w) => w.projectId as string);
  }
}
export class InMemoryNotificationDeliveryRepository
  extends InMemoryRepo<NotificationDelivery>
  implements NotificationDeliveryRepository
{
  override async findById(id: NotificationDeliveryId): Promise<NotificationDelivery | null> {
    return super.findById(id as string);
  }
  override async delete(id: NotificationDeliveryId): Promise<void> {
    return super.delete(id as string);
  }
  async findByStatus(status: NotificationStatus): Promise<readonly NotificationDelivery[]> {
    return (await this.findAll()).filter((n) => n.status === status);
  }
}

export class InMemoryKnowledgeRepository
  extends InMemoryRepo<KnowledgeArticle>
  implements KnowledgeRepository
{
  override async findById(id: KnowledgeId): Promise<KnowledgeArticle | null> {
    return super.findById(id as string);
  }
  override async delete(id: KnowledgeId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly KnowledgeArticle[]> {
    return (await this.findAll()).filter((k) => k.organizationId === orgId);
  }
  async findByCategory(category: string): Promise<readonly KnowledgeArticle[]> {
    return (await this.findAll()).filter((k) => k.category === category);
  }
}
export class InMemoryContractRepository
  extends InMemoryRepo<Contract>
  implements ContractRepository
{
  override async findById(id: ContractId): Promise<Contract | null> {
    return super.findById(id as string);
  }
  override async delete(id: ContractId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Contract[]> {
    return this.byProject(await this.findAll(), projectId, (c) => c.projectId as string);
  }
  async findByNumber(contractNumber: string): Promise<Contract | null> {
    return (await this.findAll()).find((c) => c.contractNumber === contractNumber) ?? null;
  }
}
