/**
 * File-backed repository implementations.
 *
 * All data is stored as JSON arrays, one file per entity type, under a single
 * `dataDir`. This gives durable persistence across process restarts without
 * requiring an external database server — suitable for single-node deployments
 * and edge environments.
 *
 * Writes are POSIX-atomic (write → rename) so a crash during a write leaves
 * the previous data intact. For multi-process or multi-instance deployments,
 * replace these adapters with a proper database (PostgreSQL, SQLite WAL, etc.).
 */

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
import { BaseFileRepository, ensureDataDir } from "./base-file-repository.ts";
import {
  FilePhotoRepository,
  FileSafetyCheckRepository,
  FileQualityInspectionRepository,
  FileCostRecordRepository,
  FileWorkHourRepository,
  FileNotificationDeliveryRepository,
  FileKnowledgeRepository,
  FileContractRepository,
  FileDocumentRepository,
  FileWorkScheduleRepository,
  FilePurchaseOrderRepository,
  FileNotificationPreferenceRepository,
} from "./business-repositories.ts";

// ---------------------------------------------------------------------------
// Concrete file repositories
// ---------------------------------------------------------------------------

class FileUserRepository extends BaseFileRepository<User> implements UserRepository {
  override async findById(id: UserId): Promise<User | null> {
    return super.findById(id as string);
  }
  override async delete(id: UserId): Promise<void> {
    return super.delete(id as string);
  }
  async findByEmail(email: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find((u) => u.email === email) ?? null;
  }
  async findByOrganization(orgId: OrganizationId): Promise<readonly User[]> {
    const all = await this.findAll();
    return all.filter((u) => (u.organizationId as string) === (orgId as string));
  }
}

class FileOrganizationRepository
  extends BaseFileRepository<Organization>
  implements OrganizationRepository
{
  override async findById(id: OrganizationId): Promise<Organization | null> {
    return super.findById(id as string);
  }
  override async delete(id: OrganizationId): Promise<void> {
    return super.delete(id as string);
  }
  async findHeadquarters(): Promise<readonly Organization[]> {
    const all = await this.findAll();
    return all.filter((o) => o.type === "headquarters");
  }
  async findByParent(parentId: OrganizationId): Promise<readonly Organization[]> {
    const all = await this.findAll();
    return all.filter(
      (o) => o.parentId !== undefined && (o.parentId as string) === (parentId as string),
    );
  }
}

class FileRoleRepository extends BaseFileRepository<Role> implements RoleRepository {
  override async findById(id: RoleId): Promise<Role | null> {
    return super.findById(id as string);
  }
  override async delete(id: RoleId): Promise<void> {
    return super.delete(id as string);
  }
  async findByName(name: string): Promise<Role | null> {
    const all = await this.findAll();
    return all.find((r) => r.name === name) ?? null;
  }
}

class FileDeviceRepository extends BaseFileRepository<Device> implements DeviceRepository {
  override async findById(id: DeviceId): Promise<Device | null> {
    return super.findById(id as string);
  }
  override async delete(id: DeviceId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: OrganizationId): Promise<readonly Device[]> {
    const all = await this.findAll();
    return all.filter((d) => (d.organizationId as string) === (orgId as string));
  }
}

class FileApplicationRepository
  extends BaseFileRepository<Application>
  implements ApplicationRepository
{
  override async findById(id: ApplicationId): Promise<Application | null> {
    return super.findById(id as string);
  }
  override async delete(id: ApplicationId): Promise<void> {
    return super.delete(id as string);
  }
  async findByKey(key: string): Promise<Application | null> {
    const all = await this.findAll();
    return all.find((a) => a.key === key) ?? null;
  }
  async findByOwner(orgId: OrganizationId): Promise<readonly Application[]> {
    const all = await this.findAll();
    return all.filter((a) => (a.ownerOrganizationId as string) === (orgId as string));
  }
}

class FilePolicyRepository extends BaseFileRepository<Policy> implements PolicyRepository {
  override async findById(id: PolicyId): Promise<Policy | null> {
    return super.findById(id as string);
  }
  override async delete(id: PolicyId): Promise<void> {
    return super.delete(id as string);
  }
  async findByEffect(effect: "allow" | "deny"): Promise<readonly Policy[]> {
    const all = await this.findAll();
    return all.filter((p) => p.effect === effect);
  }
}

class FileWorkflowRepository extends BaseFileRepository<Workflow> implements WorkflowRepository {
  override async findById(id: WorkflowId): Promise<Workflow | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkflowId): Promise<void> {
    return super.delete(id as string);
  }
  async findByType(type: WorkflowType): Promise<readonly Workflow[]> {
    const all = await this.findAll();
    return all.filter((w) => w.type === type);
  }
  async findByStatus(status: WorkflowStatus): Promise<readonly Workflow[]> {
    const all = await this.findAll();
    return all.filter((w) => w.status === status);
  }
}

