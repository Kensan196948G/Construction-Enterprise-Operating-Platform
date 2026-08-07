import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { type OrganizationId, organizationId } from "./organization.ts";
import { type UserId, userId } from "./user.ts";

export type DeviceId = Brand<string, "DeviceId">;
export const deviceId = (value: string): DeviceId => value as DeviceId;

/** Field-OS managed endpoints. */
export const DEVICE_KINDS = ["tablet", "phone", "kiosk", "sensor", "laptop"] as const;
export type DeviceKind = (typeof DEVICE_KINDS)[number];

export const DEVICE_STATUSES = ["provisioned", "active", "lost", "retired"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export interface Device {
  readonly id: DeviceId;
  readonly organizationId: OrganizationId;
  readonly kind: DeviceKind;
  readonly status: DeviceStatus;
  readonly assignedUserId?: UserId;
  readonly lastSeenAt?: IsoTimestamp;
  /** Agent-reported inventory/telemetry (D-03). Stored as string values only. */
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface CreateDeviceInput {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: DeviceKind;
  readonly status: DeviceStatus;
  readonly assignedUserId?: string;
  readonly lastSeenAt?: IsoTimestamp;
  readonly metadata?: Readonly<Record<string, string>>;
}

export function createDevice(input: CreateDeviceInput): Result<Device> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .oneOf(input.kind, DEVICE_KINDS, "kind")
    .oneOf(input.status, DEVICE_STATUSES, "status")
    .require(
      input.assignedUserId === undefined || input.assignedUserId.trim().length > 0,
      "assignedUserId",
      "assignedUserId must be a non-empty string when present",
    )
    .require(
      input.status !== "retired" || input.assignedUserId === undefined,
      "assignedUserId",
      "retired devices must not stay assigned to a user",
    )
    .build();

  if (issues.length > 0) {
    return err(issues);
  }

  const device: Device = {
    id: deviceId(input.id),
    organizationId: organizationId(input.organizationId),
    kind: input.kind,
    status: input.status,
    ...(input.assignedUserId !== undefined ? { assignedUserId: userId(input.assignedUserId) } : {}),
    ...(input.lastSeenAt !== undefined ? { lastSeenAt: input.lastSeenAt } : {}),
    ...(input.metadata !== undefined ? { metadata: { ...input.metadata } } : {}),
  };
  return ok(device);
}

/** Record a heartbeat: update `lastSeenAt` and (optionally) `status`. */
export function touchDevice(
  device: Device,
  at: IsoTimestamp,
  status?: DeviceStatus,
): Result<Device> {
  const issues = new ValidationBuilder()
    .require(
      status === undefined || DEVICE_STATUSES.includes(status),
      "status",
      `status must be one of: ${DEVICE_STATUSES.join(", ")}`,
    )
    .build();
  if (issues.length > 0) {
    return err(issues);
  }
  return ok({
    ...device,
    ...(status !== undefined ? { status } : {}),
    lastSeenAt: at,
  });
}

/** Merge agent-reported inventory into the device metadata (D-03). */
export function withDeviceMetadata(
  device: Device,
  metadata: Readonly<Record<string, string>>,
): Device {
  return {
    ...device,
    metadata: { ...(device.metadata ?? {}), ...metadata },
  };
}
