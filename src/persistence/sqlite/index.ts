/**
 * SQLite-backed repository implementations (M7).
 *
 * Each concrete class:
 *   1. Extends BaseSqliteRepository with domain-specific extra indexed columns.
 *   2. Overrides `extraValues()` to supply values for those columns.
 *   3. Implements domain-specific query methods using prepared statements
 *      (indexed WHERE clauses) instead of in-process Array.filter().
 *
 * Storage layout (per table):
 *   id    TEXT PRIMARY KEY
 *   data  TEXT NOT NULL        — full entity as JSON
 *   ...   indexed helper cols  — redundant values for O(log n) queries
 */

import type { Permission } from "../../domain/role.ts";
import type { Application, ApplicationId } from "../../domain/application.ts";
import type { Device, DeviceId } from "../../domain/device.ts";
import type { Organization, OrganizationId } from "../../domain/organization.ts";
import type { Policy, PolicyId } from "../../domain/policy.ts";
import type { Role, RoleId } from "../../domain/role.ts";
import type { User, UserId } from "../../domain/user.ts";
import type { Workflow, WorkflowId, WorkflowStatus, WorkflowType } from "../../domain/workflow.ts";
import type {
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowInstanceStatus,
} from "../../domain/workflow-instance.ts";
import type { AiAction, AiActionId, AiActionStatus } from "../../domain/ai-action.ts";
import type { Project, ProjectId, ProjectStatus } from "../../domain/project.ts";
import type { DailyReport, DailyReportId, DailyReportStatus } from "../../domain/daily-report.ts";
import type {
  ApplicationRepository,
  DeviceRepository,
  OrganizationRepository,
  PolicyRepository,
  Repositories,
  RoleRepository,
  UserRepository,
  WorkflowRepository,
  WorkflowInstanceRepository,
  AiActionRepository,
  ProjectRepository,
  DailyReportRepository,
} from "../ports.ts";
import type { ApiKeyStore } from "../../api/types.ts";
import { BaseSqliteRepository, openDatabase } from "./base-sqlite-repository.ts";
import {
  SqlitePhotoRepository,
  SqliteSafetyCheckRepository,
  SqliteQualityInspectionRepository,
  SqliteCostRecordRepository,
  SqliteWorkHourRepository,
  SqliteNotificationDeliveryRepository,
  SqliteKnowledgeRepository,
  SqliteContractRepository,
  SqliteDocumentRepository,
  SqliteWorkScheduleRepository,
  SqlitePurchaseOrderRepository,
  SqliteNotificationPreferenceRepository,
  SqliteComplianceCheckRepository,
  SqliteLegalEvidenceRepository,
  SqliteNotificationTemplateRepository,
} from "./business-repositories.ts";
import { SqliteIsoRecordRepository, SqliteIntegrationEventRepository } from "./iso-repositories.ts";

// ---------------------------------------------------------------------------
// Concrete repositories
// ---------------------------------------------------------------------------

class SqliteUserRepository extends BaseSqliteRepository<User> implements UserRepository {
  constructor(db: unknown) {
    super(
      db,
      "users",
      ["email TEXT NOT NULL", "org_id TEXT NOT NULL REFERENCES organizations(id)"],
      [
        { name: "idx_users_email", columns: ["email"], unique: true },
        { name: "idx_users_org", columns: ["org_id"] },
      ],
      ["email", "org_id"],
    );
  }

  protected override extraValues(u: User): readonly unknown[] {
    return [u.email, u.organizationId as string];
  }

  override async findById(id: UserId): Promise<User | null> {
    return super.findById(id as string);
  }

  override async delete(id: UserId): Promise<void> {
    return super.delete(id as string);
  }

  async findByEmail(email: string): Promise<User | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM users WHERE email = ?");

    const row = stmt.get(email) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as User) : null;
  }

  async findByOrganization(orgId: OrganizationId): Promise<readonly User[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM users WHERE org_id = ?");

    const rows = stmt.all(orgId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as User);
  }
}

class SqliteOrganizationRepository
  extends BaseSqliteRepository<Organization>
  implements OrganizationRepository
{
  constructor(db: unknown) {
    super(
      db,
      "organizations",
      ["type TEXT NOT NULL", "parent_id TEXT REFERENCES organizations(id)"],
      [
        { name: "idx_orgs_type", columns: ["type"] },
        { name: "idx_orgs_parent", columns: ["parent_id"] },
      ],
      ["type", "parent_id"],
    );
  }

  protected override extraValues(o: Organization): readonly unknown[] {
    return [o.type, o.parentId !== undefined ? (o.parentId as string) : null];
  }

  override async findById(id: OrganizationId): Promise<Organization | null> {
    return super.findById(id as string);
  }

  override async delete(id: OrganizationId): Promise<void> {
    return super.delete(id as string);
  }

  async findHeadquarters(): Promise<readonly Organization[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare(
      "SELECT data FROM organizations WHERE type = 'headquarters'",
    );

    const rows = stmt.all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Organization);
  }

  async findByParent(parentId: OrganizationId): Promise<readonly Organization[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM organizations WHERE parent_id = ?");

    const rows = stmt.all(parentId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Organization);
  }
}

