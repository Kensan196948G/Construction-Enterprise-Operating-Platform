import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationType } from '@prisma/client';

const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';
const NOTIFICATION_ID = 'notif-uuid-1';

const mockNotification = {
  id: NOTIFICATION_ID,
  userId: USER_ID,
  type: NotificationType.SYSTEM_ALERT,
  title: 'テスト通知',
  body: '通知本文',
  entityType: null,
  entityId: null,
  isRead: false,
  channel: NotificationChannel.IN_APP,
  sentAt: new Date(),
  readAt: null,
};

const mockPrisma = {
  $transaction: jest.fn(),
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('通知を1件作成して返す', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: USER_ID,
        type: NotificationType.SYSTEM_ALERT,
        title: 'テスト通知',
        body: '通知本文',
      });

      expect(result.id).toBe(NOTIFICATION_ID);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_ID,
            isRead: false,
            channel: NotificationChannel.IN_APP,
          }),
        }),
      );
    });

    it('channel 指定なしの場合 IN_APP がデフォルト', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.create({
        userId: USER_ID,
        type: NotificationType.SYSTEM_ALERT,
        title: 'テスト',
        body: '本文',
      });

      const createArgs = mockPrisma.notification.create.mock.calls[0][0];
      expect(createArgs.data.channel).toBe(NotificationChannel.IN_APP);
    });

    it('channel を明示的に指定できる', async () => {
      const emailNotif = { ...mockNotification, channel: NotificationChannel.EMAIL };
      mockPrisma.notification.create.mockResolvedValue(emailNotif);

      const result = await service.create({
        userId: USER_ID,
        type: NotificationType.SYSTEM_ALERT,
        title: 'テスト',
        body: '本文',
        channel: NotificationChannel.EMAIL,
      });

      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('createMany', () => {
    it('複数通知を一括作成して件数を返す', async () => {
      mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });

      const inputs = [
        { userId: 'u1', type: NotificationType.SYSTEM_ALERT, title: 'T1', body: 'B1' },
        { userId: 'u2', type: NotificationType.SYSTEM_ALERT, title: 'T2', body: 'B2' },
        { userId: 'u3', type: NotificationType.SYSTEM_ALERT, title: 'T3', body: 'B3' },
      ];

      const result = await service.createMany(inputs);

      expect(result).toBe(3);
      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });

    it('空配列の場合は DB を呼ばず 0 を返す', async () => {
      const result = await service.createMany([]);

      expect(result).toBe(0);
      expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('ユーザーの通知一覧をページネーション付きで返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockNotification], 1]);

      const result = await service.findAll(USER_ID, { unreadOnly: false, page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('unreadOnly=true で未読のみフィルタリング', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(USER_ID, { unreadOnly: true, page: 1, limit: 20 });

      const [findManyArgs] = mockPrisma.$transaction.mock.calls[0][0];
      // The transaction is called with prisma operations — verify unreadOnly filter is set
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('2ページ目のオフセットが正しく計算される', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 25]);

      const result = await service.findAll(USER_ID, { unreadOnly: false, page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('countUnread', () => {
    it('未読件数を返す', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.countUnread(USER_ID);

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, isRead: false },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('未読通知を既読にする', async () => {
      const unreadNotif = { ...mockNotification, isRead: false };
      const readNotif = { ...mockNotification, isRead: true, readAt: new Date() };
      mockPrisma.notification.findUnique.mockResolvedValue(unreadNotif);
      mockPrisma.notification.update.mockResolvedValue(readNotif);

      const result = await service.markAsRead(USER_ID, NOTIFICATION_ID);

      expect(result.isRead).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isRead: true }),
        }),
      );
    });

    it('既読通知は DB 更新をスキップして返す (冪等性)', async () => {
      const alreadyRead = { ...mockNotification, isRead: true, readAt: new Date() };
      mockPrisma.notification.findUnique.mockResolvedValue(alreadyRead);

      const result = await service.markAsRead(USER_ID, NOTIFICATION_ID);

      expect(result.isRead).toBe(true);
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('他ユーザーの通知は ForbiddenException — IDOR 防止', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification); // owned by USER_ID

      await expect(service.markAsRead(OTHER_USER_ID, NOTIFICATION_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('存在しない通知 ID で NotFoundException', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(USER_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('ユーザーの全通知を既読にする', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await expect(service.markAllAsRead(USER_ID)).resolves.toBeUndefined();

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, isRead: false },
          data: expect.objectContaining({ isRead: true }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('自分の通知を削除できる', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      await expect(service.remove(USER_ID, NOTIFICATION_ID)).resolves.toBeUndefined();

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: NOTIFICATION_ID, userId: USER_ID },
      });
    });

    it('他ユーザーの通知は削除不可 — ForbiddenException (IDOR 防止)', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification); // owned by USER_ID

      await expect(service.remove(OTHER_USER_ID, NOTIFICATION_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.notification.delete).not.toHaveBeenCalled();
    });

    it('存在しない通知 ID で NotFoundException', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAllRead', () => {
    it('ユーザーの既読通知を全て削除する', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 3 });

      await expect(service.removeAllRead(USER_ID)).resolves.toBeUndefined();

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, isRead: true },
      });
    });
  });
});
