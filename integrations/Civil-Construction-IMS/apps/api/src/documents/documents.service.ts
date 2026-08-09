import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CreateDocumentVersionDto,
  DocumentQueryDto,
} from './dto';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface AuditContext {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

/** Valid document status transitions */
const STATUS_TRANSITIONS: Partial<Record<DocumentStatus, DocumentStatus>> = {
  [DocumentStatus.DRAFT]: DocumentStatus.UNDER_REVIEW,
  [DocumentStatus.UNDER_REVIEW]: DocumentStatus.APPROVED,
  [DocumentStatus.APPROVED]: DocumentStatus.PUBLISHED,
  [DocumentStatus.PUBLISHED]: DocumentStatus.WITHDRAWN,
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------------
  // Private: Audit trail helper
  // -----------------------------------------------------------------------

  private async recordAudit(
    entityType: string,
    entityId: string,
    action: string,
    ctx: AuditContext,
    before?: unknown,
    after?: unknown,
  ): Promise<void> {
    try {
      await this.prisma.auditTrail.create({
        data: {
          entityType,
          entityId,
          action,
          actorId: ctx.actorId,
          before: before !== undefined ? (before as object) : undefined,
          after: after !== undefined ? (after as object) : undefined,
          reason: ctx.reason ?? null,
          ipAddress: ctx.ipAddress ?? null,
          userAgent: ctx.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Audit trail write failed [${entityType}:${entityId} ${action}]: ${String(err)}`,
      );
    }
  }

  // -----------------------------------------------------------------------
  // Create
  // -----------------------------------------------------------------------

  async create(dto: CreateDocumentDto, actorId: string) {
    // Verify category exists
    const category = await this.prisma.documentCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`DocumentCategory ${dto.categoryId} not found`);
    }

    // Verify project exists if provided
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project ${dto.projectId} not found`);
      }
    }

    const document = await this.prisma.document.create({
      data: {
        documentNo: dto.documentNo,
        title: dto.title,
        categoryId: dto.categoryId,
        projectId: dto.projectId ?? null,
        status: DocumentStatus.DRAFT,
        currentVersion: 1,
        createdBy: actorId,
        versions: {
          create: {
            versionNo: 1,
            title: dto.title,
            content: dto.content ?? null,
            filePath: dto.filePath ?? null,
            fileSize: dto.fileSize ?? null,
            mimeType: dto.mimeType ?? null,
            changeNote: dto.changeNote ?? '初版作成',
            status: DocumentStatus.DRAFT,
            createdBy: actorId,
          },
        },
      },
      include: {
        versions: true,
        category: true,
        project: { select: { id: true, code: true, name: true } },
        creator: { select: { id: true, displayName: true, email: true } },
      },
    });

    await this.recordAudit('Document', document.id, 'CREATE', { actorId }, null, document);

    return document;
  }

  // -----------------------------------------------------------------------
  // Read - list
  // -----------------------------------------------------------------------

  async findAll(query: DocumentQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status as DocumentStatus } : {}),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword, mode: 'insensitive' as const } },
              { documentNo: { contains: query.keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          project: { select: { id: true, code: true, name: true } },
          creator: { select: { id: true, displayName: true } },
          _count: { select: { versions: true } },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // -----------------------------------------------------------------------
  // Read - single
  // -----------------------------------------------------------------------

  async findOne(id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        project: { select: { id: true, code: true, name: true } },
        creator: { select: { id: true, displayName: true, email: true } },
        versions: { orderBy: { versionNo: 'desc' } },
        workflows: {
          where: { status: { notIn: ['APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] } },
          include: {
            workflow: { select: { id: true, code: true, name: true } },
            requester: { select: { id: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return document;
  }

  // -----------------------------------------------------------------------
  // Update
  // -----------------------------------------------------------------------

  async update(id: string, dto: UpdateDocumentDto, actorId: string) {
    const existing = await this.findOne(id);

    // Prevent updating if not in DRAFT
    if (existing.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException(
        `Document status is ${existing.status}. Only DRAFT documents can be edited directly.`,
      );
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        categoryId: dto.categoryId ?? existing.categoryId,
        projectId: dto.projectId !== undefined ? dto.projectId : existing.projectId,
      },
      include: {
        category: true,
        project: { select: { id: true, code: true, name: true } },
        creator: { select: { id: true, displayName: true } },
      },
    });

    await this.recordAudit('Document', id, 'UPDATE', { actorId }, existing, updated);

    return updated;
  }

  // -----------------------------------------------------------------------
  // Soft delete
  // -----------------------------------------------------------------------

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await this.findOne(id);

    if (existing.status === DocumentStatus.PUBLISHED) {
      throw new BadRequestException('PUBLISHED documents cannot be deleted. Use withdraw instead.');
    }

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.recordAudit('Document', id, 'DELETE', { actorId }, existing, null);
  }

  // -----------------------------------------------------------------------
  // Version management
  // -----------------------------------------------------------------------

  async addVersion(id: string, dto: CreateDocumentVersionDto, actorId: string) {
    const document = await this.findOne(id);

    // New version can be added only from DRAFT or PUBLISHED
    if (document.status !== DocumentStatus.DRAFT && document.status !== DocumentStatus.PUBLISHED) {
      throw new BadRequestException(
        `Cannot add a new version while document status is ${document.status}.`,
      );
    }

    const newVersionNo = document.currentVersion + 1;

    const [version, updatedDoc] = await this.prisma.$transaction([
      this.prisma.documentVersion.create({
        data: {
          documentId: id,
          versionNo: newVersionNo,
          title: dto.title ?? document.title,
          content: dto.content ?? null,
          filePath: dto.filePath ?? null,
          fileSize: dto.fileSize ?? null,
          mimeType: dto.mimeType ?? null,
          changeNote: dto.changeNote ?? null,
          status: DocumentStatus.DRAFT,
          createdBy: actorId,
        },
      }),
      this.prisma.document.update({
        where: { id },
        data: {
          currentVersion: newVersionNo,
          status: DocumentStatus.DRAFT,
        },
      }),
    ]);

    await this.recordAudit('DocumentVersion', version.id, 'CREATE', { actorId }, null, {
      ...version,
      documentStatus: updatedDoc.status,
    });

    return version;
  }

  async getVersions(id: string) {
    await this.findOne(id); // ensure document exists

    return this.prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { versionNo: 'desc' },
    });
  }

  async getVersion(id: string, versionNo: number) {
    const version = await this.prisma.documentVersion.findUnique({
      where: { documentId_versionNo: { documentId: id, versionNo } },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNo} of document ${id} not found`);
    }

    return version;
  }

  // -----------------------------------------------------------------------
  // Status transitions
  // -----------------------------------------------------------------------

  private async transitionStatus(
    id: string,
    expectedCurrent: DocumentStatus,
    nextStatus: DocumentStatus,
    actorId: string,
    action: string,
    extraVersionData?: Partial<{ approvedAt: Date; approvedBy: string; publishedAt: Date }>,
  ) {
    const document = await this.findOne(id);

    if (document.status !== expectedCurrent) {
      throw new BadRequestException(
        `Document must be in ${expectedCurrent} status to perform ${action}. Current: ${document.status}`,
      );
    }

    const before = { status: document.status };

    const updated = await this.prisma.document.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        category: true,
        creator: { select: { id: true, displayName: true } },
      },
    });

    // Also update the current version record
    if (extraVersionData) {
      await this.prisma.documentVersion.updateMany({
        where: { documentId: id, versionNo: document.currentVersion },
        data: { status: nextStatus, ...extraVersionData },
      });
    } else {
      await this.prisma.documentVersion.updateMany({
        where: { documentId: id, versionNo: document.currentVersion },
        data: { status: nextStatus },
      });
    }

    await this.recordAudit('Document', id, action, { actorId }, before, { status: nextStatus });

    return updated;
  }

  async submitForReview(id: string, actorId: string) {
    return this.transitionStatus(
      id,
      DocumentStatus.DRAFT,
      DocumentStatus.UNDER_REVIEW,
      actorId,
      'SUBMIT_FOR_REVIEW',
    );
  }

  async approve(id: string, actorId: string) {
    return this.transitionStatus(
      id,
      DocumentStatus.UNDER_REVIEW,
      DocumentStatus.APPROVED,
      actorId,
      'APPROVE',
      { approvedAt: new Date(), approvedBy: actorId },
    );
  }

  async publish(id: string, actorId: string) {
    return this.transitionStatus(
      id,
      DocumentStatus.APPROVED,
      DocumentStatus.PUBLISHED,
      actorId,
      'PUBLISH',
      { publishedAt: new Date() },
    );
  }

  async withdraw(id: string, actorId: string) {
    const document = await this.findOne(id);

    if (document.status !== DocumentStatus.PUBLISHED) {
      throw new BadRequestException(
        `Document must be PUBLISHED to withdraw. Current: ${document.status}`,
      );
    }

    const before = { status: document.status };

    const updated = await this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.WITHDRAWN },
    });

    await this.prisma.documentVersion.updateMany({
      where: { documentId: id, versionNo: document.currentVersion },
      data: { status: DocumentStatus.WITHDRAWN },
    });

    await this.recordAudit('Document', id, 'WITHDRAW', { actorId }, before, {
      status: DocumentStatus.WITHDRAWN,
    });

    return updated;
  }

  // -----------------------------------------------------------------------
  // Categories
  // -----------------------------------------------------------------------

  async getCategories() {
    return this.prisma.documentCategory.findMany({
      orderBy: [{ parentId: 'asc' }, { code: 'asc' }],
      include: {
        children: {
          orderBy: { code: 'asc' },
        },
      },
      where: { parentId: null },
    });
  }
}
