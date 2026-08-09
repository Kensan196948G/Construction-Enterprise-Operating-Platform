import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { BcpService } from '../bcp.service';
import { PrismaService } from '../../prisma/prisma.service';

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------

const ORG_ID = 'org-uuid-1';
const ACTOR_ID = 'user-uuid-1';
const PLAN_ID = 'plan-uuid-1';
const SCENARIO_ID = 'scenario-uuid-1';
const DRILL_ID = 'drill-uuid-1';

const mockPlan = {
  id: PLAN_ID,
  organizationId: ORG_ID,
  planNo: 'BCP-2026-001',
  title: '地震対応 BCP',
  version: 1,
  status: DocumentStatus.DRAFT,
  scope: '全拠点',
  rto: 24,
  rpo: 4,
  approvedAt: null,
  approvedBy: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdBy: ACTOR_ID,
};

const mockScenario = {
  id: SCENARIO_ID,
  planId: PLAN_ID,
  scenarioType: 'earthquake',
  title: '大規模地震',
  description: null,
  probability: 3,
  impact: 5,
  riskScore: 15,
  responseActions: null,
  responsiblePerson: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdBy: ACTOR_ID,
};

const mockDrill = {
  id: DRILL_ID,
  planId: PLAN_ID,
  drillNo: 'DRILL-2026-001',
  drillType: 'tabletop',
  conductedAt: new Date('2026-03-01'),
  participantCount: 20,
  scenario: null,
  findings: null,
  improvements: null,
  evaluationScore: 80,
  nextDrillAt: null,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  createdBy: ACTOR_ID,
};

// ----------------------------------------------------------------
// Mock PrismaService
// ----------------------------------------------------------------

const mockPrisma = {
  bcpPlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  bcpRiskScenario: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  bcpDrillRecord: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn(),
};

// ----------------------------------------------------------------
// Test suite
// ----------------------------------------------------------------

