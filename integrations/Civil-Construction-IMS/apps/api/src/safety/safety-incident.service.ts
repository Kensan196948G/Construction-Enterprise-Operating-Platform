import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../audit/audit-trail.service';
import { Prisma, CorrectiveActionStatus } from '@prisma/client';

@Injectable()
export class SafetyIncidentService {
  private readonly logger = new Logger(SafetyIncidentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  // ================================================================
  // findAll
  // ================================================================

  async findAll(query: any, organizationId: string) {
    const { status, incidentType, projectId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.SafetyIncidentWhereInput = {
      organizationId,
      ...(status ? { status: status as CorrectiveActionStatus } : {}),
      ...(incidentType ? { incidentType } : {}),
      ...(projectId ? { projectId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.safetyIncident.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.safetyIncident.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ================================================================
  // findOne
  // ================================================================

  async findOne(id: string, organizationId: string) {
    const incident = await this.prisma.safetyIncident.findFirst({
      where: { id, organizationId },
    });
    if (!incident) {
      throw new NotFoundException(`SafetyIncident id=${id} not found`);
    }
    return incident;
  }

  // ================================================================
  // create
  // ================================================================

  async create(dto: any, actorId: string, organizationId: string) {
    // Duplicate check scoped to organization (not global unique)
    const existing = await this.prisma.safetyIncident.findFirst({
      where: { organizationId, incidentNo: dto.incidentNo },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`インシデント番号 "${dto.incidentNo}" は既に使用されています`);
    }

    const incident = await this.prisma.safetyIncident.create({
      data: {
        ...dto,
        organizationId,
        reportedBy: actorId,
        occurredAt: new Date(dto.occurredAt),
      },
    });

    await this.auditTrail.record({
      entityType: 'SafetyIncident',
      entityId: incident.id,
      action: 'CREATE',
      actorId,
      after: incident,
    });

    return incident;
  }

  // ================================================================
  // update
  // ================================================================

  async update(id: string, dto: any, actorId: string, organizationId: string) {
    const before = await this.findOne(id, organizationId);

    // TOCTOU-safe: use updateMany scoped to organizationId
    const result = await this.prisma.safetyIncident.updateMany({
      where: { id, organizationId },
      data: { ...dto, updatedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException(`SafetyIncident id=${id} not found`);
    }

    const after = await this.prisma.safetyIncident.findUnique({ where: { id } });

    await this.auditTrail.record({
      entityType: 'SafetyIncident',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
    });

    return after;
  }

  // ================================================================
  // close
  // ================================================================

  async close(id: string, actorId: string, organizationId: string) {
    const before = await this.findOne(id, organizationId);

    const result = await this.prisma.safetyIncident.updateMany({
      where: { id, organizationId },
      data: {
        status: CorrectiveActionStatus.CLOSED,
        closedAt: new Date(),
        closedBy: actorId,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`SafetyIncident id=${id} not found`);
    }

    const after = await this.prisma.safetyIncident.findUnique({ where: { id } });

    await this.auditTrail.record({
      entityType: 'SafetyIncident',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before,
      after,
    });

    return after;
  }

  // ================================================================
  // remove
  // ================================================================

  async remove(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.findOne(id, organizationId);

    const result = await this.prisma.safetyIncident.deleteMany({
      where: { id, organizationId },
    });

    if (result.count === 0) {
      throw new NotFoundException(`SafetyIncident id=${id} not found`);
    }

    await this.auditTrail.record({
      entityType: 'SafetyIncident',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
    });
  }
}
