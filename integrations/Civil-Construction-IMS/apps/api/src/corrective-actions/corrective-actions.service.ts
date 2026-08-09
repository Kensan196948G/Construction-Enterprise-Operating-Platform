import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../audit/audit-trail.service';
import {
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  QueryCorrectiveActionDto,
} from './dto';
import { CorrectiveActionStatus } from '@prisma/client';

@Injectable()
export class CorrectiveActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /** Resolve all project IDs belonging to the given organization for IDOR scoping. */
  private async orgProjectIds(organizationId: string): Promise<string[]> {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      select: { id: true },
    });
    return projects.map((p) => p.id);
  }

  async findAll(query: QueryCorrectiveActionDto, organizationId: string) {
    const { projectId, sourceType, status, severity, isoStandard, page = 1, limit = 20 } = query;

    const allowedProjectIds = await this.orgProjectIds(organizationId);

    const where = {
      projectId: { in: allowedProjectIds },
      ...(projectId && allowedProjectIds.includes(projectId) ? { projectId } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(isoStandard ? { isoStandard } : {}),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.correctiveAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.correctiveAction.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, organizationId: string) {
    const allowedProjectIds = await this.orgProjectIds(organizationId);

    const ca = await this.prisma.correctiveAction.findFirst({
      where: { id, projectId: { in: allowedProjectIds } },
    });
    if (!ca) throw new NotFoundException(`CorrectiveAction ${id} not found`);
    return ca;
  }

  async create(dto: CreateCorrectiveActionDto, actorId: string) {
    const existing = await this.prisma.correctiveAction.findUnique({
      where: { caNo: dto.caNo },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`CA番号 ${dto.caNo} は既に使用されています`);
    }

    const ca = await this.prisma.correctiveAction.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdBy: actorId,
      },
    });

    await this.auditTrail.record({
      entityType: 'CorrectiveAction',
      entityId: ca.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: ca,
      reason: `是正処置 ${ca.caNo} 登録`,
    });

    return ca;
  }

  async update(
    id: string,
    dto: UpdateCorrectiveActionDto,
    actorId: string,
    organizationId: string,
  ) {
    const existing = await this.findOne(id, organizationId);

    // updateMany with org-scoped projectId prevents TOCTOU cross-tenant write
    const result = await this.prisma.correctiveAction.updateMany({
      where: { id, projectId: existing.projectId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    if (result.count === 0) throw new NotFoundException(`CorrectiveAction ${id} not found`);

    const updated = await this.prisma.correctiveAction.findUniqueOrThrow({ where: { id } });

    await this.auditTrail.record({
      entityType: 'CorrectiveAction',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing,
      after: updated,
      reason: '是正処置 更新',
    });

    return updated;
  }

  async close(id: string, actorId: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

    const result = await this.prisma.correctiveAction.updateMany({
      where: { id, projectId: existing.projectId },
      data: {
        status: CorrectiveActionStatus.CLOSED,
        closedAt: new Date(),
        closedBy: actorId,
      },
    });

    if (result.count === 0) throw new NotFoundException(`CorrectiveAction ${id} not found`);

    const updated = await this.prisma.correctiveAction.findUniqueOrThrow({ where: { id } });

    await this.auditTrail.record({
      entityType: 'CorrectiveAction',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before: existing,
      after: updated,
      reason: '是正処置 クローズ',
    });

    return updated;
  }

  async remove(id: string, actorId: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

    const result = await this.prisma.correctiveAction.deleteMany({
      where: { id, projectId: existing.projectId },
    });

    if (result.count === 0) throw new NotFoundException(`CorrectiveAction ${id} not found`);

    await this.auditTrail.record({
      entityType: 'CorrectiveAction',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing,
      after: null,
      reason: '是正処置 削除',
    });
  }
}
