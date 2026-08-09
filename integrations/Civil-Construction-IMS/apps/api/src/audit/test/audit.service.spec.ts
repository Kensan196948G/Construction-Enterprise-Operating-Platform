import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit.service';
import { AuditTrailService } from '../audit-trail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FindingType, FindingStatus, Severity, AuditStatus } from '@prisma/client';

const mockAuditPlan = {
  id: 'plan-uuid-1',
  planNo: 'AP-2026-001',
  title: '2026年度 ISO 9001 内部監査',
  isoStandard: '9001',
  projectId: null,
  status: AuditStatus.PLANNED,
  scheduledAt: new Date('2026-07-01'),
  auditorId: null,
  auditeeId: null,
  scope: null,
  completedAt: null,
  deletedAt: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-uuid-1',
};

const mockAuditFinding = {
  id: 'finding-uuid-1',
  auditPlanId: 'plan-uuid-1',
  findingType: FindingType.NONCONFORMITY,
  clauseRef: '9001:8.5.2',
  description: '手順書が最新版でない',
  evidence: null,
  severity: Severity.MEDIUM,
  status: FindingStatus.OPEN,
  caId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-uuid-1',
};

const mockAuditTrail = {
  id: 'trail-uuid-1',
  entityType: 'AuditPlan',
  entityId: 'plan-uuid-1',
  action: 'CREATE',
  actorId: 'user-uuid-1',
  actor: { id: 'user-uuid-1', displayName: 'Test User', email: 'test@example.com' },
  before: null,
  after: {},
  reason: null,
  occurredAt: new Date(),
};

const mockPrisma = {
  $transaction: jest.fn(),
  auditTrail: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({}),
  },
  auditPlan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  auditFinding: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockTrailService = {
  record: jest.fn().mockResolvedValue({}),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditTrailService, useValue: mockTrailService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('findTrails', () => {
    it('監査証跡一覧を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockAuditTrail], 1]);

      const result = await service.findTrails({});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('entityType でフィルタリングできる', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findTrails({ entityType: 'AuditPlan' });

      expect(result.total).toBe(0);
    });
  });

  describe('findOneTrail', () => {
    it('存在する監査証跡を返す', async () => {
      mockPrisma.auditTrail.findUnique.mockResolvedValue(mockAuditTrail);

      const result = await service.findOneTrail('trail-uuid-1');

      expect(result.id).toBe('trail-uuid-1');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.auditTrail.findUnique.mockResolvedValue(null);

      await expect(service.findOneTrail('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPlans', () => {
    it('監査計画一覧を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockAuditPlan], 1]);

      const result = await service.findPlans({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].planNo).toBe('AP-2026-001');
      expect(result.total).toBe(1);
    });

    it('isoStandard でフィルタリングできる', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findPlans({ isoStandard: '9001', page: 1, limit: 20 });

      expect(result.items).toHaveLength(0);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOnePlan', () => {
    it('存在する監査計画を返す', async () => {
      mockPrisma.auditPlan.findUnique.mockResolvedValue({
        ...mockAuditPlan,
        findings: [],
        project: null,
      });

      const result = await service.findOnePlan('plan-uuid-1');

      expect(result.planNo).toBe('AP-2026-001');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.auditPlan.findUnique.mockResolvedValue(null);

      await expect(service.findOnePlan('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPlan', () => {
    it('監査計画を作成し監査証跡を記録する', async () => {
      mockPrisma.auditPlan.findUnique.mockResolvedValue(null);
      mockPrisma.auditPlan.create.mockResolvedValue(mockAuditPlan);

      const dto = {
        planNo: 'AP-2026-001',
        title: '2026年度 ISO 9001 内部監査',
        isoStandard: '9001',
        scheduledAt: '2026-07-01T00:00:00Z',
      };
      const mockReq = { headers: {}, ip: '127.0.0.1' } as any;

      const result = await service.createPlan(dto as any, 'user-uuid-1', mockReq);

      expect(result.planNo).toBe('AP-2026-001');
      expect(mockTrailService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'AuditPlan' }),
      );
    });
  });

  describe('findFindings', () => {
    it('監査所見一覧を返す', async () => {
      // findFindings calls findOnePlan first to verify plan existence
      mockPrisma.auditPlan.findUnique.mockResolvedValue({
        ...mockAuditPlan,
        findings: [],
        project: null,
      });
      mockPrisma.auditFinding.findMany.mockResolvedValue([mockAuditFinding]);

      const result = await service.findFindings('plan-uuid-1');

      expect(result).toHaveLength(1);
      expect(result[0].findingType).toBe(FindingType.NONCONFORMITY);
    });
  });

  describe('findOneFinding', () => {
    it('存在する監査所見を返す', async () => {
      mockPrisma.auditFinding.findUnique.mockResolvedValue(mockAuditFinding);

      const result = await service.findOneFinding('finding-uuid-1');

      expect(result.id).toBe('finding-uuid-1');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.auditFinding.findUnique.mockResolvedValue(null);

      await expect(service.findOneFinding('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
