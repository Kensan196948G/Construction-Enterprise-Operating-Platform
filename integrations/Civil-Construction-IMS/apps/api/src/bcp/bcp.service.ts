import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma, DocumentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ----------------------------------------------------------------
// DTO interfaces
// ----------------------------------------------------------------

export interface FindAllPlansQuery {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreatePlanDto {
  planNo: string;
  title: string;
  scope?: string;
  rto?: number;
  rpo?: number;
}

export interface UpdatePlanDto {
  title?: string;
  scope?: string;
  rto?: number;
  rpo?: number;
  status?: string;
}

export interface CreateScenarioDto {
  scenarioType: string;
  title: string;
  description?: string;
  probability: number; // 1-5
  impact: number; // 1-5
  responseActions?: string;
  responsiblePerson?: string;
}

export interface UpdateScenarioDto {
  scenarioType?: string;
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  responseActions?: string;
  responsiblePerson?: string;
}

export interface CreateDrillRecordDto {
  drillNo: string;
  drillType: string;
  conductedAt: Date | string;
  participantCount?: number;
  scenario?: string;
  findings?: string;
  improvements?: string;
  evaluationScore?: number;
  nextDrillAt?: Date | string;
}

// ----------------------------------------------------------------
// Internal audit helper
// ----------------------------------------------------------------

interface AuditEntry {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  reason?: string;
}

@Injectable()
export class BcpService {
  private readonly logger = new Logger(BcpService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Private: audit trail
  // ----------------------------------------------------------------

  private async recordAudit(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditTrail.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          actorId: entry.actorId,
          before: entry.before ?? Prisma.JsonNull,
          after: entry.after ?? Prisma.JsonNull,
          reason: entry.reason,
          occurredAt: new Date(),
        },
      });
    } catch (err) {
      // Audit failure must not interrupt business logic.
      this.logger.error('Failed to write BCP audit trail', err);
    }
  }

  // ----------------------------------------------------------------
  // BcpPlan — CRUD
  // ----------------------------------------------------------------

  async findAllPlans(query: FindAllPlansQuery, organizationId: string) {
    const { status, page = 1, limit = 20 } = query;

    const where: Prisma.BcpPlanWhereInput = { organizationId };
    if (status) {
      where.status = status as DocumentStatus;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bcpPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { scenarios: true, drills: true } },
        },
      }),
      this.prisma.bcpPlan.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPlanById(id: string, organizationId: string) {
    const plan = await this.prisma.bcpPlan.findFirst({
      where: { id, organizationId },
      include: {
        scenarios: { orderBy: { createdAt: 'desc' } },
        drills: { orderBy: { conductedAt: 'desc' } },
      },
    });
    if (!plan) throw new NotFoundException(`BcpPlan ${id} not found`);
    return plan;
  }

  async createPlan(dto: CreatePlanDto, actorId: string, organizationId: string) {
    // Duplicate planNo per org check
    const existing = await this.prisma.bcpPlan.findUnique({
      where: { organizationId_planNo: { organizationId, planNo: dto.planNo } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`BCP計画番号 ${dto.planNo} は既に使用されています`);
    }

    const plan = await this.prisma.bcpPlan.create({
      data: {
        organizationId,
        planNo: dto.planNo,
        title: dto.title,
        scope: dto.scope,
        rto: dto.rto,
        rpo: dto.rpo,
        status: DocumentStatus.DRAFT,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'BcpPlan',
      entityId: plan.id,
      action: 'CREATE',
      actorId,
      after: plan as unknown as Prisma.InputJsonValue,
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto, actorId: string, organizationId: string) {
    // Reject APPROVED/WITHDRAWN via updatePlan — approval must go through approvePlan()
    if (dto.status === DocumentStatus.APPROVED || dto.status === 'WITHDRAWN') {
      throw new Error('ステータスの変更は approvePlan エンドポイント経由で行ってください');
    }

    const count = await this.prisma.bcpPlan.updateMany({
      where: { id, organizationId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
        ...(dto.rto !== undefined ? { rto: dto.rto } : {}),
        ...(dto.rpo !== undefined ? { rpo: dto.rpo } : {}),
        // status changes (DRAFT → UNDER_REVIEW only) are allowed; APPROVED requires approvePlan()
        ...(dto.status !== undefined && dto.status !== DocumentStatus.APPROVED
          ? { status: dto.status as DocumentStatus }
          : {}),
      },
    });

    if (count.count === 0) throw new NotFoundException(`BcpPlan ${id} not found`);

    const updated = await this.prisma.bcpPlan.findUnique({ where: { id } });

    await this.recordAudit({
      entityType: 'BcpPlan',
      entityId: id,
      action: 'UPDATE',
      actorId,
      after: updated as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  async approvePlan(id: string, actorId: string, organizationId: string) {
    // Server-side approval: set status, approvedAt and approvedBy atomically
    const count = await this.prisma.bcpPlan.updateMany({
      where: { id, organizationId },
      data: {
        status: DocumentStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: actorId,
      },
    });

    if (count.count === 0) throw new NotFoundException(`BcpPlan ${id} not found`);

    const approved = await this.prisma.bcpPlan.findUnique({ where: { id } });

    await this.recordAudit({
      entityType: 'BcpPlan',
      entityId: id,
      action: 'APPROVE',
      actorId,
      after: approved as unknown as Prisma.InputJsonValue,
    });

    return approved;
  }

  // ----------------------------------------------------------------
  // BcpRiskScenario — CRUD
  // ----------------------------------------------------------------

  /** Verify the plan exists and belongs to the organization. */
  private async assertPlanOwnership(planId: string, organizationId: string): Promise<void> {
    const plan = await this.prisma.bcpPlan.findFirst({
      where: { id: planId, organizationId },
      select: { id: true },
    });
    if (!plan) throw new NotFoundException(`BcpPlan ${planId} not found`);
  }

  async createScenario(
    planId: string,
    dto: CreateScenarioDto,
    actorId: string,
    organizationId: string,
  ) {
    await this.assertPlanOwnership(planId, organizationId);

    // Validate probability/impact range
    if (dto.probability < 1 || dto.probability > 5) {
      throw new BadRequestException('probability は 1〜5 の範囲で指定してください');
    }
    if (dto.impact < 1 || dto.impact > 5) {
      throw new BadRequestException('impact は 1〜5 の範囲で指定してください');
    }

    // Auto-compute riskScore server-side
    const riskScore = dto.probability * dto.impact;

    const scenario = await this.prisma.bcpRiskScenario.create({
      data: {
        planId,
        scenarioType: dto.scenarioType,
        title: dto.title,
        description: dto.description,
        probability: dto.probability,
        impact: dto.impact,
        riskScore,
        responseActions: dto.responseActions,
        responsiblePerson: dto.responsiblePerson,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'BcpRiskScenario',
      entityId: scenario.id,
      action: 'CREATE',
      actorId,
      after: scenario as unknown as Prisma.InputJsonValue,
    });

    return scenario;
  }

  async findScenariosByPlan(planId: string, organizationId: string) {
    await this.assertPlanOwnership(planId, organizationId);

    return this.prisma.bcpRiskScenario.findMany({
      where: { planId },
      orderBy: { riskScore: 'desc' },
    });
  }

  async updateScenario(
    scenarioId: string,
    planId: string,
    dto: UpdateScenarioDto,
    actorId: string,
    organizationId: string,
  ) {
    await this.assertPlanOwnership(planId, organizationId);

    // Verify the scenario belongs to the plan
    const existing = await this.prisma.bcpRiskScenario.findFirst({
      where: { id: scenarioId, planId },
    });
    if (!existing) throw new NotFoundException(`BcpRiskScenario ${scenarioId} not found`);

    // Recalculate riskScore if probability/impact changes
    const newProbability = dto.probability ?? existing.probability;
    const newImpact = dto.impact ?? existing.impact;

    if (newProbability < 1 || newProbability > 5) {
      throw new BadRequestException('probability は 1〜5 の範囲で指定してください');
    }
    if (newImpact < 1 || newImpact > 5) {
      throw new BadRequestException('impact は 1〜5 の範囲で指定してください');
    }

    const riskScore = newProbability * newImpact;

    const updated = await this.prisma.bcpRiskScenario.update({
      where: { id: scenarioId },
      data: {
        ...(dto.scenarioType !== undefined ? { scenarioType: dto.scenarioType } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        probability: newProbability,
        impact: newImpact,
        riskScore,
        ...(dto.responseActions !== undefined ? { responseActions: dto.responseActions } : {}),
        ...(dto.responsiblePerson !== undefined
          ? { responsiblePerson: dto.responsiblePerson }
          : {}),
      },
    });

    await this.recordAudit({
      entityType: 'BcpRiskScenario',
      entityId: scenarioId,
      action: 'UPDATE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  // ----------------------------------------------------------------
  // BcpDrillRecord — CRUD
  // ----------------------------------------------------------------

  async createDrillRecord(
    planId: string,
    dto: CreateDrillRecordDto,
    actorId: string,
    organizationId: string,
  ) {
    await this.assertPlanOwnership(planId, organizationId);

    // Duplicate drillNo per plan check
    const duplicate = await this.prisma.bcpDrillRecord.findUnique({
      where: { planId_drillNo: { planId, drillNo: dto.drillNo } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(`訓練番号 ${dto.drillNo} はこの計画に既に登録されています`);
    }

    const drill = await this.prisma.bcpDrillRecord.create({
      data: {
        planId,
        drillNo: dto.drillNo,
        drillType: dto.drillType,
        conductedAt: new Date(dto.conductedAt),
        participantCount: dto.participantCount ?? 0,
        scenario: dto.scenario,
        findings: dto.findings,
        improvements: dto.improvements,
        evaluationScore: dto.evaluationScore,
        nextDrillAt: dto.nextDrillAt ? new Date(dto.nextDrillAt) : undefined,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'BcpDrillRecord',
      entityId: drill.id,
      action: 'CREATE',
      actorId,
      after: drill as unknown as Prisma.InputJsonValue,
    });

    return drill;
  }

  async findDrillsByPlan(planId: string, organizationId: string) {
    await this.assertPlanOwnership(planId, organizationId);

    return this.prisma.bcpDrillRecord.findMany({
      where: { planId },
      orderBy: { conductedAt: 'desc' },
    });
  }

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------

  async getBcpSummary(organizationId: string) {
    const [planCount, scenarioCount, drillCount, upcomingDrills] = await this.prisma.$transaction([
      this.prisma.bcpPlan.count({ where: { organizationId } }),

      this.prisma.bcpRiskScenario.count({
        where: { plan: { organizationId } },
      }),

      this.prisma.bcpDrillRecord.count({
        where: { plan: { organizationId } },
      }),

      // Drills scheduled in the next 90 days
      this.prisma.bcpDrillRecord.findMany({
        where: {
          plan: { organizationId },
          nextDrillAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { nextDrillAt: 'asc' },
        take: 10,
        include: { plan: { select: { id: true, planNo: true, title: true } } },
      }),
    ]);

    return {
      planCount,
      scenarioCount,
      drillCount,
      upcomingDrills,
    };
  }
}
