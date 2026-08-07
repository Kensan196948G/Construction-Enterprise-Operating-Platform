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
} from "../ports.ts";
import { BaseSqliteRepository } from "./base-sqlite-repository.ts";

export class SqlitePhotoRepository extends BaseSqliteRepository<Photo> implements PhotoRepository {
  constructor(db: unknown) {
    super(
      db,
      "photos",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "category TEXT NOT NULL",
      ],
      [
        { name: "idx_photos_org", columns: ["org_id"] },
        { name: "idx_photos_project", columns: ["project_id"] },
      ],
      ["org_id", "project_id", "category"],
    );
  }
  protected override extraValues(p: Photo): readonly unknown[] {
    return [p.organizationId, p.projectId as string, p.category];
  }
  override async findById(id: PhotoId): Promise<Photo | null> {
    return super.findById(id as string);
  }
  override async delete(id: PhotoId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Photo[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM photos WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Photo);
  }
}

export class SqliteSafetyCheckRepository
  extends BaseSqliteRepository<SafetyCheck>
  implements SafetyCheckRepository
{
  constructor(db: unknown) {
    super(
      db,
      "safety_checks",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "check_date TEXT NOT NULL",
      ],
      [
        { name: "idx_safety_checks_org", columns: ["org_id"] },
        { name: "idx_safety_checks_project", columns: ["project_id"] },
        { name: "idx_safety_checks_date", columns: ["check_date"] },
      ],
      ["org_id", "project_id", "check_date"],
    );
  }
  protected override extraValues(s: SafetyCheck): readonly unknown[] {
    return [s.organizationId, s.projectId as string, s.checkDate];
  }
  override async findById(id: SafetyCheckId): Promise<SafetyCheck | null> {
    return super.findById(id as string);
  }
  override async delete(id: SafetyCheckId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly SafetyCheck[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM safety_checks WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as SafetyCheck);
  }
}

export class SqliteQualityInspectionRepository
  extends BaseSqliteRepository<QualityInspection>
  implements QualityInspectionRepository
{
  constructor(db: unknown) {
    super(
      db,
      "quality_inspections",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "inspection_date TEXT NOT NULL",
      ],
      [
        { name: "idx_quality_org", columns: ["org_id"] },
        { name: "idx_quality_project", columns: ["project_id"] },
        { name: "idx_quality_date", columns: ["inspection_date"] },
      ],
      ["org_id", "project_id", "inspection_date"],
    );
  }
  protected override extraValues(q: QualityInspection): readonly unknown[] {
    return [q.organizationId, q.projectId as string, q.inspectionDate];
  }
  override async findById(id: QualityInspectionId): Promise<QualityInspection | null> {
    return super.findById(id as string);
  }
  override async delete(id: QualityInspectionId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly QualityInspection[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM quality_inspections WHERE project_id = ?",
    );
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as QualityInspection);
  }
}

export class SqliteCostRecordRepository
  extends BaseSqliteRepository<CostRecord>
  implements CostRecordRepository
{
  constructor(db: unknown) {
    super(
      db,
      "cost_records",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "record_date TEXT NOT NULL",
        "category TEXT NOT NULL",
      ],
      [
        { name: "idx_cost_org", columns: ["org_id"] },
        { name: "idx_cost_project", columns: ["project_id"] },
        { name: "idx_cost_date", columns: ["record_date"] },
        { name: "idx_cost_category", columns: ["category"] },
      ],
      ["org_id", "project_id", "record_date", "category"],
    );
  }
  protected override extraValues(c: CostRecord): readonly unknown[] {
    return [c.organizationId, c.projectId as string, c.recordDate, c.category];
  }
  override async findById(id: CostRecordId): Promise<CostRecord | null> {
    return super.findById(id as string);
  }
  override async delete(id: CostRecordId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly CostRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM cost_records WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as CostRecord);
  }
}

export class SqliteWorkHourRepository
  extends BaseSqliteRepository<WorkHour>
  implements WorkHourRepository
{
  constructor(db: unknown) {
    super(
      db,
      "work_hours",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "work_date TEXT NOT NULL",
      ],
      [
        { name: "idx_work_hours_org", columns: ["org_id"] },
        { name: "idx_work_hours_project", columns: ["project_id"] },
        { name: "idx_work_hours_date", columns: ["work_date"] },
      ],
      ["org_id", "project_id", "work_date"],
    );
  }
  protected override extraValues(w: WorkHour): readonly unknown[] {
    return [w.organizationId, w.projectId as string, w.workDate];
  }
  override async findById(id: WorkHourId): Promise<WorkHour | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkHourId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly WorkHour[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM work_hours WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as WorkHour);
  }
}

