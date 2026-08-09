import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects.service';
import { PrismaService } from '../../prisma/prisma.service';

const ACTOR_ID = 'user-uuid-1';
const PROJECT_ID = 'proj-uuid-1';
const ORG_ID = 'org-uuid-1';

const mockProject = {
  id: PROJECT_ID,
  code: 'PROJ-001',
  name: '東京都庁舎建設工事',
  description: '東京都新庁舎の建設工事プロジェクト',
  clientName: '東京都',
  contractAmount: 1_000_000_000,
  startDate: new Date('2026-04-01'),
  endDate: new Date('2028-03-31'),
  managerId: ACTOR_ID,
  organizationId: ORG_ID,
  status: 'ACTIVE',
  createdBy: ACTOR_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  organization: { id: ORG_ID, name: 'テスト建設株式会社' },
  documents: [],
  qualityPlans: [],
  _count: { documents: 0, qualityPlans: 0 },
};

const mockPrisma = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditTrail: {
    create: jest.fn(),
  },
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('フィルターなしでプロジェクト一覧を返す', async () => {
      mockPrisma.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(PROJECT_ID);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('status フィルターを適用する', async () => {
      mockPrisma.project.findMany.mockResolvedValue([mockProject]);

      await service.findAll({ status: 'ACTIVE' });

      const call = mockPrisma.project.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('ACTIVE');
    });

    it('managerId フィルターを適用する', async () => {
      mockPrisma.project.findMany.mockResolvedValue([mockProject]);

      await service.findAll({ managerId: ACTOR_ID });

      const call = mockPrisma.project.findMany.mock.calls[0][0];
      expect(call.where.managerId).toBe(ACTOR_ID);
    });

    it('空配列を返す（件数 0 の場合）', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('存在するプロジェクトを返す', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findById(PROJECT_ID);

      expect(result.id).toBe(PROJECT_ID);
      expect(result.code).toBe('PROJ-001');
      expect(result.status).toBe('ACTIVE');
    });

    it('存在しない ID で NotFoundException を投げる', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('関連データ（organization, documents, qualityPlans）を含めて返す', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findById(PROJECT_ID);

      expect(result.organization).toBeDefined();
      expect(result.organization.name).toBe('テスト建設株式会社');
    });
  });

  describe('create', () => {
    const dto = {
      code: 'PROJ-002',
      name: '大阪駅前再開発工事',
      organizationId: ORG_ID,
      clientName: '大阪市',
      startDate: '2026-07-01',
      endDate: '2029-06-30',
    };

    it('プロジェクトを作成してその内容を返す', async () => {
      mockPrisma.project.create.mockResolvedValue({ ...mockProject, ...dto, id: 'proj-uuid-2' });
      mockPrisma.auditTrail.create.mockResolvedValue({});

      const result = await service.create(dto, ACTOR_ID);

      expect(result.code).toBe('PROJ-002');
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'PROJ-002',
            organizationId: ORG_ID,
            createdBy: ACTOR_ID,
          }),
        }),
      );
    });

    it('startDate と endDate を Date 型に変換して保存する', async () => {
      mockPrisma.project.create.mockResolvedValue(mockProject);
      mockPrisma.auditTrail.create.mockResolvedValue({});

      await service.create(dto, ACTOR_ID);

      const createArgs = mockPrisma.project.create.mock.calls[0][0];
      expect(createArgs.data.startDate).toBeInstanceOf(Date);
      expect(createArgs.data.endDate).toBeInstanceOf(Date);
    });

    it('作成後に監査証跡（auditTrail）を記録する', async () => {
      mockPrisma.project.create.mockResolvedValue(mockProject);
      mockPrisma.auditTrail.create.mockResolvedValue({});

      await service.create(dto, ACTOR_ID);

      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'Project',
            action: 'CREATE',
            actorId: ACTOR_ID,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('プロジェクト情報を更新する', async () => {
      const updatedProject = { ...mockProject, name: '東京都庁舎建設工事（改訂）' };
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(updatedProject);
      mockPrisma.auditTrail.create.mockResolvedValue({});

      const result = await service.update(
        PROJECT_ID,
        { name: '東京都庁舎建設工事（改訂）' },
        ACTOR_ID,
      );

      expect(result.name).toBe('東京都庁舎建設工事（改訂）');
      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROJECT_ID },
          data: expect.objectContaining({ name: '東京都庁舎建設工事（改訂）' }),
        }),
      );
    });

    it('存在しない ID では NotFoundException を投げる', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'テスト' }, ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('更新後に監査証跡（auditTrail）を記録する', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(mockProject);
      mockPrisma.auditTrail.create.mockResolvedValue({});

      await service.update(PROJECT_ID, {}, ACTOR_ID);

      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'Project',
            action: 'UPDATE',
            actorId: ACTOR_ID,
          }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('プロジェクトを削除する', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);
      mockPrisma.auditTrail.create.mockResolvedValue({});

      await expect(service.delete(PROJECT_ID, ACTOR_ID)).resolves.toBeUndefined();
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({ where: { id: PROJECT_ID } });
    });

    it('存在しない ID では NotFoundException を投げる', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent', ACTOR_ID)).rejects.toThrow(NotFoundException);
    });

    it('削除後に監査証跡（auditTrail）を記録する', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);
      mockPrisma.auditTrail.create.mockResolvedValue({});

      await service.delete(PROJECT_ID, ACTOR_ID);

      expect(mockPrisma.auditTrail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'Project',
            action: 'DELETE',
            actorId: ACTOR_ID,
          }),
        }),
      );
    });
  });
});
