/**
 * Notification delivery domain (ServiceHub S-09).
 *
 * Records the intent to notify (pending) so a dispatcher can send later and
 * mark SENT/FAILED. Actual email/Slack/webhook delivery is out of scope.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type NotificationDeliveryId = Brand<string, "NotificationDeliveryId">;
export const notificationDeliveryId = (value: string): NotificationDeliveryId =>
  value as NotificationDeliveryId;

export const NOTIFICATION_CHANNELS = ["email", "slack", "webhook"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export const NOTIFICATION_STATUSES = ["pending", "sent", "failed", "retry"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface NotificationDelivery {
  readonly id: NotificationDeliveryId;
  readonly organizationId?: string | undefined;
  readonly userId: string;
  readonly eventKey: string;
  readonly channel: NotificationChannel;
  readonly status: NotificationStatus;
  readonly subject?: string | undefined;
  readonly bodyPreview?: string | undefined;
  readonly errorDetail?: string | undefined;
  readonly failureKind?: string | undefined;
  readonly attempts: number;
  readonly sentAt?: IsoTimestamp | undefined;
  /** When the recipient acknowledged/read the notification (E-11 unread count). */
  readonly readAt?: IsoTimestamp | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateNotificationDeliveryInput {
  readonly id: string;
  readonly organizationId?: string | undefined;
  readonly userId: string;
  readonly eventKey: string;
  readonly channel: NotificationChannel;
  readonly subject?: string | undefined;
  readonly bodyPreview?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createNotificationDelivery(
  input: CreateNotificationDeliveryInput,
): Result<NotificationDelivery> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.userId, "userId")
    .nonEmpty(input.eventKey, "eventKey")
    .oneOf(input.channel, NOTIFICATION_CHANNELS, "channel")
    .require(
      input.organizationId === undefined || input.organizationId.trim().length > 0,
      "organizationId",
      "organizationId must be a non-empty string when present",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: notificationDeliveryId(input.id),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    userId: input.userId,
    eventKey: input.eventKey,
    channel: input.channel,
    status: "pending",
    ...(input.subject !== undefined ? { subject: input.subject } : {}),
    ...(input.bodyPreview !== undefined ? { bodyPreview: input.bodyPreview } : {}),
    attempts: 0,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
