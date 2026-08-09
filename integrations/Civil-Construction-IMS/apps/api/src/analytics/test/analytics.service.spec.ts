import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

const ORG_ID = 'org-uuid-1';

const mockPrisma = {
  $transaction: jest.fn(),
  correctiveAction: { count: jest.fn() },
  workflowRequest: { count: jest.fn() },
  nearMiss: { count: jest.fn() },
  asset: { count: jest.fn() },
  assetMaintenancePlan: { count: jest.fn() },
  document: { count: jest.fn() },
  auditPlan: { count: jest.fn() },
  ismsIncident: { count: jest.fn() },
  bcpPlan: { count: jest.fn() },
  nonconformity: { count: jest.fn() },
  legalRequirement: { count: jest.fn() },
  safetyIncident: { count: jest.fn() },
  safetyEducation: { count: jest.fn() },
  bimInformationContainer: { count: jest.fn() },
  project: { count: jest.fn() },
  environmentalAspect: { count: jest.fn() },
  hazardIdentification: { count: jest.fn() },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // getDashboard — 2 test cases
  // ----------------------------------------------------------------

  describe('getDashboard', () => {
    it('全モジュール KPI を集約して返す', async () => {
      // 14 values: caOpen, pendingWf, nearMissOpen, activeAssets, criticalAssets,
      // docsUnderReview, auditPlanned, ismsOpen, bcpActive, projectsActive,
      // openNCs, openIncidents, significantAspects, legalNonCompliant
      mockPrisma.$transaction.mockResolvedValue([5, 3, 2, 10, 1, 4, 6, 0, 2, 7, 3, 1, 8, 2]);

      const result = await service.getDashboard(ORG_ID);

      expect(result.corrective_actions.open).toBe(5);
      expect(result.workflows.pending).toBe(3);
      expect(result.assets.active).toBe(10);
      expect(result.isms.open_incidents).toBe(0);
      expect(result.bcp.active_plans).toBe(2);
      expect(result.projects.active).toBe(7);
    });

    it('organizationId が安全スコープに使用される', async () => {
      mockPrisma.$transaction.mockResolvedValue(Array(14).fill(0));

      const result = await service.getDashboard(ORG_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.safety.open_near_misses).toBe(0);
      expect(result.quality.open_nonconformities).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // getIsoComplianceStatus — 2 test cases
  // ----------------------------------------------------------------

  describe('getIsoComplianceStatus', () => {
    it('各 ISO 規格の適合スコアを計算して返す', async () => {
      // 10 values: openNCs, totalNCs, nonCompliantLegal, totalLegal,
      // openIncidents, totalIncidents, poorAssets, totalActive, wipContainers, totalContainers
      mockPrisma.$transaction.mockResolvedValue([2, 10, 1, 20, 3, 30, 2, 50, 5, 20]);

      const result = await service.getIsoComplianceStatus(ORG_ID);

      expect(result.iso9001.open_nonconformities).toBe(2);
      expect(result.iso9001.score).toBe(80); // (10-2)/10 = 80%
      expect(result.iso14001.non_compliant_legal).toBe(1);
      expect(result.iso14001.score).toBe(95); // (20-1)/20 = 95%
      expect(result.iso55001.poor_condition_assets).toBe(2);
      expect(result.iso19650.wip_containers).toBe(5);
    });

    it('データがない場合は全規格 100 点を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue(Array(10).fill(0));

      const result = await service.getIsoComplianceStatus(ORG_ID);

      expect(result.iso9001.score).toBe(100);
      expect(result.iso14001.score).toBe(100);
      expect(result.iso55001.score).toBe(100);
      expect(result.iso19650.score).toBe(100);
    });
  });
});
