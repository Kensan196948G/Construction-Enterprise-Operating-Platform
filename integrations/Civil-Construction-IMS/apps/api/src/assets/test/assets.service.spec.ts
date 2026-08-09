import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AssetsService } from '../assets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetStatus, AssetCondition } from '@prisma/client';

const ORG_ID = 'org-uuid-1';
const ACTOR_ID = 'user-uuid-1';
const ASSET_ID = 'asset-uuid-1';

const mockAsset = {
  id: ASSET_ID,
  organizationId: ORG_ID,
  assetNo: 'ASSET-001',
  name: 'クローラクレーン',
  assetType: 'equipment',
  category: '重機',
  location: '第1工区',
  installDate: new Date('2020-01-01'),
  manufacturer: 'コベルコ',
  model: 'CK1000G-2',
  serialNo: 'CK001',
  status: AssetStatus.ACTIVE,
  currentCondition: AssetCondition.GOOD,
  criticality: 'MEDIUM',
  replacementYear: 2035,
  acquisitionCost: null,
  lcCost: null,
  bimLinkId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: ACTOR_ID,
  versionNo: 1,
};

const mockPrisma = {
  $transaction: jest.fn(),
  asset: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  assetMaintenancePlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  assetInspection: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  assetRiskAssessment: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  assetDisposal: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  assetHandover: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
};

describe('AssetsService', () => {
  let service: AssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    jest.clearAllMocks();
    mockPrisma.auditTrail.create.mockResolvedValue({});
  });

  describe('findAll', () => {
    it('org スコープで資産一覧を返す', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset]);

      const result = await service.findAll({}, ORG_ID);

      expect(result).toHaveLength(1);
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
    });

    it('criticality フィルタで重要度別取得', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset]);

      await service.findAll({ criticality: 'MEDIUM' }, ORG_ID);

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ criticality: 'MEDIUM' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('存在する資産を返す', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(mockAsset);

      const result = await service.findById(ASSET_ID, ORG_ID);

      expect(result.assetNo).toBe('ASSET-001');
      expect(mockPrisma.asset.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: ASSET_ID, organizationId: ORG_ID }),
        }),
      );
    });

    it('他組織の資産は NotFoundException', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(null);

      await expect(service.findById(ASSET_ID, 'other-org')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRiskAssessment', () => {
    it('リスクスコアを計算して登録する (4×4=16 → HIGH)', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(mockAsset);
      const mockAssessment = {
        id: 'ra-uuid-1',
        assetId: ASSET_ID,
        riskScore: 16,
        riskLevel: 'HIGH',
      };
      mockPrisma.assetRiskAssessment.create.mockResolvedValue(mockAssessment);
      mockPrisma.asset.update.mockResolvedValue({ ...mockAsset, criticality: 'HIGH' });

      const result = await service.createRiskAssessment(
        ASSET_ID,
        { failureProbability: 4, consequenceSeverity: 4, assessedAt: new Date().toISOString() },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.riskScore).toBe(16);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('リスクスコア 20 以上は CRITICAL', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(mockAsset);
      const mockAssessment = {
        id: 'ra-uuid-2',
        assetId: ASSET_ID,
        riskScore: 25,
        riskLevel: 'CRITICAL',
      };
      mockPrisma.assetRiskAssessment.create.mockResolvedValue(mockAssessment);
      mockPrisma.asset.update.mockResolvedValue({ ...mockAsset, criticality: 'CRITICAL' });

      const result = await service.createRiskAssessment(
        ASSET_ID,
        { failureProbability: 5, consequenceSeverity: 5, assessedAt: new Date().toISOString() },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.riskLevel).toBe('CRITICAL');
      // 資産の criticality が更新されていることを確認
      expect(mockPrisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ criticality: 'CRITICAL' }),
        }),
      );
    });

    it('リスクスコア 5 以下は LOW', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(mockAsset);
      const mockAssessment = { id: 'ra-uuid-3', assetId: ASSET_ID, riskScore: 1, riskLevel: 'LOW' };
      mockPrisma.assetRiskAssessment.create.mockResolvedValue(mockAssessment);
      mockPrisma.asset.update.mockResolvedValue({ ...mockAsset, criticality: 'LOW' });

      const result = await service.createRiskAssessment(
        ASSET_ID,
        { failureProbability: 1, consequenceSeverity: 1, assessedAt: new Date().toISOString() },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.riskLevel).toBe('LOW');
    });
  });

  describe('createDisposal', () => {
    it('廃棄を登録する（承認前は DISPOSED にならない）', async () => {
      const mockDisposal = {
        id: 'disposal-uuid-1',
        assetId: ASSET_ID,
        disposalNo: 'DISP-001',
        disposalType: 'SCRAPPED',
        disposalDate: new Date(),
        reason: '耐用年数超過',
        approvedBy: null,
        approvedAt: null,
      };
      mockPrisma.asset.findFirst.mockResolvedValue(mockAsset);
      mockPrisma.assetDisposal.create.mockResolvedValue(mockDisposal);

      const result = await service.createDisposal(
        ASSET_ID,
        {
          disposalNo: 'DISP-001',
          disposalType: 'SCRAPPED',
          disposalDate: new Date().toISOString(),
          reason: '耐用年数超過',
        },
        ACTOR_ID,
        ORG_ID,
      );

      // asset.status は createDisposal では変更しない (approveDisposal で変更)
      expect(mockPrisma.asset.update).not.toHaveBeenCalled();
      expect(result.approvedBy).toBeNull();
    });
  });

  describe('getOrgAssetSummary', () => {
    it('組織の KPI サマリーを返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([10, 8, 2, 1, 3, 1]);

      const result = await service.getOrgAssetSummary(ORG_ID);

      expect(result.totalAssets).toBe(10);
      expect(result.activeAssets).toBe(8);
      expect(result.criticalAssets).toBe(2);
      expect(result.maintenanceDue).toBe(3);
    });
  });
});
