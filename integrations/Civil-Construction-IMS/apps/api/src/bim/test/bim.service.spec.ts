import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { BimService } from '../bim.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CdeStatus, DocumentStatus, SuitabilityCode } from '@prisma/client';

const ORG_ID = 'org-uuid-1';
const ACTOR_ID = 'user-uuid-1';

const mockEir = {
  id: 'eir-uuid-1',
  organizationId: ORG_ID,
  projectId: 'project-uuid-1',
  title: 'テスト EIR',
  version: 1,
  status: DocumentStatus.DRAFT,
  requirements: null,
  loidLevel: null,
  deliveryMilestones: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: ACTOR_ID,
};

const mockContainer = {
  id: 'container-uuid-1',
  organizationId: ORG_ID,
  bepId: 'bep-uuid-1',
  containerCode: 'P001-ARC-S0-001',
  title: 'テスト情報コンテナ',
  discipline: 'architecture',
  suitabilityCode: SuitabilityCode.S0,
  cdeStatus: CdeStatus.WORK_IN_PROGRESS,
  cdeExternalId: null,
  ifcVersion: null,
  filePath: null,
  fileSize: null,
  fileVersion: null,
  checksum: null,
  reviewStatus: null,
  handoverStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: ACTOR_ID,
};

const mockPrisma = {
  $transaction: jest.fn(),
  bimEir: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  bimBep: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  bimInformationContainer: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  bimCoordinationIssue: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
};

describe('BimService', () => {
  let service: BimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BimService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<BimService>(BimService);
    jest.clearAllMocks();
    mockPrisma.auditTrail.create.mockResolvedValue({});
  });

  describe('EIR', () => {
    it('createEir: EIR を作成して返す', async () => {
      mockPrisma.bimEir.create.mockResolvedValue(mockEir);

      const result = await service.createEir(
        { title: 'テスト EIR', projectId: 'project-uuid-1' },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.title).toBe('テスト EIR');
      expect(result.organizationId).toBe(ORG_ID);
    });

    it('findAllEirs: org スコープで一覧を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockEir], 1]);

      const result = await service.findAllEirs({}, ORG_ID);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('findEirById: 存在する EIR を返す', async () => {
      mockPrisma.bimEir.findFirst.mockResolvedValue(mockEir);

      const result = await service.findEirById('eir-uuid-1', ORG_ID);

      expect(result.id).toBe('eir-uuid-1');
      expect(mockPrisma.bimEir.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: ORG_ID }) }),
      );
    });

    it('findEirById: 他org の EIR は NotFoundException', async () => {
      mockPrisma.bimEir.findFirst.mockResolvedValue(null);

      await expect(service.findEirById('foreign-eir', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Information Container', () => {
    it('createContainer: コンテナを作成する', async () => {
      mockPrisma.bimInformationContainer.findFirst.mockResolvedValue(null);
      mockPrisma.bimInformationContainer.create.mockResolvedValue(mockContainer);

      const result = await service.createContainer(
        { containerCode: 'P001-ARC-S0-001', title: 'テスト', bepId: 'bep-uuid-1' },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.containerCode).toBe('P001-ARC-S0-001');
      expect(result.suitabilityCode).toBe(SuitabilityCode.S0);
    });

    it('createContainer: 重複コードで ConflictException (org スコープ)', async () => {
      mockPrisma.bimInformationContainer.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createContainer(
          { containerCode: 'P001-ARC-S0-001', title: 'test' },
          ACTOR_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('updateCdeStatus: WIP → Shared への遷移を許可する', async () => {
      const sharedContainer = { ...mockContainer, cdeStatus: CdeStatus.SHARED };
      mockPrisma.bimInformationContainer.findFirst.mockResolvedValue(mockContainer);
      mockPrisma.bimInformationContainer.update.mockResolvedValue(sharedContainer);

      const result = await service.updateCdeStatus(
        'container-uuid-1',
        { cdeStatus: CdeStatus.SHARED },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.cdeStatus).toBe(CdeStatus.SHARED);
    });

    it('updateCdeStatus: WIP → Published への直接遷移を拒否する', async () => {
      mockPrisma.bimInformationContainer.findFirst.mockResolvedValue(mockContainer);

      await expect(
        service.updateCdeStatus(
          'container-uuid-1',
          { cdeStatus: CdeStatus.PUBLISHED },
          ACTOR_ID,
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deleteContainer: PUBLISHED コンテナの削除を拒否する', async () => {
      mockPrisma.bimInformationContainer.findFirst.mockResolvedValue({
        ...mockContainer,
        cdeStatus: CdeStatus.PUBLISHED,
      });

      await expect(service.deleteContainer('container-uuid-1', ACTOR_ID, ORG_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('CoordinationIssue', () => {
    it('createCoordinationIssue: 課題を作成する', async () => {
      const mockIssue = {
        id: 'issue-uuid-1',
        organizationId: ORG_ID,
        issueNo: 'CI-001',
        title: '梁と配管の干渉',
        issueType: 'clash',
        status: 'OPEN',
        createdBy: ACTOR_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.bimCoordinationIssue.findFirst.mockResolvedValue(null);
      mockPrisma.bimCoordinationIssue.create.mockResolvedValue(mockIssue);

      const result = await service.createCoordinationIssue(
        { issueNo: 'CI-001', title: '梁と配管の干渉', issueType: 'clash' },
        ACTOR_ID,
        ORG_ID,
      );

      expect(result.issueNo).toBe('CI-001');
    });
  });
});
