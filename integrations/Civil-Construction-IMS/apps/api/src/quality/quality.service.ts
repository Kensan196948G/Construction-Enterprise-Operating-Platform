import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  DocumentStatus,
  InspectionResult,
  CorrectiveActionStatus,
  Severity,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQualityPlanDto,
  UpdateQualityPlanDto,
  CreateQualityInspectionDto,
  UpdateQualityInspectionDto,
  CreateNonconformityDto,
  UpdateNonconformityDto,
  RecordInspectionResultDto,
} from './dto';

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

interface ListPlansFilter {
  projectId?: string;
  status?: string;
}

interface ListInspectionsFilter {
  qualityPlanId?: string;
  result?: string;
}

interface ListNonconformitiesFilter {
  projectId?: string;
  qualityPlanId?: string;
  status?: string;
  severity?: string;
}

// ----------------------------------------------------------------
// AuditTrail helper type
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
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Internal audit trail recorder
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
      // Audit failure must not break business operations – log and continue.
      this.logger.error('Failed to write audit trail', err);
    }
  }

  // ----------------------------------------------------------------
  // Quality Plans
  // ----------------------------------------------------------------

  async listPlans(filter: ListPlansFilter) {
    const where: Prisma.QualityPlanWhereInput = {};

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }
    if (filter.status) {
      where.status = filter.status as DocumentStatus;
    }

    return this.prisma.qualityPlan.findMany({
      where,
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: {
          select: { inspections: true, nonconformities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.qualityPlan.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        inspections: {
          orderBy: { createdAt: 'desc' },
        },
        nonconformities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`QualityPlan not found: ${id}`);
    }

    return plan;
  }

  async createPlan(dto: CreateQualityPlanDto, actorId: string) {
    // Generate plan number: QP-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.qualityPlan.count();
    const planNo = `QP-${today}-${String(count + 1).padStart(4, '0')}`;

    const plan = await this.prisma.qualityPlan.create({
      data: {
        planNo,
        projectId: dto.projectId,
        title: dto.title,
        version: 1,
        status: DocumentStatus.DRAFT,
        createdBy: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });

    await this.recordAudit({
      entityType: 'QualityPlan',
      entityId: plan.id,
      action: 'CREATE',
      actorId,
      after: plan as unknown as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdateQualityPlanDto, actorId: string) {
    const existing = await this.getPlan(id);

    if (existing.status === DocumentStatus.APPROVED) {
      throw new BadRequestException('Cannot modify an already approved quality plan');
    }

    const updated = await this.prisma.qualityPlan.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        updatedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });

    await this.recordAudit({
      entityType: 'QualityPlan',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return updated;
  }

  async approvePlan(id: string, actorId: string) {
    const existing = await this.getPlan(id);

    if (
      existing.status !== DocumentStatus.DRAFT &&
      existing.status !== DocumentStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(`Plan cannot be approved from status: ${existing.status}`);
    }

    const approved = await this.prisma.qualityPlan.update({
      where: { id },
      data: {
        status: DocumentStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: actorId,
        updatedAt: new Date(),
      },
    });

    await this.recordAudit({
      entityType: 'QualityPlan',
      entityId: id,
      action: 'APPROVE',
      actorId,
      before: { status: existing.status } as Prisma.InputJsonValue,
      after: { status: approved.status, approvedAt: approved.approvedAt } as Prisma.InputJsonValue,
    });

    return approved;
  }

  async deletePlan(id: string, actorId: string) {
    const existing = await this.getPlan(id);

    if (
      existing.status === DocumentStatus.APPROVED ||
      existing.status === DocumentStatus.PUBLISHED
    ) {
      throw new BadRequestException('Cannot delete an approved or published quality plan');
    }

    await this.prisma.qualityPlan.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'QualityPlan',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
    });
  }

  // ----------------------------------------------------------------
  // Quality Inspections
  // ----------------------------------------------------------------

  async listInspections(filter: ListInspectionsFilter) {
    const where: Prisma.QualityInspectionWhereInput = {};

    if (filter.qualityPlanId) {
      where.qualityPlanId = filter.qualityPlanId;
    }
    if (filter.result) {
      where.result = filter.result as InspectionResult;
    }

    return this.prisma.qualityInspection.findMany({
      where,
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInspection(id: string) {
    const inspection = await this.prisma.qualityInspection.findUnique({
      where: { id },
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
    });

    if (!inspection) {
      throw new NotFoundException(`QualityInspection not found: ${id}`);
    }

    return inspection;
  }

  async createInspection(dto: CreateQualityInspectionDto, actorId: string) {
    // Validate parent plan exists
    const plan = await this.prisma.qualityPlan.findUnique({ where: { id: dto.qualityPlanId } });
    if (!plan) {
      throw new NotFoundException(`QualityPlan not found: ${dto.qualityPlanId}`);
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.qualityInspection.count();
    const inspectionNo = `QI-${today}-${String(count + 1).padStart(4, '0')}`;

    const inspection = await this.prisma.qualityInspection.create({
      data: {
        qualityPlanId: dto.qualityPlanId,
        inspectionNo,
        inspectionType: dto.inspectionType,
        location: dto.location,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        inspectorId: dto.inspectorId,
        remarks: dto.remarks,
        createdBy: actorId,
      },
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
    });

    await this.recordAudit({
      entityType: 'QualityInspection',
      entityId: inspection.id,
      action: 'CREATE',
      actorId,
      after: inspection as unknown as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return inspection;
  }

  async updateInspection(id: string, dto: UpdateQualityInspectionDto, actorId: string) {
    const existing = await this.getInspection(id);

    const updated = await this.prisma.qualityInspection.update({
      where: { id },
      data: {
        inspectionType: dto.inspectionType ?? existing.inspectionType,
        location: dto.location ?? existing.location,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : existing.scheduledAt,
        inspectorId: dto.inspectorId ?? existing.inspectorId,
        remarks: dto.remarks ?? existing.remarks,
        updatedAt: new Date(),
      },
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
    });

    await this.recordAudit({
      entityType: 'QualityInspection',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return updated;
  }

  async recordInspectionResult(id: string, dto: RecordInspectionResultDto, actorId: string) {
    const existing = await this.getInspection(id);

    const updated = await this.prisma.qualityInspection.update({
      where: { id },
      data: {
        result: dto.result as InspectionResult,
        conductedAt: new Date(),
        inspectorId: dto.inspectorId ?? existing.inspectorId,
        remarks: dto.remarks ?? existing.remarks,
        filePath: dto.filePath ?? existing.filePath,
        updatedAt: new Date(),
      },
    });

    await this.recordAudit({
      entityType: 'QualityInspection',
      entityId: id,
      action: 'RECORD_RESULT',
      actorId,
      before: { result: existing.result } as Prisma.InputJsonValue,
      after: { result: updated.result, conductedAt: updated.conductedAt } as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return updated;
  }

  async deleteInspection(id: string, actorId: string) {
    const existing = await this.getInspection(id);

    await this.prisma.qualityInspection.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'QualityInspection',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
    });
  }

  // ----------------------------------------------------------------
  // Nonconformities
  // ----------------------------------------------------------------

  async listNonconformities(filter: ListNonconformitiesFilter) {
    const where: Prisma.NonconformityWhereInput = {};

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }
    if (filter.qualityPlanId) {
      where.qualityPlanId = filter.qualityPlanId;
    }
    if (filter.status) {
      where.status = filter.status as CorrectiveActionStatus;
    }
    if (filter.severity) {
      where.severity = filter.severity as Severity;
    }

    return this.prisma.nonconformity.findMany({
      where,
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNonconformity(id: string) {
    const nc = await this.prisma.nonconformity.findUnique({
      where: { id },
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
    });

    if (!nc) {
      throw new NotFoundException(`Nonconformity not found: ${id}`);
    }

    return nc;
  }

  async createNonconformity(dto: CreateNonconformityDto, actorId: string) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.nonconformity.count();
    const ncNo = `NC-${today}-${String(count + 1).padStart(4, '0')}`;

    const nc = await this.prisma.nonconformity.create({
      data: {
        ncNo,
        qualityPlanId: dto.qualityPlanId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        severity: (dto.severity as Severity) ?? Severity.MEDIUM,
        status: CorrectiveActionStatus.OPEN,
        detectedBy: actorId,
        detectedAt: new Date(),
      },
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
    });

    await this.recordAudit({
      entityType: 'Nonconformity',
      entityId: nc.id,
      action: 'CREATE',
      actorId,
      after: nc as unknown as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return nc;
  }

  async updateNonconformity(id: string, dto: UpdateNonconformityDto, actorId: string) {
    const existing = await this.getNonconformity(id);

    if (
      existing.status === CorrectiveActionStatus.CLOSED ||
      existing.status === CorrectiveActionStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot modify a nonconformity in status: ${existing.status}`);
    }

    const updated = await this.prisma.nonconformity.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        description: dto.description ?? existing.description,
        severity: dto.severity ? (dto.severity as Severity) : existing.severity,
        status: dto.status ? (dto.status as CorrectiveActionStatus) : existing.status,
        caId: dto.caId ?? existing.caId,
        updatedAt: new Date(),
      },
      include: {
        qualityPlan: { select: { id: true, planNo: true, title: true } },
      },
    });

    await this.recordAudit({
      entityType: 'Nonconformity',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
      reason: dto.reason,
    });

    return updated;
  }

  async closeNonconformity(id: string, actorId: string) {
    const existing = await this.getNonconformity(id);

    if (existing.status === CorrectiveActionStatus.CLOSED) {
      throw new BadRequestException('Nonconformity is already closed');
    }

    const closed = await this.prisma.nonconformity.update({
      where: { id },
      data: {
        status: CorrectiveActionStatus.CLOSED,
        updatedAt: new Date(),
      },
    });

    await this.recordAudit({
      entityType: 'Nonconformity',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before: { status: existing.status } as Prisma.InputJsonValue,
      after: { status: closed.status } as Prisma.InputJsonValue,
    });

    return closed;
  }

  async deleteNonconformity(id: string, actorId: string) {
    const existing = await this.getNonconformity(id);

    if (existing.status !== CorrectiveActionStatus.OPEN) {
      throw new BadRequestException('Only OPEN nonconformities can be deleted');
    }

    await this.prisma.nonconformity.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'Nonconformity',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
    });
  }
}
