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
import { BaseFileRepository } from "./base-file-repository.ts";

export class FilePhotoRepository extends BaseFileRepository<Photo> implements PhotoRepository {
  override async findById(id: PhotoId): Promise<Photo | null> {
    return super.findById(id as string);
  }
  override async delete(id: PhotoId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Photo[]> {
    return (await this.findAll()).filter((p) => (p.projectId as string) === (projectId as string));
  }
}
export class FileSafetyCheckRepository
  extends BaseFileRepository<SafetyCheck>
  implements SafetyCheckRepository
{
  override async findById(id: SafetyCheckId): Promise<SafetyCheck | null> {
    return super.findById(id as string);
  }
  override async delete(id: SafetyCheckId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly SafetyCheck[]> {
    return (await this.findAll()).filter((s) => (s.projectId as string) === (projectId as string));
  }
}
export class FileQualityInspectionRepository
  extends BaseFileRepository<QualityInspection>
  implements QualityInspectionRepository
{
  override async findById(id: QualityInspectionId): Promise<QualityInspection | null> {
    return super.findById(id as string);
  }
  override async delete(id: QualityInspectionId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly QualityInspection[]> {
    return (await this.findAll()).filter((q) => (q.projectId as string) === (projectId as string));
  }
}
export class FileCostRecordRepository
  extends BaseFileRepository<CostRecord>
  implements CostRecordRepository
{
  override async findById(id: CostRecordId): Promise<CostRecord | null> {
    return super.findById(id as string);
  }
  override async delete(id: CostRecordId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly CostRecord[]> {
    return (await this.findAll()).filter((c) => (c.projectId as string) === (projectId as string));
  }
}
export class FileWorkHourRepository
  extends BaseFileRepository<WorkHour>
  implements WorkHourRepository
{
  override async findById(id: WorkHourId): Promise<WorkHour | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkHourId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly WorkHour[]> {
    return (await this.findAll()).filter((w) => (w.projectId as string) === (projectId as string));
  }
}
export class FileNotificationDeliveryRepository
  extends BaseFileRepository<NotificationDelivery>
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

export class FileKnowledgeRepository
  extends BaseFileRepository<KnowledgeArticle>
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
export class FileContractRepository
  extends BaseFileRepository<Contract>
  implements ContractRepository
{
  override async findById(id: ContractId): Promise<Contract | null> {
    return super.findById(id as string);
  }
  override async delete(id: ContractId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Contract[]> {
    return (await this.findAll()).filter((c) => (c.projectId as string) === (projectId as string));
  }
  async findByNumber(contractNumber: string): Promise<Contract | null> {
    return (await this.findAll()).find((c) => c.contractNumber === contractNumber) ?? null;
  }
}