export class SqliteNotificationDeliveryRepository
  extends BaseSqliteRepository<NotificationDelivery>
  implements NotificationDeliveryRepository
{
  constructor(db: unknown) {
    super(
      db,
      "notification_deliveries",
      ["org_id TEXT", "user_id TEXT NOT NULL", "status TEXT NOT NULL"],
      [
        { name: "idx_notifications_org", columns: ["org_id"] },
        { name: "idx_notifications_user", columns: ["user_id"] },
        { name: "idx_notifications_status", columns: ["status"] },
      ],
      ["org_id", "user_id", "status"],
    );
  }
  protected override extraValues(n: NotificationDelivery): readonly unknown[] {
    return [n.organizationId ?? null, n.userId, n.status];
  }
  override async findById(id: NotificationDeliveryId): Promise<NotificationDelivery | null> {
    return super.findById(id as string);
  }
  override async delete(id: NotificationDeliveryId): Promise<void> {
    return super.delete(id as string);
  }
  async findByStatus(status: NotificationStatus): Promise<readonly NotificationDelivery[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM notification_deliveries WHERE status = ?",
    );
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as NotificationDelivery);
  }
}

export class SqliteKnowledgeRepository
  extends BaseSqliteRepository<KnowledgeArticle>
  implements KnowledgeRepository
{
  constructor(db: unknown) {
    super(
      db,
      "knowledge_articles",
      ["org_id TEXT NOT NULL", "category TEXT NOT NULL"],
      [
        { name: "idx_knowledge_org", columns: ["org_id"] },
        { name: "idx_knowledge_category", columns: ["category"] },
      ],
      ["org_id", "category"],
    );
  }
  protected override extraValues(k: KnowledgeArticle): readonly unknown[] {
    return [k.organizationId, k.category];
  }
  override async findById(id: KnowledgeId): Promise<KnowledgeArticle | null> {
    return super.findById(id as string);
  }
  override async delete(id: KnowledgeId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly KnowledgeArticle[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM knowledge_articles WHERE org_id = ?");
    const rows = stmt.all(orgId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as KnowledgeArticle);
  }
  async findByCategory(category: string): Promise<readonly KnowledgeArticle[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM knowledge_articles WHERE category = ?");
    const rows = stmt.all(category) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as KnowledgeArticle);
  }
}

export class SqliteContractRepository
  extends BaseSqliteRepository<Contract>
  implements ContractRepository
{
  constructor(db: unknown) {
    super(
      db,
      "legal_contracts",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "contract_number TEXT NOT NULL",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_contracts_org", columns: ["org_id"] },
        { name: "idx_contracts_project", columns: ["project_id"] },
        { name: "idx_contracts_number", columns: ["contract_number"], unique: true },
        { name: "idx_contracts_status", columns: ["status"] },
      ],
      ["org_id", "project_id", "contract_number", "status"],
    );
  }
  protected override extraValues(c: Contract): readonly unknown[] {
    return [c.organizationId, c.projectId as string, c.contractNumber, c.status];
  }
  override async findById(id: ContractId): Promise<Contract | null> {
    return super.findById(id as string);
  }
  override async delete(id: ContractId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Contract[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM legal_contracts WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Contract);
  }
  async findByNumber(contractNumber: string): Promise<Contract | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM legal_contracts WHERE contract_number = ?",
    );
    const row = stmt.get(contractNumber) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as Contract) : null;
  }
}

export class SqliteDocumentRepository
  extends BaseSqliteRepository<Document>
  implements DocumentRepository
{
  constructor(db: unknown) {
    super(
      db,
      "documents",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT",
        "document_type TEXT NOT NULL",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_documents_org", columns: ["org_id"] },
        { name: "idx_documents_project", columns: ["project_id"] },
        { name: "idx_documents_type", columns: ["document_type"] },
      ],
      ["org_id", "project_id", "document_type", "status"],
    );
  }
  protected override extraValues(d: Document): readonly unknown[] {
    return [d.organizationId, d.projectId ?? null, d.documentType, d.status];
  }
  override async findById(id: DocumentId): Promise<Document | null> {
    return super.findById(id as string);
  }
  override async delete(id: DocumentId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly Document[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM documents WHERE org_id = ?");
    const rows = stmt.all(orgId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Document);
  }
  async findByProject(projectId: ProjectId): Promise<readonly Document[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM documents WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Document);
  }
}

export class SqliteWorkScheduleRepository
  extends BaseSqliteRepository<WorkSchedule>
  implements WorkScheduleRepository
{
  constructor(db: unknown) {
    super(
      db,
      "work_schedules",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "work_date TEXT NOT NULL",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_work_schedules_org", columns: ["org_id"] },
        { name: "idx_work_schedules_project", columns: ["project_id"] },
        { name: "idx_work_schedules_date", columns: ["work_date"] },
      ],
      ["org_id", "project_id", "work_date", "status"],
    );
  }
  protected override extraValues(s: WorkSchedule): readonly unknown[] {
    return [s.organizationId, s.projectId as string, s.workDate, s.status];
  }
  override async findById(id: WorkScheduleId): Promise<WorkSchedule | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkScheduleId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly WorkSchedule[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM work_schedules WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as WorkSchedule);
  }
}

