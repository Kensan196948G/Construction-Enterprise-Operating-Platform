import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from './audit-trail.service';
import {
  CreateAuditPlanDto,
  UpdateAuditPlanDto,
  CreateAuditFindingDto,
  UpdateAuditFindingDto,
  QueryAuditTrailDto,
} from './dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trailService: AuditTrailService,
  ) {}

  // ----------------------------------------------------------------
  // Audit Trail (read-only queries; writes via AuditTrailService)
  // ----------------------------------------------------------------

  async findTrails(query: QueryAuditTrailDto) {
    const { entityType, entityId, actorId, from, to, page = 1, limit = 20 } = query;

    const where = {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorId ? { actorId } : {}),
      ...(from || to
        ? {
            occurredAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditTrail.findMany({
        where,
        include: {
          actor: {
            select: { id: true, displayName: true, email: true },
          },
        },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditTrail.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneTrail(id: string) {
    const trail = await this.prisma.auditTrail.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
      },
    });
    if (!trail) throw new NotFoundException(`AuditTrail ${id} not found`);
    return trail;
  }

  // ----------------------------------------------------------------
  // Audit Plans
  // ----------------------------------------------------------------

  async findPlans(params: {
    isoStandard?: string;
    projectId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { isoStandard, projectId, status, page, limit } = params;

    const where = {
      ...(isoStandard ? { isoStandard } : {}),
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as import('@prisma/client').AuditStatus } : {}),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditPlan.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          _count: { select: { findings: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditPlan.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.auditPlan.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        findings: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException(`AuditPlan ${id} not found`);
    return plan;
  }

  async createPlan(dto: CreateAuditPlanDto, actorId: string, req: Request) {
    const plan = await this.prisma.auditPlan.create({
      data: {
        ...dto,
        scheduledAt: new Date(dto.scheduledAt),
        createdBy: actorId,
      },
    });

    await this.trailService.record({
      entityType: 'AuditPlan',
      entityId: plan.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: plan,
      reason: dto.reason,
      req,
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdateAuditPlanDto, actorId: string, req: Request) {
    const existing = await this.findOnePlan(id);

    const updated = await this.prisma.auditPlan.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        updatedAt: new Date(),
      },
    });

    await this.trailService.record({
      entityType: 'AuditPlan',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing,
      after: updated,
      reason: dto.reason,
      req,
    });

    return updated;
  }

  async removePlan(id: string, actorId: string, req: Request) {
    const existing = await this.findOnePlan(id);

    // Hard delete; use soft-delete by adding deletedAt if preferred
    await this.prisma.auditPlan.delete({ where: { id } });

    await this.trailService.record({
      entityType: 'AuditPlan',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing,
      after: null,
      req,
    });
  }

  // ----------------------------------------------------------------
  // Audit Findings
  // ----------------------------------------------------------------

  async findFindings(planId: string) {
    // Ensure the plan exists
    await this.findOnePlan(planId);

    return this.prisma.auditFinding.findMany({
      where: { auditPlanId: planId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneFinding(id: string) {
    const finding = await this.prisma.auditFinding.findUnique({
      where: { id },
      include: {
        auditPlan: { select: { id: true, planNo: true, title: true } },
      },
    });
    if (!finding) throw new NotFoundException(`AuditFinding ${id} not found`);
    return finding;
  }

  async createFinding(planId: string, dto: CreateAuditFindingDto, actorId: string, req: Request) {
    // Ensure the plan exists
    await this.findOnePlan(planId);

    const finding = await this.prisma.auditFinding.create({
      data: {
        ...dto,
        auditPlanId: planId,
        createdBy: actorId,
      },
    });

    await this.trailService.record({
      entityType: 'AuditFinding',
      entityId: finding.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: finding,
      reason: dto.reason,
      req,
    });

    return finding;
  }

  async updateFinding(id: string, dto: UpdateAuditFindingDto, actorId: string, req: Request) {
    const existing = await this.findOneFinding(id);

    const updated = await this.prisma.auditFinding.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    await this.trailService.record({
      entityType: 'AuditFinding',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing,
      after: updated,
      reason: dto.reason,
      req,
    });

    return updated;
  }

  async removeFinding(id: string, actorId: string, req: Request) {
    const existing = await this.findOneFinding(id);

    await this.prisma.auditFinding.delete({ where: { id } });

    await this.trailService.record({
      entityType: 'AuditFinding',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing,
      after: null,
      req,
    });
  }
}
