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
} from "../ports.ts";
import { BaseFileRepository, ensureDataDir } from "./base-file-repository.ts";

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
  };
}
