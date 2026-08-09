import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Notification, NotificationChannel, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationListResponseDto } from './dto/notification-list-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  channel?: NotificationChannel;
}

export interface FindAllOptions {
  unreadOnly: boolean;
  page: number;
  limit: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Internal: create a notification record (called by other services)
  // ------------------------------------------------------------------

  async create(input: CreateNotificationInput): Promise<Notification> {
    this.logger.log(`Creating notification for user=${input.userId} type=${input.type}`);

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        channel: input.channel ?? NotificationChannel.IN_APP,
        isRead: false,
      },
    });

    return notification;
  }

  // ------------------------------------------------------------------
  // Internal: bulk-create notifications (e.g. broadcast to multiple users)
  // ------------------------------------------------------------------

  async createMany(inputs: CreateNotificationInput[]): Promise<number> {
    if (inputs.length === 0) return 0;

    const data: Prisma.NotificationCreateManyInput[] = inputs.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      body: i.body,
      entityType: i.entityType,
      entityId: i.entityId,
      channel: i.channel ?? NotificationChannel.IN_APP,
      isRead: false,
    }));

    const result = await this.prisma.notification.createMany({ data });
    this.logger.log(`Bulk created ${result.count} notifications`);
    return result.count;
  }

  // ------------------------------------------------------------------
  // Query: list notifications for a user
  // ------------------------------------------------------------------

  async findAll(userId: string, options: FindAllOptions): Promise<NotificationListResponseDto> {
    const { unreadOnly, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((n) => this.toDto(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ------------------------------------------------------------------
  // Query: count unread notifications for a user
  // ------------------------------------------------------------------

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ------------------------------------------------------------------
  // Mutation: mark single notification as read
  // ------------------------------------------------------------------

  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    const notification = await this.findOneOwned(userId, notificationId);

    if (notification.isRead) {
      // Already read — return as-is without an unnecessary DB write
      return this.toDto(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.toDto(updated);
  }

  // ------------------------------------------------------------------
  // Mutation: mark all notifications of a user as read
  // ------------------------------------------------------------------

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    this.logger.log(`Marked all notifications as read for user=${userId}`);
  }

  // ------------------------------------------------------------------
  // Mutation: delete a single notification (must be owned by userId)
  // ------------------------------------------------------------------

  async remove(userId: string, notificationId: string): Promise<void> {
    await this.findOneOwned(userId, notificationId);

    await this.prisma.notification.delete({
      where: { id: notificationId, userId },
    });

    this.logger.log(`Deleted notification id=${notificationId} by user=${userId}`);
  }

  // ------------------------------------------------------------------
  // Mutation: delete all read notifications of a user
  // ------------------------------------------------------------------

  async removeAllRead(userId: string): Promise<void> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    this.logger.log(`Deleted ${result.count} read notifications for user=${userId}`);
  }

  // ------------------------------------------------------------------
  // Helper: fetch a notification and verify ownership
  // ------------------------------------------------------------------

  private async findOneOwned(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with id "${notificationId}" not found`);
    }

    if (notification.userId !== userId) {
      // Do not reveal existence of other users' notifications
      throw new ForbiddenException('You do not have permission to access this notification');
    }

    return notification;
  }

  // ------------------------------------------------------------------
  // Helper: map Prisma model to DTO
  // ------------------------------------------------------------------

  private toDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      entityType: notification.entityType ?? undefined,
      entityId: notification.entityId ?? undefined,
      isRead: notification.isRead,
      sentAt: notification.sentAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? undefined,
      channel: notification.channel,
    };
  }
}
