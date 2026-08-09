import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, InspectionResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAssetDto {
  assetNo: string;
  name: string;
  assetType: string;
  category?: string;
  location?: string;
  installDate?: string;
  manufacturer?: string;
  model?: string;
  serialNo?: string;
  replacementYear?: number;
  lcCost?: number;
  bimLinkId?: string;
}

export interface UpdateAssetDto {
  name?: string;
  assetType?: string;
  category?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNo?: string;
  status?: string;
  currentCondition?: string;
  replacementYear?: number;
  bimLinkId?: string;
}

export interface CreateMaintenancePlanDto {
  assetId: string;
  title: string;
  maintenanceType: string;
  intervalDays?: number;
  nextDueDate?: string;
  estimatedCost?: number;
}

export interface UpdateMaintenancePlanDto {
  title?: string;
  maintenanceType?: string;
  intervalDays?: number;
  nextDueDate?: string;
  estimatedCost?: number;
  status?: string;
}

export interface CreateAssetInspectionDto {
  assetId: string;
  inspectionNo: string;
  conductedAt: string;
  inspectorId?: string;
  result: string;
  findings?: string;
  nextInspectionDate?: string;
  filePath?: string;
}

export interface UpdateAssetInspectionDto {
  conductedAt?: string;
  inspectorId?: string;
  result?: string;
  findings?: string;
  nextInspectionDate?: string;
  filePath?: string;
}