class FileWorkflowInstanceRepository
  extends BaseFileRepository<WorkflowInstance>
  implements WorkflowInstanceRepository
{
  override async findById(id: WorkflowInstanceId): Promise<WorkflowInstance | null> {
    return super.findById(id as string);
  }
  override async delete(id: WorkflowInstanceId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly WorkflowInstance[]> {
    const all = await this.findAll();
    return all.filter((w) => (w.organizationId as string) === (orgId as string));
  }
  async findByStatus(status: WorkflowInstanceStatus): Promise<readonly WorkflowInstance[]> {
    const all = await this.findAll();
    return all.filter((w) => w.status === status);
  }
}

class FileAiActionRepository extends BaseFileRepository<AiAction> implements AiActionRepository {
  override async findById(id: AiActionId): Promise<AiAction | null> {
    return super.findById(id as string);
  }
  override async delete(id: AiActionId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly AiAction[]> {
    const all = await this.findAll();
    return all.filter((a) => (a.organizationId ?? "") === orgId);
  }
  async findByStatus(status: AiActionStatus): Promise<readonly AiAction[]> {
    const all = await this.findAll();
    return all.filter((a) => a.status === status);
  }
}

class FileProjectRepository extends BaseFileRepository<Project> implements ProjectRepository {
  override async findById(id: ProjectId): Promise<Project | null> {
    return super.findById(id as string);
  }
  override async delete(id: ProjectId): Promise<void> {
    return super.delete(id as string);
  }
  async findByOrganization(orgId: string): Promise<readonly Project[]> {
    const all = await this.findAll();
    return all.filter((p) => (p.organizationId ?? "") === orgId);
  }
  async findByStatus(status: ProjectStatus): Promise<readonly Project[]> {
    const all = await this.findAll();
    return all.filter((p) => p.status === status);
  }
  async findByCode(code: string): Promise<Project | null> {
    const all = await this.findAll();
    return all.find((p) => p.projectCode === code) ?? null;
  }
}

class FileDailyReportRepository
  extends BaseFileRepository<DailyReport>
  implements DailyReportRepository
{
  override async findById(id: DailyReportId): Promise<DailyReport | null> {
    return super.findById(id as string);
  }
  override async delete(id: DailyReportId): Promise<void> {
    return super.delete(id as string);
  }
  async findByProject(projectId: ProjectId): Promise<readonly DailyReport[]> {
    const all = await this.findAll();
    return all.filter((r) => (r.projectId as string) === (projectId as string));
  }
  async findByStatus(status: DailyReportStatus): Promise<readonly DailyReport[]> {
    const all = await this.findAll();
    return all.filter((r) => r.status === status);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Construct a fully-wired set of file-backed repositories rooted at `dataDir`.
 * Creates the directory (and any parent directories) if it does not exist.
 */
export async function createFileRepositories(dataDir: string): Promise<Repositories> {
  await ensureDataDir(dataDir);
  return {
    users: new FileUserRepository(dataDir, "users.json"),
    organizations: new FileOrganizationRepository(dataDir, "organizations.json"),
    roles: new FileRoleRepository(dataDir, "roles.json"),
    devices: new FileDeviceRepository(dataDir, "devices.json"),
    applications: new FileApplicationRepository(dataDir, "applications.json"),
    policies: new FilePolicyRepository(dataDir, "policies.json"),
    workflows: new FileWorkflowRepository(dataDir, "workflows.json"),
    workflowInstances: new FileWorkflowInstanceRepository(dataDir, "workflow-instances.json"),
    aiActions: new FileAiActionRepository(dataDir, "ai-actions.json"),
    projects: new FileProjectRepository(dataDir, "projects.json"),
    dailyReports: new FileDailyReportRepository(dataDir, "daily-reports.json"),
    photos: new FilePhotoRepository(dataDir, "photos.json"),
    safetyChecks: new FileSafetyCheckRepository(dataDir, "safety-checks.json"),
    qualityInspections: new FileQualityInspectionRepository(dataDir, "quality-inspections.json"),
    costRecords: new FileCostRecordRepository(dataDir, "cost-records.json"),
    workHours: new FileWorkHourRepository(dataDir, "work-hours.json"),
    notificationDeliveries: new FileNotificationDeliveryRepository(
      dataDir,
      "notification-deliveries.json",
    ),
    knowledgeArticles: new FileKnowledgeRepository(dataDir, "knowledge-articles.json"),
    contracts: new FileContractRepository(dataDir, "contracts.json"),
    documents: new FileDocumentRepository(dataDir, "documents.json"),
    workSchedules: new FileWorkScheduleRepository(dataDir, "work-schedules.json"),
    purchaseOrders: new FilePurchaseOrderRepository(dataDir, "purchase-orders.json"),
    notificationPreferences: new FileNotificationPreferenceRepository(
      dataDir,
      "notification-preferences.json",
    ),
  };
}