describe('BcpService', () => {
  let service: BcpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcpService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<BcpService>(BcpService);
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // Test 1: createPlan — duplicate planNo per org throws ConflictException
  // ----------------------------------------------------------------

  describe('createPlan', () => {
    it('同一 org 内で planNo が重複する場合は ConflictException をスローする', async () => {
      mockPrisma.bcpPlan.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createPlan({ planNo: 'BCP-2026-001', title: '地震対応 BCP' }, ACTOR_ID, ORG_ID),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.bcpPlan.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_planNo: { organizationId: ORG_ID, planNo: 'BCP-2026-001' },
        },
        select: { id: true },
      });
    });

    it('planNo が一意の場合は BcpPlan を作成して返す', async () => {
      mockPrisma.bcpPlan.findUnique.mockResolvedValue(null);
      mockPrisma.bcpPlan.create.mockResolvedValue(mockPlan);

      const result = await service.createPlan(
        { planNo: 'BCP-2026-001', title: '地震対応 BCP', rto: 24, rpo: 4 },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.planNo).toBe('BCP-2026-001');
      expect(result.status).toBe(DocumentStatus.DRAFT);
      expect(mockPrisma.bcpPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            createdBy: ACTOR_ID,
            status: DocumentStatus.DRAFT,
          }),
        }),
      );
      // Audit trail must be recorded
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------
  // Test 2: createScenario — riskScore auto-computed server-side
  // ----------------------------------------------------------------

  describe('createScenario', () => {
    it('riskScore = probability × impact を自動算出する', async () => {
      mockPrisma.bcpPlan.findFirst.mockResolvedValue({ id: PLAN_ID });
      mockPrisma.bcpRiskScenario.create.mockResolvedValue({ ...mockScenario, riskScore: 15 });

      const result = await service.createScenario(
        PLAN_ID,
        {
          scenarioType: 'earthquake',
          title: '大規模地震',
          probability: 3,
          impact: 5,
        },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.riskScore).toBe(15); // 3 × 5

      expect(mockPrisma.bcpRiskScenario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ riskScore: 15 }),
        }),
      );
    });

    it('probability が範囲外 (0) の場合は BadRequestException をスローする', async () => {
      mockPrisma.bcpPlan.findFirst.mockResolvedValue({ id: PLAN_ID });

      await expect(
        service.createScenario(
          PLAN_ID,
          { scenarioType: 'fire', title: '火災', probability: 0, impact: 3 },
          ACTOR_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('impact が範囲外 (6) の場合は BadRequestException をスローする', async () => {
      mockPrisma.bcpPlan.findFirst.mockResolvedValue({ id: PLAN_ID });

      await expect(
        service.createScenario(
          PLAN_ID,
          { scenarioType: 'flood', title: '洪水', probability: 2, impact: 6 },
          ACTOR_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('所属しない planId の場合は NotFoundException をスローする', async () => {
      mockPrisma.bcpPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.createScenario(
          'nonexistent-plan',
          { scenarioType: 'earthquake', title: '地震', probability: 3, impact: 3 },
          ACTOR_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ----------------------------------------------------------------
  // Test 3: approvePlan — server-side approval (status + timestamps)
  // ----------------------------------------------------------------

  describe('approvePlan', () => {
    it('承認時に status=APPROVED、approvedAt と approvedBy をサーバー側で設定する', async () => {
      const approvedPlan = {
        ...mockPlan,
        status: DocumentStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: ACTOR_ID,
      };
      mockPrisma.bcpPlan.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.bcpPlan.findUnique.mockResolvedValue(approvedPlan);

      const result = await service.approvePlan(PLAN_ID, ACTOR_ID, ORG_ID);

      expect(result?.status).toBe(DocumentStatus.APPROVED);
      expect(result?.approvedBy).toBe(ACTOR_ID);
      expect(result?.approvedAt).toBeInstanceOf(Date);

      // updateMany called with org scope (IDOR防止)
      expect(mockPrisma.bcpPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PLAN_ID, organizationId: ORG_ID },
          data: expect.objectContaining({
            status: DocumentStatus.APPROVED,
            approvedBy: ACTOR_ID,
          }),
        }),
      );

      // Audit trail must be recorded
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });

    it('存在しない plan の承認は NotFoundException をスローする', async () => {
      mockPrisma.bcpPlan.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.approvePlan('nonexistent', ACTOR_ID, ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ----------------------------------------------------------------
  // Test 4: createDrillRecord — duplicate drillNo per plan
  // ----------------------------------------------------------------

  describe('createDrillRecord', () => {
    it('同一計画内で drillNo が重複する場合は ConflictException をスローする', async () => {
      mockPrisma.bcpPlan.findFirst.mockResolvedValue({ id: PLAN_ID });
      mockPrisma.bcpDrillRecord.findUnique.mockResolvedValue({ id: DRILL_ID });

      await expect(
        service.createDrillRecord(
          PLAN_ID,
          {
            drillNo: 'DRILL-2026-001',
            drillType: 'tabletop',
            conductedAt: new Date('2026-03-01'),
          },
          ACTOR_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('重複なしの場合は訓練記録を作成して返す', async () => {
      mockPrisma.bcpPlan.findFirst.mockResolvedValue({ id: PLAN_ID });
      mockPrisma.bcpDrillRecord.findUnique.mockResolvedValue(null);
      mockPrisma.bcpDrillRecord.create.mockResolvedValue(mockDrill);

      const result = await service.createDrillRecord(
        PLAN_ID,
        {
          drillNo: 'DRILL-2026-001',
          drillType: 'tabletop',
          conductedAt: new Date('2026-03-01'),
          participantCount: 20,
          evaluationScore: 80,
        },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.drillNo).toBe('DRILL-2026-001');
      expect(result.evaluationScore).toBe(80);
      expect(mockPrisma.auditTrail.create).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------
  // Test 5: getBcpSummary — aggregate counts + upcoming drills
  // ----------------------------------------------------------------

  describe('getBcpSummary', () => {
    it('計画数・シナリオ数・訓練数と直近訓練を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        3, // planCount
        12, // scenarioCount
        5, // drillCount
        [
          // upcomingDrills
          {
            ...mockDrill,
            nextDrillAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            plan: { id: PLAN_ID, planNo: 'BCP-2026-001', title: '地震対応 BCP' },
          },
        ],
      ]);

      const result = await service.getBcpSummary(ORG_ID);

      expect(result.planCount).toBe(3);
      expect(result.scenarioCount).toBe(12);
      expect(result.drillCount).toBe(5);
      expect(result.upcomingDrills).toHaveLength(1);
      expect(result.upcomingDrills[0].plan.planNo).toBe('BCP-2026-001');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
