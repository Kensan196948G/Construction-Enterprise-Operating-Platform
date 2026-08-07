/**
 * Repository port interfaces for the persistence layer.
 *
 * Each interface defines the contract that an adapter must fulfil.
 * Mutation semantics (create / update / patch) live in domain services;
 * repositories are responsible for storage and retrieval only.
 */

import type { Application, ApplicationId } from "../domain/application.ts";
import type { Device, DeviceId } from "../domain/device.ts";
import type { Organization, OrganizationId } from "../domain/organization.ts";
import type { Policy, PolicyId } from "../domain/policy.ts";
import type { Role, RoleId } from "../domain/role.ts";
import type { User, UserId } from "../domain/user.ts";
import type { Workflow, WorkflowId, WorkflowType, WorkflowStatus } from "../domain/workflow.ts";
import type {
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowInstanceStatus,
} from "../domain/workflow-instance.ts";
import type { AiAction, AiActionId, AiActionStatus } from "../domain/ai-action.ts";

import type { Project, ProjectId, ProjectStatus } from "../domain/project.ts";

import type { Photo, PhotoId } from "../domain/photo.ts";
import type { KnowledgeArticle, KnowledgeId } from "../domain/knowledge.ts";
import type { Contract, ContractId } from "../domain/contract.ts";

import type {
  SafetyCheck,
  SafetyCheckId,
  QualityInspection,
  QualityInspectionId,
} from "../domain/safety.ts";
import type { CostRecord, CostRecordId, WorkHour, WorkHourId } from "../domain/cost.ts";
import type {
  NotificationDelivery,
  NotificationDeliveryId,
  NotificationStatus,
} from "../domain/notification.ts";

import type { DailyReport, DailyReportId, DailyReportStatus } from "../domain/daily-report.ts";

// ---------------------------------------------------------------------------
// Generic repository contract
// ---------------------------------------------------------------------------

/**
 * Minimal CRUD contract shared by all domain repositories.
 * `save` performs an upsert: insert if absent, replace if present.
 */
export interface Repository<T, Id> {
  findById(id: Id): Promise<T | null>;
  findAll(): Promise<readonly T[]>;
  save(entity: T): Promise<void>;
  delete(id: Id): Promise<void>;
}

// ---------------------------------------------------------------------------
// Domain-specific ports
// ---------------------------------------------------------------------------

export interface UserRepository extends Repository<User, UserId> {
  /** Exact match on the `email` field (case-sensitive). */
  findByEmail(email: string): Promise<User | null>;
  /** All users whose `organizationId` equals `orgId`. */
  findByOrganization(orgId: OrganizationId): Promise<readonly User[]>;
}

export interface OrganizationRepository extends Repository<Organization, OrganizationId> {
  /** All organizations whose `type` equals `"headquarters"`. */
  findHeadquarters(): Promise<readonly Organization[]>;
  /** All organizations that are direct children of `parentId`. */
  findByParent(parentId: OrganizationId): Promise<readonly Organization[]>;
}

export interface RoleRepository extends Repository<Role, RoleId> {
  /** Look up a role by its human-readable name (case-sensitive). */
  findByName(name: string): Promise<Role | null>;
}

export interface DeviceRepository extends Repository<Device, DeviceId> {
  /** All devices registered under the given organization. */
  findByOrganization(orgId: OrganizationId): Promise<readonly Device[]>;
}

export interface ApplicationRepository extends Repository<Application, ApplicationId> {
  /** Look up an application by its stable machine key (e.g. `"cmdb"`). */
  findByKey(key: string): Promise<Application | null>;
  /** All applications owned by the given organization. */
  findByOwner(orgId: OrganizationId): Promise<readonly Application[]>;
}

export interface PolicyRepository extends Repository<Policy, PolicyId> {
  /** All policies whose `effect` equals the given value. */
  findByEffect(effect: "allow" | "deny"): Promise<readonly Policy[]>;
}

export interface WorkflowRepository extends Repository<Workflow, WorkflowId> {
  /** All workflows whose `type` equals the given value. */
  findByType(type: WorkflowType): Promise<readonly Workflow[]>;
  /** All workflows whose `status` equals the given value. */
  findByStatus(status: WorkflowStatus): Promise<readonly Workflow[]>;
}

