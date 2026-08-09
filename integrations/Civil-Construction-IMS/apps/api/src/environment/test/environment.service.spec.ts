import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EnvironmentService } from '../environment.service';
import { AuditTrailService } from '../../audit/audit-trail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Significance, ComplianceStatus } from '@prisma/client';

const ORG_ID = 'org-uuid-1';
const USER_ID = 'user-uuid-1';

const mockAspect = {
  id: 'aspect-uuid-1',
  projectId: 'project-uuid-1',
  aspectName: '建設廃材の発生',
  activity: null,
  environmentalImpact: '廃棄物増加',
  significance: Significance.MAJOR,
  controlMeasure: null,
  isLegallyRequired: false,
  reviewedAt: null,
  createdBy: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: { id: 'project-uuid-1', code: 'P001', name: 'テストプロジェクト' },
};

const mockLegalRequirement = {
  id: 'legal-uuid-1',
  organizationId: ORG_ID,
  lawName: '廃棄物の処理及び清掃に関する法律',
  lawNo: null,
  applicableScope: null,
  complianceNote: null,
  lastEvaluatedAt: null,
  complianceStatus: ComplianceStatus.COMPLIANT,
  createdBy: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWasteRecord = {
  id: 'waste-uuid-1',
  organizationId: ORG_ID,
  projectId: 'project-uuid-1',
  wasteType: '建設廃棄物',
  quantity: '5.5',
  unit: 'ton',
  disposalMethod: '許可業者委託',
  disposalDate: new Date(),
  contractor: '〇〇産廃',
  manifestNo: null,
  createdBy: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: { id: 'project-uuid-1', code: 'P001', name: 'テストプロジェクト' },
};

const mockPrisma = {
  environmentalAspect: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  legalRequirement: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  wasteRecord: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
};

const mockAuditTrailService = {
  record: jest.fn().mockResolvedValue({}),
};

describe('EnvironmentService', () => {
  let service: EnvironmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditTrailService, useValue: mockAuditTrailService },
      ],
    }).compile();

    service = module.get<EnvironmentService>(EnvironmentService);
    jest.clearAllMocks();
  });

  describe('findAllAspects', () => {
    it('環境側面一覧を返す', async () => {
      mockPrisma.environmentalAspect.findMany.mockResolvedValue([mockAspect]);

      const result = await service.findAllAspects({}, ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0].aspectName).toBe('建設廃材の発生');
    });

    it('projectId でフィルタリングできる', async () => {
      mockPrisma.environmentalAspect.findMany.mockResolvedValue([mockAspect]);

      await service.findAllAspects({ projectId: 'project-uuid-1' }, ORG_ID);

      expect(mockPrisma.environmentalAspect.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-uuid-1' }),
        }),
      );
    });
  });

  describe('findOneAspect', () => {
    it('存在する環境側面を返す', async () => {
      mockPrisma.environmentalAspect.findFirst.mockResolvedValue(mockAspect);

      const result = await service.findOneAspect('aspect-uuid-1', ORG_ID);

      expect(result.id).toBe('aspect-uuid-1');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.environmentalAspect.findFirst.mockResolvedValue(null);

      await expect(service.findOneAspect('non-existent', ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAspect', () => {
    it('環境側面を作成し監査証跡を記録する', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'project-uuid-1' });
      mockPrisma.environmentalAspect.create.mockResolvedValue(mockAspect);

      const dto = {
        projectId: 'project-uuid-1',
        aspectName: '建設廃材の発生',
        environmentalImpact: '廃棄物増加',
        significance: Significance.MAJOR,
      };

      const result = await service.createAspect(dto as any, USER_ID, ORG_ID);

      expect(result.aspectName).toBe('建設廃材の発生');
      expect(mockAuditTrailService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'EnvironmentalAspect' }),
      );
    });

    it('存在しないプロジェクトIDで NotFoundException', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const dto = {
        projectId: 'non-existent-project',
        aspectName: 'test',
        significance: Significance.MINOR,
      };

      await expect(service.createAspect(dto as any, USER_ID, ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllLegalRequirements', () => {
    it('法規制要求事項一覧を返す', async () => {
      mockPrisma.legalRequirement.findMany.mockResolvedValue([mockLegalRequirement]);

      const result = await service.findAllLegalRequirements({}, ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0].lawName).toBe('廃棄物の処理及び清掃に関する法律');
    });

    it('complianceStatus でフィルタリングできる', async () => {
      mockPrisma.legalRequirement.findMany.mockResolvedValue([mockLegalRequirement]);

      await service.findAllLegalRequirements(
        { complianceStatus: ComplianceStatus.COMPLIANT },
        ORG_ID,
      );

      expect(mockPrisma.legalRequirement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ complianceStatus: ComplianceStatus.COMPLIANT }),
        }),
      );
    });
  });

  describe('findAllWasteRecords', () => {
    it('廃棄物記録一覧を返す', async () => {
      mockPrisma.wasteRecord.findMany.mockResolvedValue([mockWasteRecord]);

      const result = await service.findAllWasteRecords({}, ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0].wasteType).toBe('建設廃棄物');
    });

    it('projectId でフィルタリングできる', async () => {
      mockPrisma.wasteRecord.findMany.mockResolvedValue([mockWasteRecord]);

      await service.findAllWasteRecords({ projectId: 'project-uuid-1' }, ORG_ID);

      expect(mockPrisma.wasteRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-uuid-1' }),
        }),
      );
    });
  });

  describe('createWasteRecord', () => {
    it('廃棄物記録を作成し監査証跡を記録する', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'project-uuid-1' });
      mockPrisma.wasteRecord.create.mockResolvedValue(mockWasteRecord);

      const dto = {
        projectId: 'project-uuid-1',
        wasteType: '建設廃棄物',
        quantity: '5.5',
        unit: 'ton',
        disposalMethod: '許可業者委託',
        disposalDate: new Date().toISOString(),
      };

      const result = await service.createWasteRecord(dto as any, USER_ID, ORG_ID);

      expect(result.wasteType).toBe('建設廃棄物');
      expect(mockAuditTrailService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'WasteRecord' }),
      );
    });
  });
});
