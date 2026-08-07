/**
 * Notification preference domain (Enterprise-OS E-11 / ServiceHub S-09).
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type NotificationPreferenceId = Brand<string, "NotificationPreferenceId">;
export const notificationPreferenceId = (value: string): NotificationPreferenceId =>
  value as NotificationPreferenceId;

export interface NotificationPreference {
  readonly id: NotificationPreferenceId;
  readonly organizationId?: string | undefined;
  readonly userId: string;
  readonly emailEnabled: boolean;
  readonly slackEnabled: boolean;
  readonly slackWebhookUrl?: string | undefined;
  readonly events: Readonly<Record<string, boolean>>;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateNotificationPreferenceInput {
  readonly id: string;
  readonly organizationId?: string | undefined;
  readonly userId: string;
  readonly emailEnabled?: boolean | undefined;
  readonly slackEnabled?: boolean | undefined;
  readonly slackWebhookUrl?: string | undefined;
  readonly events?: Readonly<Record<string, boolean>> | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createNotificationPreference(
  input: CreateNotificationPreferenceInput,
): Result<NotificationPreference> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.userId, "userId")
    .require(
      input.slackWebhookUrl === undefined || input.slackWebhookUrl.startsWith("https://"),
      "slackWebhookUrl",
      "slackWebhookUrl must be an https URL when present",
    );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    id: notificationPreferenceId(input.id),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    userId: input.userId,
    emailEnabled: input.emailEnabled ?? true,
    slackEnabled: input.slackEnabled ?? false,
    ...(input.slackWebhookUrl !== undefined ? { slackWebhookUrl: input.slackWebhookUrl } : {}),
    events: { ...(input.events ?? {}) },
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

/** Merge an update into an existing preference. */
export function updateNotificationPreference(
  preference: NotificationPreference,
  input: {
    readonly emailEnabled?: boolean | undefined;
    readonly slackEnabled?: boolean | undefined;
    readonly slackWebhookUrl?: string | undefined;
    readonly events?: Readonly<Record<string, boolean>> | undefined;
    readonly updatedAt: IsoTimestamp;
  },
): Result<NotificationPreference> {
  const issues = new ValidationBuilder().require(
    input.slackWebhookUrl === undefined || input.slackWebhookUrl.startsWith("https://"),
    "slackWebhookUrl",
    "slackWebhookUrl must be an https URL when present",
  );
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  return ok({
    ...preference,
    ...(input.emailEnabled !== undefined ? { emailEnabled: input.emailEnabled } : {}),
    ...(input.slackEnabled !== undefined ? { slackEnabled: input.slackEnabled } : {}),
    ...(input.slackWebhookUrl !== undefined ? { slackWebhookUrl: input.slackWebhookUrl } : {}),
    ...(input.events !== undefined ? { events: { ...input.events } } : {}),
    updatedAt: input.updatedAt,
  });
}
