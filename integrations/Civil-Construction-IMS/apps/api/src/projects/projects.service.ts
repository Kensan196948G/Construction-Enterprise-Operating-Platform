import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateProjectDto {
  code: string;
  name: string;
  description?: string;
  clientName?: string;
  contractAmount?: number;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  organizationId: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  clientName?: string;
  contractAmount?: number;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  status?: string;
}

export interface ListProjectsFilter {
  status?: string;
  managerId?: string;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // findAll
  // ----------------------------------------------------------------

  async findAll(filter: ListProjectsFilter = {}) {
    const where: Prisma.ProjectWhereInput = {};

    if (filter.status) {
      where.status = filter.status as Prisma.EnumProjectStatusFilter;
    }
    if (filter.managerId) {
      where.managerId = filter.managerId;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        _count: {
          select: {
            documents: true,
            qualityPlans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----------------------------------------------------------------
  // findById
  // ----------------------------------------------------------------

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, documentNo: true, status: true, createdAt: true },
        },
        qualityPlans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, planNo: true, title: true, status: true },
        },
        _count: {
          select: {
            documents: true,
            qualityPlans: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${id}`);
    }

    return project;
  }

  // ----------------------------------------------------------------
  // create
  // ----------------------------------------------------------------

  async create(dto: CreateProjectDto, actorId: string) {
    const project = await this.prisma.project.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        clientName: dto.clientName,
        contractAmount: dto.contractAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        managerId: dto.managerId,
        organizationId: dto.organizationId,
        createdBy: actorId,
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    await this.recordAudit('Project', project.id, 'CREATE', actorId, null, project);

    return project;
  }

  // ----------------------------------------------------------------
  // update
  // ----------------------------------------------------------------

  async update(id: string, dto: UpdateProjectDto, actorId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        clientName: dto.clientName ?? existing.clientName,
        contractAmount:
          dto.contractAmount ?? (existing.contractAmount as unknown as number | undefined),
        startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
        managerId: dto.managerId ?? existing.managerId,
        updatedAt: new Date(),
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    await this.recordAudit('Project', id, 'UPDATE', actorId, existing, updated);

    return updated;
  }

  // ----------------------------------------------------------------
  // delete
  // ----------------------------------------------------------------

  async delete(id: string, actorId: string) {
    const existing = await this.findById(id);

    await this.prisma.project.delete({ where: { id } });

    await this.recordAudit('Project', id, 'DELETE', actorId, existing, null);
  }

  // ----------------------------------------------------------------
  // Internal audit trail
  // ----------------------------------------------------------------

  private async recordAudit(
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    before: unknown,
    after: unknown,
  ): Promise<void> {
    try {
      await this.prisma.auditTrail.create({
        data: {
          entityType,
          entityId,
          action,
          actorId,
          before: (before ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          after: (after ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          occurredAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error('Failed to write audit trail', err);
    }
  }
}
