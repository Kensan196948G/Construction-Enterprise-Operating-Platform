/**
 * Notification template domain (Enterprise-OS E-11).
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { NOTIFICATION_CHANNELS, type NotificationChannel } from "./notification.ts";

export type NotificationTemplateId = Brand<string, "NotificationTemplateId">;
export const notificationTemplateId = (value: string): NotificationTemplateId =>
  value as NotificationTemplateId;

export interface NotificationTemplate {
  readonly id: NotificationTemplateId;
  readonly organizationId?: string | undefined;
  readonly templateKey: string;
  readonly subject: string;
  readonly body: string;
  readonly channel: NotificationChannel;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateNotificationTemplateInput {
  readonly id: string;
  readonly organizationId?: string | undefined;
  readonly templateKey: string;
  readonly subject: string;
  readonly body: string;
  readonly channel?: NotificationChannel | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createNotificationTemplate(
  input: CreateNotificationTemplateInput,
): Result<NotificationTemplate> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.templateKey, "templateKey")
    .nonEmpty(input.subject, "subject")
    .nonEmpty(input.body, "body")
    .oneOf(input.channel ?? "email", NOTIFICATION_CHANNELS, "channel");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: notificationTemplateId(input.id),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    templateKey: input.templateKey,
    subject: input.subject,
    body: input.body,
    channel: input.channel ?? "email",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