export interface ListAssetsFilter {
  status?: string;
  category?: string;
  assetType?: string;
  criticality?: string;
}

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Asset CRUD
  // ----------------------------------------------------------------

  async findAll(filter: ListAssetsFilter = {}, organizationId: string) {
    const where: Prisma.AssetWhereInput = { organizationId };

    if (filter.status) {
      where.status = filter.status as Prisma.EnumAssetStatusFilter;
    }
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.assetType) {
      where.assetType = filter.assetType;
    }
    if (filter.criticality) {
      where.criticality = filter.criticality as any;
    }

    return this.prisma.asset.findMany({
      where,
      include: {
        _count: {
          select: {
            maintenancePlans: true,
            inspections: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId },
      include: {
        maintenancePlans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        inspections: {
          orderBy: { conductedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset not found: ${id}`);
    }

    return asset;
  }

  async create(dto: CreateAssetDto, actorId: string, organizationId: string) {
    const asset = await this.prisma.asset.create({
      data: {
        organizationId,
        assetNo: dto.assetNo,
        name: dto.name,
        assetType: dto.assetType,
        category: dto.category,
        location: dto.location,
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNo: dto.serialNo,
        replacementYear: dto.replacementYear,
        lcCost: dto.lcCost,
        bimLinkId: dto.bimLinkId,
        createdBy: actorId,
      },
    });

    await this.recordAudit('Asset', asset.id, 'CREATE', actorId, null, asset);

    return asset;
  }

  async update(id: string, dto: UpdateAssetDto, actorId: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        assetType: dto.assetType ?? existing.assetType,
        category: dto.category ?? existing.category,
        location: dto.location ?? existing.location,
        manufacturer: dto.manufacturer ?? existing.manufacturer,
        model: dto.model ?? existing.model,
        serialNo: dto.serialNo ?? existing.serialNo,
        replacementYear: dto.replacementYear ?? existing.replacementYear,
        bimLinkId: dto.bimLinkId ?? existing.bimLinkId,
        updatedAt: new Date(),
      },
    });

    await this.recordAudit('Asset', id, 'UPDATE', actorId, existing, updated);

    return updated;
  }

  async delete(id: string, actorId: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    await this.prisma.asset.delete({ where: { id } });

    await this.recordAudit('Asset', id, 'DELETE', actorId, existing, null);
  }

  // ----------------------------------------------------------------
  // AssetMaintenancePlan CRUD
  // ----------------------------------------------------------------

  async findAllMaintenancePlans(assetId?: string) {
    const where: Prisma.AssetMaintenancePlanWhereInput = assetId ? { assetId } : {};

    return this.prisma.assetMaintenancePlan.findMany({
      where,
      include: {
        asset: { select: { id: true, assetNo: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMaintenancePlanById(id: string, organizationId: string) {
    const plan = await this.prisma.assetMaintenancePlan.findFirst({
      where: { id, asset: { organizationId } },
      include: {
        asset: { select: { id: true, assetNo: true, name: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`AssetMaintenancePlan not found: ${id}`);
    }

    return plan;
  }

  async createMaintenancePlan(
    dto: CreateMaintenancePlanDto,
    actorId: string,
    organizationId: string,
  ) {
    await this.findById(dto.assetId, organizationId);

    const plan = await this.prisma.assetMaintenancePlan.create({
      data: {
        assetId: dto.assetId,
        title: dto.title,
        maintenanceType: dto.maintenanceType,
        intervalDays: dto.intervalDays,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
        estimatedCost: dto.estimatedCost,
        createdBy: actorId,
      },
      include: {
        asset: { select: { id: true, assetNo: true, name: true } },
      },
    });

    await this.recordAudit('AssetMaintenancePlan', plan.id, 'CREATE', actorId, null, plan);

    return plan;
  }

  async updateMaintenancePlan(
    id: string,
    dto: UpdateMaintenancePlanDto,
    actorId: string,
    organizationId: string,
  ) {
    const existing = await this.findMaintenancePlanById(id, organizationId);

    const updated = await this.prisma.assetMaintenancePlan.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        maintenanceType: dto.maintenanceType ?? existing.maintenanceType,
        intervalDays: dto.intervalDays ?? existing.intervalDays,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : existing.nextDueDate,
        estimatedCost:
          dto.estimatedCost !== undefined
            ? dto.estimatedCost
            : (existing.estimatedCost as unknown as number | undefined),
        updatedAt: new Date(),
      },
    });

    await this.recordAudit('AssetMaintenancePlan', id, 'UPDATE', actorId, existing, updated);

    return updated;
  }

  async deleteMaintenancePlan(id: string, actorId: string, organizationId: string) {
    const existing = await this.findMaintenancePlanById(id, organizationId);

    await this.prisma.assetMaintenancePlan.delete({ where: { id } });

    await this.recordAudit('AssetMaintenancePlan', id, 'DELETE', actorId, existing, null);
  }

  // ----------------------------------------------------------------
  // AssetInspection CRUD
  // ----------------------------------------------------------------

  async findAllInspections(assetId?: string) {
    const where: Prisma.AssetInspectionWhereInput = assetId ? { assetId } : {};

    return this.prisma.assetInspection.findMany({
      where,
      include: {
        asset: { select: { id: true, assetNo: true, name: true } },
      },
      orderBy: { conductedAt: 'desc' },
    });
  }

  async findInspectionById(id: string, organizationId: string) {
    const inspection = await this.prisma.assetInspection.findFirst({
      where: { id, asset: { organizationId } },
      include: {
        asset: { select: { id: true, assetNo: true, name: true } },
      },
    });

    if (!inspection) {
      throw new NotFoundException(`AssetInspection not found: ${id}`);
    }

    return inspection;
  }

  async createInspection(dto: CreateAssetInspectionDto, actorId: string, organizationId: string) {
    await this.findById(dto.assetId, organizationId);

    if (!Object.values(InspectionResult).includes(dto.result as InspectionResult)) {
      throw new Error(
        `Invalid InspectionResult: ${dto.result}. Valid values: ${Object.values(InspectionResult).join(', ')}`,
      );
    }

    const inspection = await this.prisma.assetInspection.create({
      data: {
        assetId: dto.assetId,
        inspectionNo: dto.inspectionNo,
        conductedAt: new Date(dto.conductedAt),
        inspectorId: dto.inspectorId,
        result: dto.result as InspectionResult,
        findings: dto.findings,
        nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : undefined,
        filePath: dto.filePath,
        createdBy: actorId,
      },
      include: {
        asset: { select: { id: true, assetNo: true, name: true } },
      },
    });

    await this.recordAudit('AssetInspection', inspection.id, 'CREATE', actorId, null, inspection);

    return inspection;
  }

  async updateInspection(
    id: string,
    dto: UpdateAssetInspectionDto,
    actorId: string,
    organizationId: string,
  ) {
    const existing = await this.findInspectionById(id, organizationId);

    const updated = await this.prisma.assetInspection.update({
      where: { id },
      data: {
        conductedAt: dto.conductedAt ? new Date(dto.conductedAt) : existing.conductedAt,
        inspectorId: dto.inspectorId ?? existing.inspectorId,
        result: dto.result ? (dto.result as InspectionResult) : existing.result,
        findings: dto.findings ?? existing.findings,
        nextInspectionDate: dto.nextInspectionDate
          ? new Date(dto.nextInspectionDate)
          : existing.nextInspectionDate,
        filePath: dto.filePath ?? existing.filePath,
        updatedAt: new Date(),
      },
    });

    await this.recordAudit('AssetInspection', id, 'UPDATE', actorId, existing, updated);

    return updated;
  }

  async deleteInspection(id: string, actorId: string, organizationId: string) {
    const existing = await this.findInspectionById(id, organizationId);

    await this.prisma.assetInspection.delete({ where: { id } });

    await this.recordAudit('AssetInspection', id, 'DELETE', actorId, existing, null);
  }

  // ----------------------------------------------------------------
  // AssetRiskAssessment (ISO 55001 §4.2)
  // ----------------------------------------------------------------

  async findRiskAssessments(assetId: string, organizationId: string) {
    const asset = await this.findById(assetId, organizationId);
    return this.prisma.assetRiskAssessment.findMany({
      where: { assetId: asset.id },
      orderBy: { assessedAt: 'desc' },
    });
  }

  async createRiskAssessment(assetId: string, dto: any, actorId: string, organizationId: string) {
    const asset = await this.findById(assetId, organizationId);

    const riskScore = (dto.failureProbability ?? 3) * (dto.consequenceSeverity ?? 3);
    const riskLevel =
      riskScore >= 20 ? 'CRITICAL' : riskScore >= 12 ? 'HIGH' : riskScore >= 6 ? 'MEDIUM' : 'LOW';

    const assessment = await this.prisma.assetRiskAssessment.create({
      data: {
        assetId: asset.id,
        assessedAt: dto.assessedAt ? new Date(dto.assessedAt) : new Date(),
        assessedBy: actorId,
        failureProbability: dto.failureProbability ?? 3,
        consequenceSeverity: dto.consequenceSeverity ?? 3,
        riskScore,
        riskLevel: riskLevel as any,
        mitigationPlan: dto.mitigationPlan,
        nextAssessmentAt: dto.nextAssessmentAt ? new Date(dto.nextAssessmentAt) : undefined,
        notes: dto.notes,
        createdBy: actorId,
      },
    });

    // Update asset criticality based on risk score
    const newCriticality =
      riskScore >= 20 ? 'CRITICAL' : riskScore >= 12 ? 'HIGH' : riskScore >= 6 ? 'MEDIUM' : 'LOW';

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { criticality: newCriticality as any },
    });

    await this.recordAudit(
      'AssetRiskAssessment',
      assessment.id,
      'CREATE',
      actorId,
      null,
      assessment,
    );
    return assessment;
  }

  // ----------------------------------------------------------------
  // AssetDisposal (ISO 55001 §6.2)
  // ----------------------------------------------------------------

  async findDisposals(assetId: string, organizationId: string) {
    const asset = await this.findById(assetId, organizationId);
    return this.prisma.assetDisposal.findMany({
      where: { assetId: asset.id },
      orderBy: { disposalDate: 'desc' },
    });
  }

  async createDisposal(assetId: string, dto: any, actorId: string, organizationId: string) {
    const asset = await this.findById(assetId, organizationId);

    // Never accept approvedBy/approvedAt from client — approval must go through approveDisposal()
    const disposal = await this.prisma.assetDisposal.create({
      data: {
        assetId: asset.id,
        disposalNo: dto.disposalNo,
        disposalType: dto.disposalType,
        disposalDate: new Date(dto.disposalDate),
        reason: dto.reason,
        disposalValue: dto.disposalValue,
        contractor: dto.contractor,
        environmentalNote: dto.environmentalNote,
        // approvedBy and approvedAt intentionally omitted — set via approveDisposal()
        createdBy: actorId,
      },
    });

    // Status set to DISPOSED only after approval — not at creation
    await this.recordAudit('AssetDisposal', disposal.id, 'CREATE', actorId, null, disposal);
    return disposal;
  }

  async approveDisposal(
    assetId: string,
    disposalId: string,
    actorId: string,
    organizationId: string,
  ) {
    await this.findById(assetId, organizationId);

    const existing = await this.prisma.assetDisposal.findFirst({
      where: { id: disposalId, assetId },
    });
    if (!existing) throw new NotFoundException(`AssetDisposal ${disposalId} not found`);
    if (existing.approvedAt) throw new Error('既に承認済みです');

    const updated = await this.prisma.assetDisposal.update({
      where: { id: disposalId },
      data: { approvedBy: actorId, approvedAt: new Date() },
    });

    // Only after approval does the asset status change to DISPOSED
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: 'DISPOSED' },
    });

    await this.recordAudit('AssetDisposal', disposalId, 'APPROVE', actorId, existing, updated);
    return updated;
  }

  // ----------------------------------------------------------------
  // AssetHandover (ISO 55001)
  // ----------------------------------------------------------------

  async findHandovers(assetId: string, organizationId: string) {
    const asset = await this.findById(assetId, organizationId);
    return this.prisma.assetHandover.findMany({
      where: { assetId: asset.id },
      orderBy: { handoverDate: 'desc' },
    });
  }

  async createHandover(assetId: string, dto: any, actorId: string, organizationId: string) {
    const asset = await this.findById(assetId, organizationId);

    const handover = await this.prisma.assetHandover.create({
      data: {
        assetId: asset.id,
        handoverNo: dto.handoverNo,
        handoverDate: new Date(dto.handoverDate),
        handoverFrom: dto.handoverFrom,
        handoverTo: dto.handoverTo,
        handoverType: dto.handoverType,
        status: 'NOT_INITIATED',
        conditionAtHandover: dto.conditionAtHandover,
        notes: dto.notes,
        createdBy: actorId,
      },
    });

    await this.recordAudit('AssetHandover', handover.id, 'CREATE', actorId, null, handover);
    return handover;
  }

  async completeHandover(
    assetId: string,
    handoverId: string,
    actorId: string,
    organizationId: string,
  ) {
    await this.findById(assetId, organizationId);

    const existing = await this.prisma.assetHandover.findFirst({
      where: { id: handoverId, assetId },
    });
    if (!existing) throw new NotFoundException(`AssetHandover ${handoverId} not found`);

    const result = await this.prisma.assetHandover.updateMany({
      where: { id: handoverId, assetId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`AssetHandover ${handoverId} not found`);

    const updated = await this.prisma.assetHandover.findUniqueOrThrow({
      where: { id: handoverId },
    });
    await this.recordAudit('AssetHandover', handoverId, 'COMPLETE', actorId, existing, updated);
    return updated;
  }

  // ----------------------------------------------------------------
  // Summary / KPI (ISO 55001)
  // ----------------------------------------------------------------

  async getOrgAssetSummary(organizationId: string) {
    const [
      totalAssets,
      activeAssets,
      criticalAssets,
      poorConditionAssets,
      maintenanceDue,
      pendingHandovers,
    ] = await this.prisma.$transaction([
      this.prisma.asset.count({ where: { organizationId } }),
      this.prisma.asset.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.asset.count({ where: { organizationId, criticality: 'CRITICAL' } }),
      this.prisma.asset.count({
        where: { organizationId, currentCondition: { in: ['POOR', 'CRITICAL'] } },
      }),
      this.prisma.assetMaintenancePlan.count({
        where: {
          asset: { organizationId },
          status: 'ACTIVE',
          nextDueDate: { lte: new Date() },
        },
      }),
      this.prisma.assetHandover.count({
        where: {
          asset: { organizationId },
          status: { not: 'COMPLETED' },
        },
      }),
    ]);

    return {
      totalAssets,
      activeAssets,
      criticalAssets,
      poorConditionAssets,
      maintenanceDue,
      pendingHandovers,
    };
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
