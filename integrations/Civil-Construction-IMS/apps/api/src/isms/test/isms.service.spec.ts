import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CorrectiveActionStatus, RiskLevel, Severity } from '@prisma/client';
import { IsmsService } from '../isms.service';
import { PrismaService } from '../../prisma/prisma.service';

// ----------------------------------------------------------------
// Mock fixtures
// ----------------------------------------------------------------

const ORG_ID = 'org-uuid-1';
const USER_ID = 'user-uuid-1';
const ASSET_ID = 'asset-uuid-1';
const THREAT_ID = 'threat-uuid-1';
const ASSESSMENT_ID = 'assessment-uuid-1';
const INCIDENT_ID = 'incident-uuid-1';

const mockAsset = {
  id: ASSET_ID,
  organizationId: ORG_ID,
  assetNo: 'ASSET-001',
  name: '顧客情報データベース',
  assetType: 'information',
  classification: 'confidential',
  owner: USER_ID,
  location: 'データセンターA',
  sensitivity: Severity.HIGH,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: USER_ID,
  threats: [],
  riskAssessments: [],
};

const mockThreat = {
  id: THREAT_ID,
  assetId: ASSET_ID,
  threatType: 'unauthorized-access',
  description: '不正アクセスによるデータ漏洩',
  likelihood: 3,
  impact: 4,
  riskScore: 12,
  existingControls: 'アクセスログ監視',
  status: CorrectiveActionStatus.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: USER_ID,
};

const mockIncident = {
  id: INCIDENT_ID,
  organizationId: ORG_ID,
  incidentNo: 'INC-2026-001',
  incidentType: 'data-breach',
  occurredAt: new Date('2026-05-01'),
  detectedAt: null,
  description: '顧客データへの不正アクセスを検知',
  affectedSystems: null,
  severity: Severity.HIGH,
  status: CorrectiveActionStatus.OPEN,
  rootCause: null,
  correctiveAction: null,
  reportedBy: USER_ID,
  closedAt: null,
  closedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ----------------------------------------------------------------
// Mock Prisma
// ----------------------------------------------------------------

const mockPrisma = {
  ismsAsset: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  ismsThreat: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  ismsRiskAssessment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
  },
  ismsIncident: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
};

// ----------------------------------------------------------------
// Test suite
// ----------------------------------------------------------------