class SqliteRoleRepository extends BaseSqliteRepository<Role> implements RoleRepository {
  constructor(db: unknown) {
    super(
      db,
      "roles",
      ["name TEXT NOT NULL"],
      [{ name: "idx_roles_name", columns: ["name"], unique: true }],
      ["name"],
    );
  }

  protected override extraValues(r: Role): readonly unknown[] {
    return [r.name];
  }

  override async findById(id: RoleId): Promise<Role | null> {
    return super.findById(id as string);
  }

  override async delete(id: RoleId): Promise<void> {
    return super.delete(id as string);
  }

  async findByName(name: string): Promise<Role | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM roles WHERE name = ?");

    const row = stmt.get(name) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as Role) : null;
  }
}

class SqliteDeviceRepository extends BaseSqliteRepository<Device> implements DeviceRepository {
  constructor(db: unknown) {
    super(
      db,
      "devices",
      ["org_id TEXT NOT NULL REFERENCES organizations(id)"],
      [{ name: "idx_devices_org", columns: ["org_id"] }],
      ["org_id"],
    );
  }

  protected override extraValues(d: Device): readonly unknown[] {
    return [d.organizationId as string];
  }

  override async findById(id: DeviceId): Promise<Device | null> {
    return super.findById(id as string);
  }

  override async delete(id: DeviceId): Promise<void> {
    return super.delete(id as string);
  }

  async findByOrganization(orgId: OrganizationId): Promise<readonly Device[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM devices WHERE org_id = ?");

    const rows = stmt.all(orgId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Device);
  }
}

class SqliteApplicationRepository
  extends BaseSqliteRepository<Application>
  implements ApplicationRepository
{
  constructor(db: unknown) {
    super(
      db,
      "applications",
      ["app_key TEXT NOT NULL", "owner_org_id TEXT NOT NULL REFERENCES organizations(id)"],
      [
        { name: "idx_apps_key", columns: ["app_key"], unique: true },
        { name: "idx_apps_owner", columns: ["owner_org_id"] },
      ],
      ["app_key", "owner_org_id"],
    );
  }

  protected override extraValues(a: Application): readonly unknown[] {
    return [a.key, a.ownerOrganizationId as string];
  }

  override async findById(id: ApplicationId): Promise<Application | null> {
    return super.findById(id as string);
  }

  override async delete(id: ApplicationId): Promise<void> {
    return super.delete(id as string);
  }

  async findByKey(key: string): Promise<Application | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM applications WHERE app_key = ?");

    const row = stmt.get(key) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as Application) : null;
  }

  async findByOwner(orgId: OrganizationId): Promise<readonly Application[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM applications WHERE owner_org_id = ?");

    const rows = stmt.all(orgId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Application);
  }
}

class SqlitePolicyRepository extends BaseSqliteRepository<Policy> implements PolicyRepository {
  constructor(db: unknown) {
    super(
      db,
      "policies",
      ["effect TEXT NOT NULL"],
      [{ name: "idx_policies_effect", columns: ["effect"] }],
      ["effect"],
    );
  }

  protected override extraValues(p: Policy): readonly unknown[] {
    return [p.effect];
  }

  override async findById(id: PolicyId): Promise<Policy | null> {
    return super.findById(id as string);
  }

  override async delete(id: PolicyId): Promise<void> {
    return super.delete(id as string);
  }

  async findByEffect(effect: "allow" | "deny"): Promise<readonly Policy[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM policies WHERE effect = ?");

    const rows = stmt.all(effect) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Policy);
  }
}

class SqliteWorkflowRepository
  extends BaseSqliteRepository<Workflow>
  implements WorkflowRepository
{
  constructor(db: unknown) {
    super(
      db,
      "workflows",
      ["workflow_type TEXT NOT NULL", "status TEXT NOT NULL"],
      [
        { name: "idx_workflows_type", columns: ["workflow_type"] },
        { name: "idx_workflows_status", columns: ["status"] },
      ],
      ["workflow_type", "status"],
    );
  }

  protected override extraValues(w: Workflow): readonly unknown[] {
    return [w.type, w.status];
  }

  override async findById(id: WorkflowId): Promise<Workflow | null> {
    return super.findById(id as string);
  }

  override async delete(id: WorkflowId): Promise<void> {
    return super.delete(id as string);
  }

  async findByType(type: WorkflowType): Promise<readonly Workflow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM workflows WHERE workflow_type = ?");

    const rows = stmt.all(type) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Workflow);
  }

  async findByStatus(status: WorkflowStatus): Promise<readonly Workflow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM workflows WHERE status = ?");

    const rows = stmt.all(status) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Workflow);
  }
}