export interface WorkflowInstanceRepository extends Repository<
  WorkflowInstance,
  WorkflowInstanceId
> {
  /** All instances belonging to one organization. */
  findByOrganization(orgId: OrganizationId): Promise<readonly WorkflowInstance[]>;
  /** All instances in a given state. */
  findByStatus(status: WorkflowInstanceStatus): Promise<readonly WorkflowInstance[]>;
}

export interface AiActionRepository extends Repository<AiAction, AiActionId> {
  /** All AI actions belonging to one organization. */
  findByOrganization(orgId: string): Promise<readonly AiAction[]>;
  /** All AI actions in a given state. */
  findByStatus(status: AiActionStatus): Promise<readonly AiAction[]>;
}

export interface PhotoRepository extends Repository<Photo, PhotoId> {
  findByProject(projectId: ProjectId): Promise<readonly Photo[]>;
}
export interface SafetyCheckRepository extends Repository<SafetyCheck, SafetyCheckId> {
  findByProject(projectId: ProjectId): Promise<readonly SafetyCheck[]>;
}
export interface QualityInspectionRepository extends Repository<
  QualityInspection,
  QualityInspectionId
> {
  findByProject(projectId: ProjectId): Promise<readonly QualityInspection[]>;
}
export interface CostRecordRepository extends Repository<CostRecord, CostRecordId> {
  findByProject(projectId: ProjectId): Promise<readonly CostRecord[]>;
}
export interface WorkHourRepository extends Repository<WorkHour, WorkHourId> {
  findByProject(projectId: ProjectId): Promise<readonly WorkHour[]>;
}
export interface NotificationDeliveryRepository extends Repository<
  NotificationDelivery,
  NotificationDeliveryId
> {
  findByStatus(status: NotificationStatus): Promise<readonly NotificationDelivery[]>;
}

export interface KnowledgeRepository extends Repository<KnowledgeArticle, KnowledgeId> {
  findByOrganization(orgId: string): Promise<readonly KnowledgeArticle[]>;
  findByCategory(category: string): Promise<readonly KnowledgeArticle[]>;
}
export interface ContractRepository extends Repository<Contract, ContractId> {
  findByProject(projectId: ProjectId): Promise<readonly Contract[]>;
  findByNumber(contractNumber: string): Promise<Contract | null>;
}

export interface ProjectRepository extends Repository<Project, ProjectId> {
  /** All projects belonging to one organization. */
  findByOrganization(orgId: string): Promise<readonly Project[]>;
  /** All projects in a given status. */
  findByStatus(status: ProjectStatus): Promise<readonly Project[]>;
  /** Find by unique project code. */
  findByCode(code: string): Promise<Project | null>;
}

export interface DailyReportRepository extends Repository<DailyReport, DailyReportId> {
  /** All reports for a project (within one organization). */
  findByProject(projectId: ProjectId): Promise<readonly DailyReport[]>;
  /** All reports in a given status. */
  findByStatus(status: DailyReportStatus): Promise<readonly DailyReport[]>;
}

// ---------------------------------------------------------------------------
// Aggregate: all repositories grouped for DI / factory use
// ---------------------------------------------------------------------------

export interface Repositories {
  readonly users: UserRepository;
  readonly organizations: OrganizationRepository;
  readonly roles: RoleRepository;
  readonly devices: DeviceRepository;
  readonly applications: ApplicationRepository;
  readonly policies: PolicyRepository;
  readonly workflows: WorkflowRepository;
  readonly workflowInstances: WorkflowInstanceRepository;
  readonly aiActions: AiActionRepository;
  readonly projects: ProjectRepository;
  readonly dailyReports: DailyReportRepository;
  readonly photos: PhotoRepository;
  readonly safetyChecks: SafetyCheckRepository;
  readonly qualityInspections: QualityInspectionRepository;
  readonly costRecords: CostRecordRepository;
  readonly workHours: WorkHourRepository;
  readonly notificationDeliveries: NotificationDeliveryRepository;
  readonly knowledgeArticles: KnowledgeRepository;
  readonly contracts: ContractRepository;
}
