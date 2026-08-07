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
import type {
  PhotoRepository,
  SafetyCheckRepository,
  QualityInspectionRepository,
  CostRecordRepository,
  WorkHourRepository,
  NotificationDeliveryRepository,
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