class SqliteWorkflowInstanceRepository
  extends BaseSqliteRepository<WorkflowInstance>
  implements WorkflowInstanceRepository
{
  constructor(db: unknown) {
    super(
      db,
      "workflow_instances",
      [
        "workflow_id TEXT NOT NULL",
        "org_id TEXT NOT NULL REFERENCES organizations(id)",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_workflow_instances_org", columns: ["org_id"] },
        { name: "idx_workflow_instances_status", columns: ["status"] },
      ],
      ["workflow_id", "org_id", "status"],
    );
  }

  protected override extraValues(w: WorkflowInstance): readonly unknown[] {
    return [w.workflowId as string, w.organizationId as string, w.status];
  }

  override async findById(id: WorkflowInstanceId): Promise<WorkflowInstance | null> {
    return super.findById(id as string);
  }

  override async delete(id: WorkflowInstanceId): Promise<void> {
    return super.delete(id as string);
  }

  async findByOrganization(orgId: string): Promise<readonly WorkflowInstance[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM workflow_instances WHERE org_id = ?");
    const rows = stmt.all(orgId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as WorkflowInstance);
  }

  async findByStatus(status: WorkflowInstanceStatus): Promise<readonly WorkflowInstance[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM workflow_instances WHERE status = ?");
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as WorkflowInstance);
  }
}

class SqliteAiActionRepository
  extends BaseSqliteRepository<AiAction>
  implements AiActionRepository
{
  constructor(db: unknown) {
    super(
      db,
      "ai_actions",
      ["org_id TEXT", "status TEXT NOT NULL"],
      [
        { name: "idx_ai_actions_org", columns: ["org_id"] },
        { name: "idx_ai_actions_status", columns: ["status"] },
      ],
      ["org_id", "status"],
    );
  }

  protected override extraValues(a: AiAction): readonly unknown[] {
    return [a.organizationId ?? null, a.status];
  }

  override async findById(id: AiActionId): Promise<AiAction | null> {
    return super.findById(id as string);
  }

  override async delete(id: AiActionId): Promise<void> {
    return super.delete(id as string);
  }

  async findByOrganization(orgId: string): Promise<readonly AiAction[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM ai_actions WHERE org_id = ?");
    const rows = stmt.all(orgId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as AiAction);
  }

  async findByStatus(status: AiActionStatus): Promise<readonly AiAction[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM ai_actions WHERE status = ?");
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as AiAction);
  }
}

class SqliteProjectRepository extends BaseSqliteRepository<Project> implements ProjectRepository {
  constructor(db: unknown) {
    super(
      db,
      "projects",
      ["org_id TEXT NOT NULL", "project_code TEXT NOT NULL", "status TEXT NOT NULL"],
      [
        { name: "idx_projects_org", columns: ["org_id"] },
        { name: "idx_projects_code", columns: ["project_code"], unique: true },
        { name: "idx_projects_status", columns: ["status"] },
      ],
      ["org_id", "project_code", "status"],
    );
  }

  protected override extraValues(project: Project): readonly unknown[] {
    return [project.organizationId, project.projectCode, project.status];
  }

  override async findById(id: ProjectId): Promise<Project | null> {
    return super.findById(id as string);
  }

  override async delete(id: ProjectId): Promise<void> {
    return super.delete(id as string);
  }

  async findByOrganization(orgId: string): Promise<readonly Project[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM projects WHERE org_id = ?");
    const rows = stmt.all(orgId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Project);
  }

  async findByStatus(status: ProjectStatus): Promise<readonly Project[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM projects WHERE status = ?");
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Project);
  }

  async findByCode(code: string): Promise<Project | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM projects WHERE project_code = ?");
    const row = stmt.get(code) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as Project) : null;
  }
}

