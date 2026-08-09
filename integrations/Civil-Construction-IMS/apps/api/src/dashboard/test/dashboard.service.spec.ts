import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

const ORG_ID = 'org-uuid-1';

// Fixture: 15 count values matching the $transaction query order in DashboardService.getKpi()
// Order: caOpen, caInProgress, caClosed, workflowPending, workflowInProgress,
//        auditScheduled, auditInProgress, documentTotal, documentUnderReview, documentDraft,
//        ncOpen, ncCritical, aspectSignificant, legalNonCompliant, projectActive
const MOCK_COUNTS = [3, 2, 5, 4, 1, 6, 2, 100, 10, 8, 7, 1, 4, 2, 12];

const mockPrisma = {
  correctiveAction: { count: jest.fn() },
  workflowRequest: { count: jest.fn() },
  auditPlan: { count: jest.fn() },
  document: { count: jest.fn() },
  nonconformity: { count: jest.fn() },
  environmentalAspect: { count: jest.fn() },
  legalRequirement: { count: jest.fn() },
  project: { count: jest.fn() },
  $transaction: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getKpi', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockResolvedValue(MOCK_COUNTS);
    });

    it('KPI オブジェクトのすべてのセクションが定義されている', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.corrective_actions).toBeDefined();
      expect(result.workflows).toBeDefined();
      expect(result.audits).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.quality).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.projects).toBeDefined();
    });

    it('是正処置の KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.corrective_actions.open).toBe(3);
      expect(result.corrective_actions.in_progress).toBe(2);
      expect(result.corrective_actions.closed_this_month).toBe(5);
    });

    it('ワークフローの KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.workflows.pending_approval).toBe(4);
      expect(result.workflows.in_progress).toBe(1);
    });

    it('監査の KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.audits.scheduled).toBe(6);
      expect(result.audits.in_progress).toBe(2);
    });

    it('文書の KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.documents.total).toBe(100);
      expect(result.documents.under_review).toBe(10);
      expect(result.documents.draft).toBe(8);
    });

    it('品質（不適合）の KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.quality.open_nonconformities).toBe(7);
      expect(result.quality.critical_nonconformities).toBe(1);
    });

    it('環境の KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.environment.significant_aspects).toBe(4);
      expect(result.environment.legal_non_compliant).toBe(2);
    });

    it('プロジェクトの KPI が正しくマッピングされる', async () => {
      const result = await service.getKpi(ORG_ID);

      expect(result.projects.active).toBe(12);
    });

    it('$transaction が 1 回だけ呼ばれる', async () => {
      await service.getKpi(ORG_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('すべての件数が 0 の場合でも正しい構造を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue(Array(15).fill(0));

      const result = await service.getKpi(ORG_ID);

      expect(result.corrective_actions.open).toBe(0);
      expect(result.documents.total).toBe(0);
      expect(result.projects.active).toBe(0);
    });
  });
});
