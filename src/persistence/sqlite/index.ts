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

import type { Application, ApplicationId } from "../../domain/application.ts";
import type { Device, DeviceId } from "../../domain/device.ts";
import type { Organization, OrganizationId } from "../../domain/organization.ts";
import type { Policy, PolicyId } from "../../domain/policy.ts";
import type { Role, RoleId } from "../../domain/role.ts";
import type { User, UserId } from "../../domain/user.ts";
import type {
  ApplicationRepository,
  DeviceRepository,
  OrganizationRepository,
  PolicyRepository,
  Repositories,
  RoleRepository,
  UserRepository,
} from "../ports.ts";
import { BaseSqliteRepository, openDatabase } from "./base-sqlite-repository.ts";

// ---------------------------------------------------------------------------
// Concrete repositories
// ---------------------------------------------------------------------------

class SqliteUserRepository
  extends BaseSqliteRepository<User>
  implements UserRepository
{
  constructor(db: unknown) {
    super(
      db,
      "users",
      ["email TEXT NOT NULL", "org_id TEXT NOT NULL"],
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
      ["type TEXT NOT NULL", "parent_id TEXT"],
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
    const stmt = (this.db as any).prepare(
      "SELECT data FROM organizations WHERE parent_id = ?",
    );
     
    const rows = stmt.all(parentId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Organization);
  }
}

class SqliteRoleRepository
  extends BaseSqliteRepository<Role>
  implements RoleRepository
{
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

class SqliteDeviceRepository
  extends BaseSqliteRepository<Device>
  implements DeviceRepository
{
  constructor(db: unknown) {
    super(
      db,
      "devices",
      ["org_id TEXT NOT NULL"],
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
      ["app_key TEXT NOT NULL", "owner_org_id TEXT NOT NULL"],
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
    const stmt = (this.db as any).prepare(
      "SELECT data FROM applications WHERE owner_org_id = ?",
    );
     
    const rows = stmt.all(orgId as string) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Application);
  }
}

class SqlitePolicyRepository
  extends BaseSqliteRepository<Policy>
  implements PolicyRepository
{
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

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Open (or create) a SQLite database at `dbPath` and return a fully-wired
 * `Repositories` aggregate. The database is shared across all six repositories
 * so they participate in the same WAL journal.
 */
export function createSqliteRepositories(dbPath: string): Repositories {
  const db = openDatabase(dbPath);
  return {
    users: new SqliteUserRepository(db),
    organizations: new SqliteOrganizationRepository(db),
    roles: new SqliteRoleRepository(db),
    devices: new SqliteDeviceRepository(db),
    applications: new SqliteApplicationRepository(db),
    policies: new SqlitePolicyRepository(db),
  };
}
