import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CorrectiveActionsService } from '../corrective-actions.service';
import { AuditTrailService } from '../../audit/audit-trail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Severity, CorrectiveActionStatus } from '@prisma/client';

const ACTOR_ID = 'user-uuid-1';
const ORG_ID = 'org-uuid-1';
const PROJECT_ID = 'project-uuid-1';

const mockCA = {
  id: 'ca-uuid-1',
  caNo: 'CA-2026-001',
  sourceType: 'nonconformity',
  sourceId: null,
  projectId: PROJECT_ID,
  title: '手順書の最新版管理不備',
  description: '品質管理手順書の旧版が現場で使用されていた',
  isoStandard: '9001',
  severity: Severity.MEDIUM,
  status: CorrectiveActionStatus.OPEN,
  rootCause: null,
  correctiveAction: null,
  preventiveAction: null,
  dueDate: null,
  closedAt: null,
  closedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: ACTOR_ID,
  versionNo: 1,
};

const mockPrisma = {
  $transaction: jest.fn(),
  project: {
    findMany: jest.fn().mockResolvedValue([{ id: PROJECT_ID }]),
  },
  correctiveAction: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
};

const mockAuditTrailService = {
  record: jest.fn().mockResolvedValue({}),
};

describe('CorrectiveActionsService', () => {
  let service: CorrectiveActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrectiveActionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditTrailService, useValue: mockAuditTrailService },
      ],
    }).compile();

    service = module.get<CorrectiveActionsService>(CorrectiveActionsService);
    jest.clearAllMocks();
    // Default: org has one project
    mockPrisma.project.findMany.mockResolvedValue([{ id: PROJECT_ID }]);
  });

  describe('findAll', () => {
    it('是正処置一覧を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockCA], 1]);

      const result = await service.findAll({}, ORG_ID);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].caNo).toBe('CA-2026-001');
    });

    it('status でフィルタリングできる', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockCA], 1]);

      await service.findAll({ status: CorrectiveActionStatus.OPEN }, ORG_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('他組織のプロジェクト ID を指定しても無視される (IDOR 防止)', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      // Org only has PROJECT_ID; requesting a different projectId should be filtered
      const result = await service.findAll({ projectId: 'foreign-project-uuid' }, ORG_ID);

      expect(result.items).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('存在する是正処置を返す', async () => {
      mockPrisma.correctiveAction.findFirst.mockResolvedValue(mockCA);

      const result = await service.findOne('ca-uuid-1', ORG_ID);

      expect(result.caNo).toBe('CA-2026-001');
    });

    it('他組織の是正処置は NotFoundException (IDOR 防止)', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.correctiveAction.findFirst.mockResolvedValue(null);

      await expect(service.findOne('ca-uuid-1', 'other-org')).rejects.toThrow(NotFoundException);
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.correctiveAction.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('是正処置を作成し監査証跡を記録する', async () => {
      mockPrisma.correctiveAction.findUnique.mockResolvedValue(null);
      mockPrisma.correctiveAction.create.mockResolvedValue(mockCA);

      const dto = {
        caNo: 'CA-2026-001',
        sourceType: 'nonconformity',
        title: '手順書の最新版管理不備',
        description: '品質管理手順書の旧版が現場で使用されていた',
        isoStandard: '9001',
      };

      const result = await service.create(dto as any, ACTOR_ID);

      expect(result.caNo).toBe('CA-2026-001');
      expect(mockAuditTrailService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'CorrectiveAction' }),
      );
    });

    it('重複 caNo で ConflictException', async () => {
      mockPrisma.correctiveAction.findUnique.mockResolvedValue({ id: 'existing-uuid' });

      const dto = {
        caNo: 'CA-2026-001',
        sourceType: 'nonconformity',
        title: 'test',
        description: 'test',
      };

      await expect(service.create(dto as any, ACTOR_ID)).rejects.toThrow(ConflictException);
    });
  });

  describe('close', () => {
    it('是正処置をクローズし監査証跡を記録する', async () => {
      const closedCA = {
        ...mockCA,
        status: CorrectiveActionStatus.CLOSED,
        closedAt: new Date(),
        closedBy: ACTOR_ID,
      };
      mockPrisma.correctiveAction.findFirst.mockResolvedValue(mockCA);
      mockPrisma.correctiveAction.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.correctiveAction.findUniqueOrThrow.mockResolvedValue(closedCA);

      const result = await service.close('ca-uuid-1', ACTOR_ID, ORG_ID);

      expect(result.status).toBe(CorrectiveActionStatus.CLOSED);
      expect(mockAuditTrailService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLOSE', entityType: 'CorrectiveAction' }),
      );
    });
  });
});
