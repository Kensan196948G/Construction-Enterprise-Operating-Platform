import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentsService } from '../documents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

const baseDocument = {
  id: 'doc-uuid-1',
  documentNo: 'DOC-2026-001',
  title: 'テスト規程',
  categoryId: 'cat-uuid-1',
  projectId: null,
  status: DocumentStatus.DRAFT,
  currentVersion: 1,
  createdBy: 'user-uuid-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockPrisma = {
  document: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  documentCategory: {
    findUnique: jest.fn(),
  },
  documentVersion: {
    updateMany: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  auditTrail: {
    create: jest.fn().mockResolvedValue({}),
  },
};

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
    mockPrisma.auditTrail.create.mockResolvedValue({});
  });

  describe('create', () => {
    it('文書を作成し初版 + 監査証跡を記録', async () => {
      mockPrisma.documentCategory.findUnique.mockResolvedValue({ id: 'cat-uuid-1' });
      mockPrisma.document.create.mockResolvedValue({ ...baseDocument, versions: [] });

      const dto = { documentNo: 'DOC-2026-001', title: 'テスト規程', categoryId: 'cat-uuid-1' };
      const result = await service.create(dto as never, 'user-uuid-1');

      expect(result.documentNo).toBe('DOC-2026-001');
      expect(mockPrisma.auditTrail.create).toHaveBeenCalled();
    });

    it('存在しないカテゴリで NotFoundException', async () => {
      mockPrisma.documentCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ categoryId: 'missing' } as never, 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('存在する文書を返す', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(baseDocument);
      const result = await service.findOne('doc-uuid-1');
      expect(result.id).toBe('doc-uuid-1');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('状態遷移 (workflow)', () => {
    it('DRAFT → UNDER_REVIEW (submitForReview)', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        ...baseDocument,
        status: DocumentStatus.DRAFT,
      });
      mockPrisma.document.update.mockResolvedValue({
        ...baseDocument,
        status: DocumentStatus.UNDER_REVIEW,
      });
      mockPrisma.documentVersion.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.submitForReview('doc-uuid-1', 'user-uuid-1');
      expect(result.status).toBe(DocumentStatus.UNDER_REVIEW);
    });

    it('UNDER_REVIEW → APPROVED (approve)', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        ...baseDocument,
        status: DocumentStatus.UNDER_REVIEW,
      });
      mockPrisma.document.update.mockResolvedValue({
        ...baseDocument,
        status: DocumentStatus.APPROVED,
      });
      mockPrisma.documentVersion.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.approve('doc-uuid-1', 'user-uuid-1');
      expect(result.status).toBe(DocumentStatus.APPROVED);
    });

    it('DRAFT を approve すると BadRequestException (不正な遷移)', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        ...baseDocument,
        status: DocumentStatus.DRAFT,
      });

      await expect(service.approve('doc-uuid-1', 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('PUBLISHED でない文書の withdraw は BadRequestException', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        ...baseDocument,
        status: DocumentStatus.DRAFT,
      });

      await expect(service.withdraw('doc-uuid-1', 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
