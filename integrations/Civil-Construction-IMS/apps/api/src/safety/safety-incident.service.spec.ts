import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SafetyIncidentService } from './safety-incident.service';
import { AuditTrailService } from '../audit/audit-trail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CorrectiveActionStatus, IncidentType, Severity } from '@prisma/client';

const ORG_ID = 'org-uuid-1';
const USER_ID = 'user-uuid-1';
const INCIDENT_ID = 'incident-uuid-1';

const mockIncident = {
  id: INCIDENT_ID,
  organizationId: ORG_ID,
  incidentNo: 'INC-2024-001',
  projectId: null,
  incidentType: IncidentType.ACCIDENT,
  occurredAt: new Date('2024-01-15T09:00:00Z'),
  location: '第1工区',
  description: '転倒事故が発生した',
  injuredPerson: '山田太郎',
  injuryType: '打撲',
  lostDays: 3,
  severity: Severity.MEDIUM,
  immediateAction: '救急搬送',
  rootCause: null,
  preventiveMeasure: null,
  status: CorrectiveActionStatus.OPEN,
  reportedBy: USER_ID,
  investigatedBy: null,
  closedAt: null,
  closedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  safetyIncident: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAuditTrail = {
  record: jest.fn().mockResolvedValue(undefined),
};

describe('SafetyIncidentService', () => {
  let service: SafetyIncidentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyIncidentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditTrailService, useValue: mockAuditTrail },
      ],
    }).compile();

    service = module.get<SafetyIncidentService>(SafetyIncidentService);
    jest.clearAllMocks();
  });

  // ================================================================
  // findAll
  // ================================================================

  describe('findAll', () => {
    it('組織 ID でスコープされた一覧を返す', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockIncident], 1]);

      const result = await service.findAll({}, ORG_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(INCIDENT_ID);
      expect(result.meta.total).toBe(1);
    });
  });

  // ================================================================
  // findOne
  // ================================================================

  describe('findOne', () => {
    it('存在するインシデントを返す', async () => {
      mockPrisma.safetyIncident.findFirst.mockResolvedValue(mockIncident);

      const result = await service.findOne(INCIDENT_ID, ORG_ID);

      expect(mockPrisma.safetyIncident.findFirst).toHaveBeenCalledWith({
        where: { id: INCIDENT_ID, organizationId: ORG_ID },
      });
      expect(result.id).toBe(INCIDENT_ID);
    });

    it('見つからない場合 NotFoundException をスローする', async () => {
      mockPrisma.safetyIncident.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ================================================================
  // create
  // ================================================================

  describe('create', () => {
    const createDto = {
      incidentNo: 'INC-2024-001',
      incidentType: IncidentType.ACCIDENT,
      occurredAt: '2024-01-15T09:00:00Z',
      description: '転倒事故が発生した',
      severity: Severity.MEDIUM,
    };

    it('インシデントを作成して返す', async () => {
      mockPrisma.safetyIncident.findFirst.mockResolvedValue(null); // no duplicate
      mockPrisma.safetyIncident.create.mockResolvedValue(mockIncident);

      const result = await service.create(createDto, USER_ID, ORG_ID);

      expect(mockPrisma.safetyIncident.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            incidentNo: createDto.incidentNo,
          }),
        }),
      );
      expect(mockPrisma.safetyIncident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            reportedBy: USER_ID,
          }),
        }),
      );
      expect(mockAuditTrail.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'SafetyIncident',
          action: 'CREATE',
          actorId: USER_ID,
        }),
      );
      expect(result.id).toBe(INCIDENT_ID);
    });

    it('incidentNo が重複する場合 ConflictException をスローする', async () => {
      mockPrisma.safetyIncident.findFirst.mockResolvedValue({ id: 'existing-uuid' }); // duplicate found

      await expect(service.create(createDto, USER_ID, ORG_ID)).rejects.toThrow(ConflictException);
      expect(mockPrisma.safetyIncident.create).not.toHaveBeenCalled();
    });
  });

  // ================================================================
  // close
  // ================================================================

  describe('close', () => {
    it('インシデントを CLOSED ステータスにして返す', async () => {
      const closedIncident = {
        ...mockIncident,
        status: CorrectiveActionStatus.CLOSED,
        closedAt: new Date(),
        closedBy: USER_ID,
      };

      mockPrisma.safetyIncident.findFirst.mockResolvedValue(mockIncident); // findOne (before)
      mockPrisma.safetyIncident.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.safetyIncident.findUnique.mockResolvedValue(closedIncident); // after

      const result = await service.close(INCIDENT_ID, USER_ID, ORG_ID);

      expect(mockPrisma.safetyIncident.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INCIDENT_ID, organizationId: ORG_ID },
          data: expect.objectContaining({
            status: CorrectiveActionStatus.CLOSED,
            closedBy: USER_ID,
          }),
        }),
      );
      expect(mockAuditTrail.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'SafetyIncident',
          action: 'CLOSE',
          actorId: USER_ID,
        }),
      );
      expect(result!.status).toBe(CorrectiveActionStatus.CLOSED);
    });
  });
});