export class SqlitePurchaseOrderRepository
  extends BaseSqliteRepository<PurchaseOrder>
  implements PurchaseOrderRepository
{
  constructor(db: unknown) {
    super(
      db,
      "purchase_orders",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "order_number TEXT NOT NULL",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_purchase_orders_org", columns: ["org_id"] },
        { name: "idx_purchase_orders_project", columns: ["project_id"] },
        { name: "idx_purchase_orders_number", columns: ["order_number"], unique: true },
      ],
      ["org_id", "project_id", "order_number", "status"],
    );
  }
  protected override extraValues(o: PurchaseOrder): readonly unknown[] {
    return [o.organizationId, o.projectId as string, o.orderNumber, o.status];
  }
  override async findById(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
    return super.findById(id as string);
  }
  override async delete(id: PurchaseOrderId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly PurchaseOrder[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM purchase_orders WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as PurchaseOrder);
  }
  async findByNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM purchase_orders WHERE order_number = ?",
    );
    const row = stmt.get(orderNumber) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as PurchaseOrder) : null;
  }
}

export class SqliteNotificationPreferenceRepository
  extends BaseSqliteRepository<NotificationPreference>
  implements NotificationPreferenceRepository
{
  constructor(db: unknown) {
    super(
      db,
      "notification_preferences",
      ["org_id TEXT", "user_id TEXT NOT NULL"],
      [
        { name: "idx_notification_prefs_org", columns: ["org_id"] },
        { name: "idx_notification_prefs_user", columns: ["user_id"], unique: true },
      ],
      ["org_id", "user_id"],
    );
  }
  protected override extraValues(p: NotificationPreference): readonly unknown[] {
    return [p.organizationId ?? null, p.userId];
  }
  override async findById(id: NotificationPreferenceId): Promise<NotificationPreference | null> {
    return super.findById(id as string);
  }
  override async delete(id: NotificationPreferenceId): Promise<void> {
    return super.delete(id as string);
  }
  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM notification_preferences WHERE user_id = ?",
    );
    const row = stmt.get(userId) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as NotificationPreference) : null;
  }
}

export class SqliteComplianceCheckRepository
  extends BaseSqliteRepository<ComplianceCheck>
  implements ComplianceCheckRepository
{
  constructor(db: unknown) {
    super(
      db,
      "compliance_checks",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "standard TEXT NOT NULL",
        "result TEXT NOT NULL",
      ],
      [
        { name: "idx_compliance_org", columns: ["org_id"] },
        { name: "idx_compliance_project", columns: ["project_id"] },
        { name: "idx_compliance_standard", columns: ["standard"] },
      ],
      ["org_id", "project_id", "standard", "result"],
    );
  }
  protected override extraValues(c: ComplianceCheck): readonly unknown[] {
    return [c.organizationId, c.projectId as string, c.standard, c.result];
  }
  override async findById(id: ComplianceCheckId): Promise<ComplianceCheck | null> {
    return super.findById(id as string);
  }
  override async delete(id: ComplianceCheckId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly ComplianceCheck[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM compliance_checks WHERE project_id = ?",
    );
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as ComplianceCheck);
  }
}

export class SqliteLegalEvidenceRepository
  extends BaseSqliteRepository<LegalEvidence>
  implements LegalEvidenceRepository
{
  constructor(db: unknown) {
    super(
      db,
      "legal_evidence",
      [
        "org_id TEXT NOT NULL",
        "contract_id TEXT NOT NULL REFERENCES legal_contracts(id)",
        "event_type TEXT NOT NULL",
      ],
      [
        { name: "idx_legal_evidence_org", columns: ["org_id"] },
        { name: "idx_legal_evidence_contract", columns: ["contract_id"] },
      ],
      ["org_id", "contract_id", "event_type"],
    );
  }
  protected override extraValues(e: LegalEvidence): readonly unknown[] {
    return [e.organizationId, e.contractId as string, e.eventType];
  }
  override async findById(id: LegalEvidenceId): Promise<LegalEvidence | null> {
    return super.findById(id as string);
  }
  override async delete(id: LegalEvidenceId): Promise<void> {
    return super.delete(id as string);
  }
  async findByContract(contractId: ContractId): Promise<readonly LegalEvidence[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM legal_evidence WHERE contract_id = ?");
    const rows = stmt.all(contractId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as LegalEvidence);
  }
}

export class SqliteNotificationTemplateRepository
  extends BaseSqliteRepository<NotificationTemplate>
  implements NotificationTemplateRepository
{
  constructor(db: unknown) {
    super(
      db,
      "notification_templates",
      ["org_id TEXT", "template_key TEXT NOT NULL", "channel TEXT NOT NULL"],
      [
        { name: "idx_notification_templates_org", columns: ["org_id"] },
        { name: "idx_notification_templates_key", columns: ["template_key"], unique: true },
      ],
      ["org_id", "template_key", "channel"],
    );
  }
  protected override extraValues(tpl: NotificationTemplate): readonly unknown[] {
    return [tpl.organizationId ?? null, tpl.templateKey, tpl.channel];
  }
  override async findById(id: NotificationTemplateId): Promise<NotificationTemplate | null> {
    return super.findById(id as string);
  }
  override async delete(id: NotificationTemplateId): Promise<void> {
    return super.delete(id as string);
  }
  async findByKey(templateKey: string): Promise<NotificationTemplate | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM notification_templates WHERE template_key = ?",
    );
    const row = stmt.get(templateKey) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as NotificationTemplate) : null;
  }
}