describe('IsmsService', () => {
  let service: IsmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IsmsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<IsmsService>(IsmsService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // Test 1: createAsset — duplicate assetNo raises ConflictException
  // ---------------------------------------------------------------

  describe('createAsset', () => {
    it('重複する assetNo が存在する場合 ConflictException を投げる', async () => {
      mockPrisma.ismsAsset.findFirst.mockResolvedValueOnce(mockAsset);

      await expect(
        service.createAsset(
          {
            assetNo: 'ASSET-001',
            name: '顧客情報DB',
            assetType: 'information',
            classification: 'confidential',
          },
          USER_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.ismsAsset.findFirst).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, assetNo: 'ASSET-001' },
      });
    });

    it('重複がない場合は資産を作成し監査証跡を記録する', async () => {
      mockPrisma.ismsAsset.findFirst.mockResolvedValueOnce(null); // no duplicate
      mockPrisma.ismsAsset.create.mockResolvedValueOnce(mockAsset);

      const result = await service.createAsset(
        {
          assetNo: 'ASSET-002',
          name: '顧客情報DB',
          assetType: 'information',
          classification: 'confidential',
        },
        USER_ID,
        ORG_ID,
      );

      expect(result.id).toBe(ASSET_ID);
      expect(mockPrisma.ismsAsset.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // Test 2: createThreat — riskScore auto-computed as likelihood × impact
  // ---------------------------------------------------------------

  describe('createThreat', () => {
    it('riskScore を likelihood × impact で自動計算する', async () => {
      // findAssetById uses findFirst
      mockPrisma.ismsAsset.findFirst.mockResolvedValueOnce(mockAsset);
      mockPrisma.ismsThreat.create.mockResolvedValueOnce(mockThreat);

      const result = await service.createThreat(
        ASSET_ID,
        {
          threatType: 'unauthorized-access',
          description: '不正アクセス',
          likelihood: 3,
          impact: 4,
        },
        USER_ID,
        ORG_ID,
      );

      // Verify riskScore passed to create = 3 × 4 = 12
      expect(mockPrisma.ismsThreat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ riskScore: 12 }),
        }),
      );
      expect(result.riskScore).toBe(12);
    });

    it('資産が組織に属さない場合 NotFoundException を投げる', async () => {
      mockPrisma.ismsAsset.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createThreat(
          'wrong-asset-id',
          {
            threatType: 'malware',
            description: 'マルウェア感染',
            likelihood: 2,
            impact: 5,
          },
          USER_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------
  // Test 3: findAllAssets — results scoped to organizationId
  // ---------------------------------------------------------------

  describe('findAllAssets', () => {
    it('organizationId でスコープされた資産一覧を返す', async () => {
      mockPrisma.ismsAsset.findMany.mockResolvedValueOnce([mockAsset]);
      mockPrisma.ismsAsset.count.mockResolvedValueOnce(1);

      const result = await service.findAllAssets({}, ORG_ID);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.ismsAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
    });

    it('assetType フィルタが where 条件に含まれる', async () => {
      mockPrisma.ismsAsset.findMany.mockResolvedValueOnce([mockAsset]);
      mockPrisma.ismsAsset.count.mockResolvedValueOnce(1);

      await service.findAllAssets({ assetType: 'information' }, ORG_ID);

      expect(mockPrisma.ismsAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            assetType: 'information',
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------
  // Test 4: createIncident — registers incident and audit trail
  // ---------------------------------------------------------------

  describe('createIncident', () => {
    it('インシデントを作成し監査証跡を記録する', async () => {
      mockPrisma.ismsIncident.findFirst.mockResolvedValueOnce(null); // no duplicate
      mockPrisma.ismsIncident.create.mockResolvedValueOnce(mockIncident);

      const result = await service.createIncident(
        {
          incidentNo: 'INC-2026-001',
          incidentType: 'data-breach',
          occurredAt: new Date('2026-05-01'),
          description: '顧客データへの不正アクセスを検知',
          severity: Severity.HIGH,
        },
        USER_ID,
        ORG_ID,
      );

      expect(result.incidentNo).toBe('INC-2026-001');
      expect(mockPrisma.ismsIncident.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });

    it('重複する incidentNo が存在する場合 ConflictException を投げる', async () => {
      mockPrisma.ismsIncident.findFirst.mockResolvedValueOnce(mockIncident);

      await expect(
        service.createIncident(
          {
            incidentNo: 'INC-2026-001',
            incidentType: 'data-breach',
            occurredAt: new Date(),
            description: '重複テスト',
          },
          USER_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------
  // Test 5: closeIncident — sets CLOSED status, closedAt, closedBy
  // ---------------------------------------------------------------

  describe('closeIncident', () => {
    it('インシデントを CLOSED 状態にし closedAt・closedBy を設定する', async () => {
      const closedIncident = {
        ...mockIncident,
        status: CorrectiveActionStatus.CLOSED,
        closedAt: new Date(),
        closedBy: USER_ID,
      };

      // First findFirst (ownership check)
      mockPrisma.ismsIncident.findFirst
        .mockResolvedValueOnce(mockIncident) // ownership check
        .mockResolvedValueOnce(closedIncident); // re-fetch after update

      mockPrisma.ismsIncident.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.closeIncident(INCIDENT_ID, USER_ID, ORG_ID);

      expect(result?.status).toBe(CorrectiveActionStatus.CLOSED);
      expect(result?.closedBy).toBe(USER_ID);
      expect(mockPrisma.ismsIncident.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INCIDENT_ID, organizationId: ORG_ID },
          data: expect.objectContaining({
            status: CorrectiveActionStatus.CLOSED,
            closedBy: USER_ID,
          }),
        }),
      );
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });

    it('存在しないインシデント ID で NotFoundException を投げる', async () => {
      mockPrisma.ismsIncident.findFirst.mockResolvedValueOnce(null);

      await expect(service.closeIncident('non-existent-id', USER_ID, ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------
  // Test 6: closeThreat — sets status CLOSED
  // ---------------------------------------------------------------

  describe('closeThreat', () => {
    it('脅威を CLOSED 状態にする', async () => {
      const closedThreat = { ...mockThreat, status: CorrectiveActionStatus.CLOSED };

      mockPrisma.ismsAsset.findFirst.mockResolvedValueOnce(mockAsset);
      mockPrisma.ismsThreat.findFirst.mockResolvedValueOnce(mockThreat);
      mockPrisma.ismsThreat.update.mockResolvedValueOnce(closedThreat);

      const result = await service.closeThreat(THREAT_ID, ASSET_ID, USER_ID, ORG_ID);

      expect(result.status).toBe(CorrectiveActionStatus.CLOSED);
      expect(mockPrisma.ismsThreat.update).toHaveBeenCalledWith({
        where: { id: THREAT_ID },
        data: { status: CorrectiveActionStatus.CLOSED },
      });
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // Test 7: createRiskAssessment — duplicate assessmentNo raises ConflictException
  // ---------------------------------------------------------------

  describe('createRiskAssessment', () => {
    it('重複する assessmentNo が存在する場合 ConflictException を投げる', async () => {
      const mockAssessment = {
        id: ASSESSMENT_ID,
        organizationId: ORG_ID,
        assessmentNo: 'RA-2026-001',
        overallRiskLevel: RiskLevel.HIGH,
        assessedAt: new Date(),
        assessedBy: USER_ID,
        createdBy: USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.ismsRiskAssessment.findFirst.mockResolvedValueOnce(mockAssessment);

      await expect(
        service.createRiskAssessment(
          {
            assessmentNo: 'RA-2026-001',
            assessedAt: new Date(),
            overallRiskLevel: RiskLevel.HIGH,
          },
          USER_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
