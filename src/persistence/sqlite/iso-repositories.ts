/**
 * SQLite-backed ISO record + integration event repositories.
 */

import type { IsoRecord, IsoRecordId, IsoKind } from "../../domain/iso.ts";
import type {
  IntegrationEvent,
  IntegrationEventId,
  IntegrationEventStatus,
  IntegrationSystem,
} from "../../domain/integration.ts";
import type { IntegrationEventRepository, IsoRecordRepository } from "../ports.ts";
import { BaseSqliteRepository } from "./base-sqlite-repository.ts";

export class SqliteIsoRecordRepository
  extends BaseSqliteRepository<IsoRecord>
  implements IsoRecordRepository
{
  constructor(db: unknown) {
    super(
      db,
      "iso_records",
      [
        "org_id TEXT NOT NULL",
        "kind TEXT NOT NULL",
        "project_id TEXT",
        "status TEXT NOT NULL",
        "parent_id TEXT",
      ],
      [
        { name: "idx_iso_org", columns: ["org_id"] },
        { name: "idx_iso_kind", columns: ["kind"] },
        { name: "idx_iso_project", columns: ["project_id"] },
        { name: "idx_iso_status", columns: ["status"] },
        { name: "idx_iso_parent", columns: ["parent_id"] },
      ],
      ["org_id", "kind", "project_id", "status", "parent_id"],
    );
  }

  protected override extraValues(record: IsoRecord): readonly unknown[] {
    return [
      record.organizationId,
      record.kind,
      record.projectId !== undefined ? record.projectId : null,
      record.status,
      record.parentId !== undefined ? record.parentId : null,
    ];
  }

  override async findById(id: IsoRecordId): Promise<IsoRecord | null> {
    return super.findById(id as string);
  }

  override async delete(id: IsoRecordId): Promise<void> {
    return super.delete(id as string);
  }

  async findByOrganization(orgId: string): Promise<readonly IsoRecord[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM iso_records WHERE org_id = ?");
    const rows = stmt.all(orgId) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IsoRecord);
  }

  async findByKind(kind: IsoKind): Promise<readonly IsoRecord[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM iso_records WHERE kind = ?");
    const rows = stmt.all(kind) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IsoRecord);
  }

  async findByProject(projectId: string): Promise<readonly IsoRecord[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM iso_records WHERE project_id = ?");
    const rows = stmt.all(projectId) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IsoRecord);
  }

  async findByStatus(status: string): Promise<readonly IsoRecord[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM iso_records WHERE status = ?");
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IsoRecord);
  }

  async findByParent(parentId: string): Promise<readonly IsoRecord[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM iso_records WHERE parent_id = ?");
    const rows = stmt.all(parentId) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IsoRecord);
  }
}

export class SqliteIntegrationEventRepository
  extends BaseSqliteRepository<IntegrationEvent>
  implements IntegrationEventRepository
{
  constructor(db: unknown) {
    super(
      db,
      "integration_events",
      [
        "system TEXT NOT NULL",
        "event_type TEXT NOT NULL",
        "direction TEXT NOT NULL",
        "idempotency_key TEXT NOT NULL",
        "status TEXT NOT NULL",
      ],
      [
        { name: "idx_integration_system", columns: ["system"] },
        { name: "idx_integration_status", columns: ["status"] },
        { name: "idx_integration_direction", columns: ["direction"] },
        { name: "idx_integration_idem", columns: ["system", "idempotency_key"], unique: true },
      ],
      ["system", "event_type", "direction", "idempotency_key", "status"],
    );
  }

  protected override extraValues(event: IntegrationEvent): readonly unknown[] {
    return [event.system, event.eventType, event.direction, event.idempotencyKey, event.status];
  }

  override async findById(id: IntegrationEventId): Promise<IntegrationEvent | null> {
    return super.findById(id as string);
  }

  override async delete(id: IntegrationEventId): Promise<void> {
    return super.delete(id as string);
  }

  async findBySystem(system: IntegrationSystem): Promise<readonly IntegrationEvent[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM integration_events WHERE system = ?");
    const rows = stmt.all(system) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IntegrationEvent);
  }

  async findByStatus(status: IntegrationEventStatus): Promise<readonly IntegrationEvent[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM integration_events WHERE status = ?");
    const rows = stmt.all(status) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IntegrationEvent);
  }

  async findByDirection(direction: "inbound" | "outbound"): Promise<readonly IntegrationEvent[]> {
    const stmt = (
      this.db as { prepare(sql: string): { all(...args: unknown[]): unknown[] } }
    ).prepare("SELECT data FROM integration_events WHERE direction = ?");
    const rows = stmt.all(direction) as { data: string }[];
    return rows.map((row) => JSON.parse(row.data) as IntegrationEvent);
  }

  async findByIdempotencyKey(
    system: IntegrationSystem,
    key: string,
  ): Promise<IntegrationEvent | null> {
    const stmt = (
      this.db as { prepare(sql: string): { get(...args: unknown[]): unknown } }
    ).prepare("SELECT data FROM integration_events WHERE system = ? AND idempotency_key = ?");
    const row = stmt.get(system, key) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as IntegrationEvent) : null;
  }
}
