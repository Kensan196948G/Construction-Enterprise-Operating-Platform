import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ToolboxTalkService } from '../toolbox-talk.service';
import { PrismaService } from '../../prisma/prisma.service';

const ORG_ID = 'org-uuid-1';
const ACTOR_ID = 'user-uuid-1';

const mockTalk = {
  id: 'talk-uuid-1',
  organizationId: ORG_ID,
  talkNo: 'KY-2026-001',
  projectId: 'project-uuid-1',
  conductedAt: new Date('2026-06-01T09:00:00Z'),
  location: '1号棟',
  topic: '転落・落下防止',
  content: '足場作業における危険予知活動',
  leaderName: '山田太郎',
  participantCount: 0,
  participants: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: ACTOR_ID,
};

const mockParticipant = {
  id: 'participant-uuid-1',
  talkId: 'talk-uuid-1',
  userId: 'user-uuid-2',
  signedAt: new Date('2026-06-01T09:05:00Z'),
};

const mockPrisma = {
  toolboxTalk: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  toolboxTalkParticipant: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn(),
};

describe('ToolboxTalkService', () => {
  let service: ToolboxTalkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToolboxTalkService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ToolboxTalkService>(ToolboxTalkService);
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // Test 1: findAll — organizationId スコープで一覧を返す
  // ----------------------------------------------------------------
  describe('findAll', () => {
    it('organizationId スコープで KY活動一覧を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockTalk], 1]);

      const result = await service.findAll({ page: 1, limit: 20 }, ORG_ID);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].talkNo).toBe('KY-2026-001');
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // Test 2: findOne — 存在する場合・存在しない場合
  // ----------------------------------------------------------------
  describe('findOne', () => {
    it('存在する KY活動を返す', async () => {
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk);

      const result = await service.findOne('talk-uuid-1', ORG_ID);

      expect(result.id).toBe('talk-uuid-1');
      expect(result.organizationId).toBe(ORG_ID);
      expect(mockPrisma.toolboxTalk.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'talk-uuid-1', organizationId: ORG_ID }),
        }),
      );
    });

    it('存在しない ID で NotFoundException をスローする', async () => {
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ----------------------------------------------------------------
  // Test 3: create — 重複 talkNo チェックと監査証跡
  // ----------------------------------------------------------------
  describe('create', () => {
    it('KY活動を作成し監査証跡を記録する', async () => {
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(null); // no duplicate
      mockPrisma.toolboxTalk.create.mockResolvedValue(mockTalk);

      const dto = {
        talkNo: 'KY-2026-001',
        projectId: 'project-uuid-1',
        conductedAt: '2026-06-01T09:00:00Z',
        topic: '転落・落下防止',
        location: '1号棟',
        leaderName: '山田太郎',
      };

      const result = await service.create(dto, ACTOR_ID, ORG_ID);

      expect(result.talkNo).toBe('KY-2026-001');
      expect(mockPrisma.toolboxTalk.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            createdBy: ACTOR_ID,
          }),
        }),
      );
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CREATE', entityType: 'ToolboxTalk' }),
        }),
      );
    });

    it('重複 talkNo で ConflictException をスローする', async () => {
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk); // duplicate found

      const dto = {
        talkNo: 'KY-2026-001',
        conductedAt: '2026-06-01T09:00:00Z',
        topic: '転落・落下防止',
      };

      await expect(service.create(dto, ACTOR_ID, ORG_ID)).rejects.toThrow(ConflictException);
      expect(mockPrisma.toolboxTalk.create).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // Test 4: addParticipant — 参加者追加と participantCount インクリメント
  // ----------------------------------------------------------------
  describe('addParticipant', () => {
    it('参加者を追加し participantCount をインクリメントする', async () => {
      // findOne for ownership check
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk);
      // $transaction callback resolves participant
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
        const fakeTx = {
          toolboxTalkParticipant: {
            upsert: jest.fn().mockResolvedValue(mockParticipant),
          },
          toolboxTalk: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return fn(fakeTx);
      });

      const dto = { userId: 'user-uuid-2', signedAt: '2026-06-01T09:05:00Z' };
      const result = await service.addParticipant('talk-uuid-1', dto, ACTOR_ID, ORG_ID);

      expect(result.userId).toBe('user-uuid-2');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entityType: 'ToolboxTalkParticipant',
          }),
        }),
      );
    });
  });

  // ----------------------------------------------------------------
  // Test 5: removeParticipant — 参加者削除と NotFoundException
  // ----------------------------------------------------------------
  describe('removeParticipant', () => {
    it('存在しない参加者で NotFoundException をスローする', async () => {
      // findOne for ownership check
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk);
      // participant not found
      mockPrisma.toolboxTalkParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.removeParticipant('talk-uuid-1', 'non-existent-user', ACTOR_ID, ORG_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('参加者を削除し participantCount をデクリメントする', async () => {
      // findOne for ownership check
      mockPrisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk);
      mockPrisma.toolboxTalkParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.$transaction.mockResolvedValue([mockParticipant, { count: 1 }]);

      await expect(
        service.removeParticipant('talk-uuid-1', 'user-uuid-2', ACTOR_ID, ORG_ID),
      ).resolves.toBeUndefined();

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DELETE',
            entityType: 'ToolboxTalkParticipant',
          }),
        }),
      );
    });
  });
});