class SqliteDailyReportRepository
  extends BaseSqliteRepository<DailyReport>
  implements DailyReportRepository
{
  constructor(db: unknown) {
    super(
      db,
      "daily_reports",
      [
        "org_id TEXT NOT NULL",
        "project_id TEXT NOT NULL REFERENCES projects(id)",
        "report_date TEXT NOT NULL",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_daily_reports_org", columns: ["org_id"] },
        { name: "idx_daily_reports_project", columns: ["project_id"] },
        { name: "idx_daily_reports_date", columns: ["report_date"] },
        { name: "idx_daily_reports_status", columns: ["status"] },
      ],
      ["org_id", "project_id", "report_date", "status"],
    );
  }

  protected override extraValues(report: DailyReport): readonly unknown[] {
    return [report.organizationId, report.projectId as string, report.reportDate, report.status];
  }

  override async findById(id: DailyReportId): Promise<DailyReport | null> {
    return super.findById(id as string);
  }

  override async delete(id: DailyReportId): Promise<void> {
    return super.delete(id as string);
  }

  async findByProject(projectId: ProjectId): Promise<readonly DailyReport[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM daily_reports WHERE project_id = ?");
    const rows = stmt.all(projectId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as DailyReport);
  }

  async findByStatus(status: DailyReportStatus): Promise<readonly DailyReport[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (this.db as any).prepare("SELECT data FROM daily_reports WHERE status = ?");
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as DailyReport);
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Open (or create) a SQLite database at `dbPath` and return a fully-wired
 * `Repositories` aggregate. The database is shared across all repositories
 * so they participate in the same WAL journal.
 */
export function createSqliteRepositories(dbPath: string): Repositories {
  const db = openDatabase(dbPath);
  // organizations must be created first — users/devices/applications reference it via FK.
  const organizations = new SqliteOrganizationRepository(db);
  return {
    users: new SqliteUserRepository(db),
    organizations,
    roles: new SqliteRoleRepository(db),
    devices: new SqliteDeviceRepository(db),
    applications: new SqliteApplicationRepository(db),
    policies: new SqlitePolicyRepository(db),
    workflows: new SqliteWorkflowRepository(db),
    workflowInstances: new SqliteWorkflowInstanceRepository(db),
    aiActions: new SqliteAiActionRepository(db),
    projects: new SqliteProjectRepository(db),
    dailyReports: new SqliteDailyReportRepository(db),
    photos: new SqlitePhotoRepository(db),
    safetyChecks: new SqliteSafetyCheckRepository(db),
    qualityInspections: new SqliteQualityInspectionRepository(db),
    costRecords: new SqliteCostRecordRepository(db),
    workHours: new SqliteWorkHourRepository(db),
    notificationDeliveries: new SqliteNotificationDeliveryRepository(db),
    knowledgeArticles: new SqliteKnowledgeRepository(db),
    contracts: new SqliteContractRepository(db),
    documents: new SqliteDocumentRepository(db),
    workSchedules: new SqliteWorkScheduleRepository(db),
    purchaseOrders: new SqlitePurchaseOrderRepository(db),
    notificationPreferences: new SqliteNotificationPreferenceRepository(db),
    complianceChecks: new SqliteComplianceCheckRepository(db),
    legalEvidences: new SqliteLegalEvidenceRepository(db),
    notificationTemplates: new SqliteNotificationTemplateRepository(db),
    isoRecords: new SqliteIsoRecordRepository(db),
    integrationEvents: new SqliteIntegrationEventRepository(db),
  };
}

/**
 * Load provisioned API keys from the SQLite `api_keys` table into the given store.
 *
 * The `api_keys` table is created by migration 002 and populated via
 * `scripts/provision-api-key.ts`. A second connection is opened so this
 * function can be called independently of `createSqliteRepositories()`.
 * WAL mode supports multiple concurrent readers safely.
 *
 * If the table does not exist (migrations not run), a warning is logged and
 * the store is left empty — callers should treat this as a configuration error.
 */
export function loadApiKeysFromSqlite(dbPath: string, store: ApiKeyStore): void {
  const db = openDatabase(dbPath);
  try {
    type TableRow = { name: string };
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='api_keys'")
      .get() as TableRow | undefined;
    if (!tableExists) {
      console.error(
        "[app] Warning: api_keys table not found — run migrations first: node --experimental-strip-types scripts/migrate.ts",
      );
      return;
    }
    const columns = db.prepare("PRAGMA table_info(api_keys)").all() as { name: string }[];
    const hasOrgColumn = columns.some((c) => c.name === "organization_id");
    type ApiKeyRow = {
      key_id: string;
      subject: string;
      permissions: string;
      secret_hash: string;
      organization_id?: string | null;
    };
    const rows = db
      .prepare(
        hasOrgColumn
          ? "SELECT key_id, subject, permissions, secret_hash, organization_id FROM api_keys"
          : "SELECT key_id, subject, permissions, secret_hash FROM api_keys",
      )
      .all() as ApiKeyRow[];
    for (const row of rows) {
      store.set(row.key_id, {
        keyId: row.key_id,
        subject: row.subject,
        permissions: JSON.parse(row.permissions) as readonly Permission[],
        ...(row.organization_id !== undefined && row.organization_id !== null
          ? { organizationId: row.organization_id }
          : {}),
        secretHash: row.secret_hash,
      });
    }
    if (rows.length > 0) {
      console.error(`[app] Loaded ${rows.length} provisioned API key(s) from SQLite`);
    }
  } finally {
    db.close();
  }
}
