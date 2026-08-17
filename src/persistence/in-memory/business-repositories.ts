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
import type { Contract, ContractId } from "../../domain/contract.ts";
import type { KnowledgeArticle, KnowledgeId } from "../../domain/knowledge.ts";

import type { Document, DocumentId } from "../../domain/document.ts";
import type { WorkSchedule, WorkScheduleId } from "../../domain/work-schedule.ts";
import type { PurchaseOrder, PurchaseOrderId } from "../../domain/purchase-order.ts";
import type {
  NotificationPreference,
  NotificationPreferenceId,
} from "../../domain/notification-preference.ts";
import type {
  ComplianceCheck,
  ComplianceCheckId,
  LegalEvidence,
  LegalEvidenceId,
} from "../../domain/compliance.ts";
import type {
  NotificationTemplate,
  NotificationTemplateId,
} from "../../domain/notification-template.ts";
import type { WorkOrder, WorkOrderId } from "../../domain/work-order.ts";
import type { Inspection, InspectionId } from "../../domain/inspection.ts";
import type { SupplierEvaluation, SupplierEvaluationId } from "../../domain/supplier.ts";
import type { QualityObjective, QualityObjectiveId } from "../../domain/quality-objective.ts";
import type { Risk, RiskId } from "../../domain/risk.ts";
import type { ManagementReview, ManagementReviewId } from "../../domain/management-review.ts";
import type { AiBuildProject, AiBuildProjectId } from "../../domain/ai-build-project.ts";
import type { DxProject, DxProjectId } from "../../domain/dx-project.ts";
import type { MaterialPhotoLog, MaterialPhotoLogId } from "../../domain/material-photo-log.ts";

