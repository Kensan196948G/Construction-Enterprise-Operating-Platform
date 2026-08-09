import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QualityService } from '../quality.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

const mockQualityPlan = {
  id: 'plan-uuid-1',
  planNo: 'QP-2026-001',
  projectId: 'project-uuid-1',
  title: 'テスト品質計画書',
  version: 1,
  status: DocumentStatus.DRAFT,
  approvedAt: null,
  approvedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-uuid-1',
};

const mockInspection = {
  id: 'inspection-uuid-1',
  qualityPlanId: 'plan-uuid-1',
  inspectionNo: 'INS-2026-001',
  inspectionType: '工程内検査',
  location: '現場A',
  scheduledAt: new Date(),
  conductedAt: null,
  inspectorId: null,
  result: null,
  remarks: null,
  filePath: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-uuid-1',
};

const mockPrisma = {
  qualityPlan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  qualityInspection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  nonconformity: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
};

describe('QualityService', () => {
  let service: QualityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QualityService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<QualityService>(QualityService);
    jest.clearAllMocks();
  });

  describe('listPlans', () => {
    it('品質計画一覧を返す', async () => {
      mockPrisma.qualityPlan.findMany.mockResolvedValue([mockQualityPlan]);

      const result = await service.listPlans({});

      expect(result).toHaveLength(1);
      expect(result[0].planNo).toBe('QP-2026-001');
    });

    it('projectId でフィルタリングできる', async () => {
      mockPrisma.qualityPlan.findMany.mockResolvedValue([mockQualityPlan]);

      await service.listPlans({ projectId: 'project-uuid-1' });

      expect(mockPrisma.qualityPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-uuid-1' }),
        }),
      );
    });
  });

  describe('getPlan', () => {
    it('存在する品質計画書を返す', async () => {
      mockPrisma.qualityPlan.findUnique.mockResolvedValue(mockQualityPlan);

      const result = await service.getPlan('plan-uuid-1');

      expect(result.id).toBe('plan-uuid-1');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.qualityPlan.findUnique.mockResolvedValue(null);

      await expect(service.getPlan('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPlan', () => {
    it('品質計画書を作成し監査証跡を記録する', async () => {
      mockPrisma.qualityPlan.findUnique.mockResolvedValue(null); // no duplicate
      mockPrisma.qualityPlan.create.mockResolvedValue(mockQualityPlan);

      const dto = { planNo: 'QP-2026-001', projectId: 'project-uuid-1', title: 'テスト' };
      const result = await service.createPlan(dto as any, 'user-uuid-1');

      expect(result.planNo).toBe('QP-2026-001');
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CREATE', entityType: 'QualityPlan' }),
        }),
      );
    });
  });

  describe('listInspections', () => {
    it('検査一覧を返す', async () => {
      mockPrisma.qualityInspection.findMany.mockResolvedValue([mockInspection]);

      const result = await service.listInspections({});

      expect(result).toHaveLength(1);
    });
  });
});
