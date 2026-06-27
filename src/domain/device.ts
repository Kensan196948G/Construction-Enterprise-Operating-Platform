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
}

export interface CreateDeviceInput {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: DeviceKind;
  readonly status: DeviceStatus;
  readonly assignedUserId?: string;
  readonly lastSeenAt?: IsoTimestamp;
}

export function createDevice(input: CreateDeviceInput): Result<Device> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .oneOf(input.kind, DEVICE_KINDS, "kind")
    .oneOf(input.status, DEVICE_STATUSES, "status")
    .require(
      input.assignedUserId === undefined || input.assignedUserId.length > 0,
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
  };
  return ok(device);
}