import type {
  PhotoRepository,
  SafetyCheckRepository,
  QualityInspectionRepository,
  CostRecordRepository,
  WorkHourRepository,
  NotificationDeliveryRepository,
  KnowledgeRepository,
  ContractRepository,
  DocumentRepository,
  WorkScheduleRepository,
  PurchaseOrderRepository,
  NotificationPreferenceRepository,
  ComplianceCheckRepository,
  LegalEvidenceRepository,
  NotificationTemplateRepository,
  WorkOrderRepository,
  InspectionRepository,
  SupplierEvaluationRepository,
  QualityObjectiveRepository,
  RiskRepository,
  ManagementReviewRepository,
  AiBuildProjectRepository,
  DxProjectRepository,
  MaterialPhotoLogRepository,
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

export class InMemoryDocumentRepository
  extends InMemoryRepo<Document>
  implements DocumentRepository
{
  override async findById(id: DocumentId): Promise<Document | null> {
    return super.findById(id as string);
  }
  override async delete(id: DocumentId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly Document[]> {
    return (await this.findAll()).filter((d) => d.organizationId === orgId);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Document[]> {
    return (await this.findAll()).filter((d) => (d.projectId ?? "") === (projectId as string));
  }
}
export class InMemoryWorkScheduleRepository
  extends InMemoryRepo<WorkSchedule>
  implements WorkScheduleRepository
{
  override async findById(id: WorkScheduleId): Promise<WorkSchedule | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkScheduleId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly WorkSchedule[]> {
    return (await this.findAll()).filter((s) => (s.projectId as string) === (projectId as string));
  }
}
export class InMemoryPurchaseOrderRepository
  extends InMemoryRepo<PurchaseOrder>
  implements PurchaseOrderRepository
{
  override async findById(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
    return super.findById(id as string);
  }
  override async delete(id: PurchaseOrderId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly PurchaseOrder[]> {
    return (await this.findAll()).filter((o) => (o.projectId as string) === (projectId as string));
  }
  async findByNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    return (await this.findAll()).find((o) => o.orderNumber === orderNumber) ?? null;
  }
}
export class InMemoryNotificationPreferenceRepository
  extends InMemoryRepo<NotificationPreference>
  implements NotificationPreferenceRepository
{
  override async findById(id: NotificationPreferenceId): Promise<NotificationPreference | null> {
    return super.findById(id as string);
  }
  override async delete(id: NotificationPreferenceId): Promise<void> {
    return super.delete(id as string);
  }
  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    return (await this.findAll()).find((p) => p.userId === userId) ?? null;
  }
}

export class InMemoryComplianceCheckRepository
  extends InMemoryRepo<ComplianceCheck>
  implements ComplianceCheckRepository
{
  override async findById(id: ComplianceCheckId): Promise<ComplianceCheck | null> {
    return super.findById(id as string);
  }
  override async delete(id: ComplianceCheckId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly ComplianceCheck[]> {
    return (await this.findAll()).filter((c) => (c.projectId as string) === (projectId as string));
  }
}
export class InMemoryLegalEvidenceRepository
  extends InMemoryRepo<LegalEvidence>
  implements LegalEvidenceRepository
{
  override async findById(id: LegalEvidenceId): Promise<LegalEvidence | null> {
    return super.findById(id as string);
  }
  override async delete(id: LegalEvidenceId): Promise<void> {
    return super.delete(id as string);
  }
  async findByContract(contractId: ContractId): Promise<readonly LegalEvidence[]> {
    return (await this.findAll()).filter(
      (e) => (e.contractId as string) === (contractId as string),
    );
  }
}
export class InMemoryNotificationTemplateRepository
  extends InMemoryRepo<NotificationTemplate>
  implements NotificationTemplateRepository
{
  override async findById(id: NotificationTemplateId): Promise<NotificationTemplate | null> {
    return super.findById(id as string);
  }
  override async delete(id: NotificationTemplateId): Promise<void> {
    return super.delete(id as string);
  }
  async findByKey(templateKey: string): Promise<NotificationTemplate | null> {
    return (await this.findAll()).find((t) => t.templateKey === templateKey) ?? null;
  }
}

export class InMemoryWorkOrderRepository
  extends InMemoryRepo<WorkOrder>
  implements WorkOrderRepository
{
  override async findById(id: WorkOrderId): Promise<WorkOrder | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkOrderId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly WorkOrder[]> {
    return (await this.findAll()).filter((w) => (w.projectId as string) === (projectId as string));
  }
}
export class InMemoryInspectionRepository
  extends InMemoryRepo<Inspection>
  implements InspectionRepository
{
  override async findById(id: InspectionId): Promise<Inspection | null> {
    return super.findById(id as string);
  }
  override async delete(id: InspectionId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Inspection[]> {
    return (await this.findAll()).filter((i) => (i.projectId as string) === (projectId as string));
  }
}
export class InMemorySupplierEvaluationRepository
  extends InMemoryRepo<SupplierEvaluation>
  implements SupplierEvaluationRepository
{
  override async findById(id: SupplierEvaluationId): Promise<SupplierEvaluation | null> {
    return super.findById(id as string);
  }
  override async delete(id: SupplierEvaluationId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly SupplierEvaluation[]> {
    return (await this.findAll()).filter((s) => s.organizationId === orgId);
  }
}
export class InMemoryQualityObjectiveRepository
  extends InMemoryRepo<QualityObjective>
  implements QualityObjectiveRepository
{
  override async findById(id: QualityObjectiveId): Promise<QualityObjective | null> {
    return super.findById(id as string);
  }
  override async delete(id: QualityObjectiveId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly QualityObjective[]> {
    return (await this.findAll()).filter((o) => o.organizationId === orgId);
  }
}
export class InMemoryRiskRepository extends InMemoryRepo<Risk> implements RiskRepository {
  override async findById(id: RiskId): Promise<Risk | null> {
    return super.findById(id as string);
  }
  override async delete(id: RiskId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly Risk[]> {
    return (await this.findAll()).filter((r) => r.organizationId === orgId);
  }
}
export class InMemoryManagementReviewRepository
  extends InMemoryRepo<ManagementReview>
  implements ManagementReviewRepository
{
  override async findById(id: ManagementReviewId): Promise<ManagementReview | null> {
    return super.findById(id as string);
  }
  override async delete(id: ManagementReviewId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly ManagementReview[]> {
    return (await this.findAll()).filter((r) => r.organizationId === orgId);
  }
}
export class InMemoryAiBuildProjectRepository
  extends InMemoryRepo<AiBuildProject>
  implements AiBuildProjectRepository
{
  override async findById(id: AiBuildProjectId): Promise<AiBuildProject | null> {
    return super.findById(id as string);
  }
  override async delete(id: AiBuildProjectId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly AiBuildProject[]> {
    return (await this.findAll()).filter((p) => p.organizationId === orgId);
  }
}
export class InMemoryDxProjectRepository
  extends InMemoryRepo<DxProject>
  implements DxProjectRepository
{
  override async findById(id: DxProjectId): Promise<DxProject | null> {
    return super.findById(id as string);
  }
  override async delete(id: DxProjectId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly DxProject[]> {
    return (await this.findAll()).filter((p) => p.organizationId === orgId);
  }
  async findBySlug(slug: string): Promise<DxProject | null> {
    return (await this.findAll()).find((p) => p.slug === slug) ?? null;
  }
}
export class InMemoryMaterialPhotoLogRepository
  extends InMemoryRepo<MaterialPhotoLog>
  implements MaterialPhotoLogRepository
{
  override async findById(id: MaterialPhotoLogId): Promise<MaterialPhotoLog | null> {
    return super.findById(id as string);
  }
  override async delete(id: MaterialPhotoLogId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly MaterialPhotoLog[]> {
    return (await this.findAll()).filter((l) => l.organizationId === orgId);
  }
  async findByProjectCode(projectCode: string): Promise<readonly MaterialPhotoLog[]> {
    return (await this.findAll()).filter((l) => l.projectCode === projectCode);
  }
}
