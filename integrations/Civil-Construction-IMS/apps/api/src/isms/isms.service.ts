import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Severity, RiskLevel, CorrectiveActionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ----------------------------------------------------------------
// Query / DTO interfaces
// ----------------------------------------------------------------

export interface AssetQuery {
  assetType?: string;
  classification?: string;
  page?: number;
  limit?: number;
}

export interface CreateAssetDto {
  assetNo: string;
  name: string;
  assetType: string;
  classification: string;
  owner?: string;
  location?: string;
  sensitivity?: Severity;
}

export interface UpdateAssetDto {
  name?: string;
  assetType?: string;
  classification?: string;
  owner?: string;
  location?: string;
  sensitivity?: Severity;
}

export interface CreateThreatDto {
  threatType: string;
  description: string;
  likelihood: number;
  impact: number;
  existingControls?: string;
}

export interface RiskAssessmentQuery {
  assetId?: string;
  overallRiskLevel?: RiskLevel;
  page?: number;
  limit?: number;
}

export interface CreateRiskAssessmentDto {
  assessmentNo: string;
  assessedAt: Date | string;
  overallRiskLevel: RiskLevel;
  assetId?: string;
  summary?: string;
  treatmentPlan?: string;
}

export interface IncidentQuery {
  incidentType?: string;
  severity?: Severity;
  status?: CorrectiveActionStatus;
  page?: number;
  limit?: number;
}

export interface CreateIncidentDto {
  incidentNo: string;
  incidentType: string;
  occurredAt: Date | string;
  description: string;
  severity?: Severity;
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

// ----------------------------------------------------------------
// IsmsService
// ----------------------------------------------------------------

@Injectable()
export class IsmsService {
  private readonly logger = new Logger(IsmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------

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

  private paginate(page?: number, limit?: number) {
    const take = Math.min(limit ?? 20, 100);
    const skip = ((page ?? 1) - 1) * take;
    return { take, skip };
  }

  // ---------------------------------------------------------------
  // IsmsAsset CRUD
  // ---------------------------------------------------------------

  async findAllAssets(query: AssetQuery, organizationId: string) {
    const { take, skip } = this.paginate(query.page, query.limit);
    const where: Prisma.IsmsAssetWhereInput = { organizationId };

    if (query.assetType) {
      where.assetType = query.assetType;
    }
    if (query.classification) {
      where.classification = query.classification;
    }

    const [data, total] = await Promise.all([
      this.prisma.ismsAsset.findMany({
        where,
        include: { threats: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.ismsAsset.count({ where }),
    ]);

    return { data, total, page: query.page ?? 1, limit: take };
  }

  async findAssetById(id: string, organizationId: string) {
    const asset = await this.prisma.ismsAsset.findFirst({
      where: { id, organizationId },
      include: { threats: true, riskAssessments: true },
    });

    if (!asset) {
      throw new NotFoundException(`IsmsAsset ${id} not found`);
    }

    return asset;
  }

  async createAsset(dto: CreateAssetDto, actorId: string, organizationId: string) {
    // Duplicate assetNo guard (IDOR-safe: scoped to org)
    const existing = await this.prisma.ismsAsset.findFirst({
      where: { organizationId, assetNo: dto.assetNo },
    });

    if (existing) {
      throw new ConflictException(`assetNo "${dto.assetNo}" already exists in this organization`);
    }

    const asset = await this.prisma.ismsAsset.create({
      data: {
        ...dto,
        organizationId,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'IsmsAsset',
      entityId: asset.id,
      action: 'CREATE',
      actorId,
      after: asset as unknown as Prisma.InputJsonValue,
    });

    return asset;
  }

  async updateAsset(id: string, dto: UpdateAssetDto, actorId: string, organizationId: string) {
    // Verify ownership first
    const existing = await this.findAssetById(id, organizationId);

    // Use updateMany to prevent TOCTOU race — filters on both id and organizationId
    const result = await this.prisma.ismsAsset.updateMany({
      where: { id, organizationId },
      data: { ...dto, updatedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException(`IsmsAsset ${id} not found or access denied`);
    }

    const updated = await this.findAssetById(id, organizationId);

    await this.recordAudit({
      entityType: 'IsmsAsset',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  // ---------------------------------------------------------------
  // IsmsThreat CRUD
  // ---------------------------------------------------------------

  async findThreatsByAsset(assetId: string, organizationId: string) {
    // Verify asset ownership (IDOR protection)
    await this.findAssetById(assetId, organizationId);

    return this.prisma.ismsThreat.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createThreat(
    assetId: string,
    dto: CreateThreatDto,
    actorId: string,
    organizationId: string,
  ) {
    // Verify asset ownership
    await this.findAssetById(assetId, organizationId);

    // Auto-compute riskScore = likelihood × impact
    const riskScore = dto.likelihood * dto.impact;

    const threat = await this.prisma.ismsThreat.create({
      data: {
        assetId,
        threatType: dto.threatType,
        description: dto.description,
        likelihood: dto.likelihood,
        impact: dto.impact,
        riskScore,
        existingControls: dto.existingControls,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'IsmsThreat',
      entityId: threat.id,
      action: 'CREATE',
      actorId,
      after: threat as unknown as Prisma.InputJsonValue,
    });

    return threat;
  }

  async closeThreat(threatId: string, assetId: string, actorId: string, organizationId: string) {
    // Verify asset ownership (IDOR protection)
    await this.findAssetById(assetId, organizationId);

    const threat = await this.prisma.ismsThreat.findFirst({
      where: { id: threatId, assetId },
    });

    if (!threat) {
      throw new NotFoundException(`IsmsThreat ${threatId} not found for asset ${assetId}`);
    }

    const updated = await this.prisma.ismsThreat.update({
      where: { id: threatId },
      data: { status: CorrectiveActionStatus.CLOSED },
    });

    await this.recordAudit({
      entityType: 'IsmsThreat',
      entityId: threatId,
      action: 'CLOSE',
      actorId,
      before: threat as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  // ---------------------------------------------------------------
  // IsmsRiskAssessment CRUD
  // ---------------------------------------------------------------

  async findAllRiskAssessments(query: RiskAssessmentQuery, organizationId: string) {
    const { take, skip } = this.paginate(query.page, query.limit);
    const where: Prisma.IsmsRiskAssessmentWhereInput = { organizationId };

    if (query.assetId) {
      where.assetId = query.assetId;
    }
    if (query.overallRiskLevel) {
      where.overallRiskLevel = query.overallRiskLevel;
    }

    const [data, total] = await Promise.all([
      this.prisma.ismsRiskAssessment.findMany({
        where,
        include: { asset: true },
        orderBy: { assessedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.ismsRiskAssessment.count({ where }),
    ]);

    return { data, total, page: query.page ?? 1, limit: take };
  }

  async createRiskAssessment(
    dto: CreateRiskAssessmentDto,
    actorId: string,
    organizationId: string,
  ) {
    // Duplicate assessmentNo guard
    const existing = await this.prisma.ismsRiskAssessment.findFirst({
      where: { organizationId, assessmentNo: dto.assessmentNo },
    });

    if (existing) {
      throw new ConflictException(
        `assessmentNo "${dto.assessmentNo}" already exists in this organization`,
      );
    }

    // Verify asset ownership when assetId is provided
    if (dto.assetId) {
      await this.findAssetById(dto.assetId, organizationId);
    }

    const assessment = await this.prisma.ismsRiskAssessment.create({
      data: {
        assessmentNo: dto.assessmentNo,
        assessedAt: new Date(dto.assessedAt),
        overallRiskLevel: dto.overallRiskLevel,
        assetId: dto.assetId,
        summary: dto.summary,
        treatmentPlan: dto.treatmentPlan,
        organizationId,
        assessedBy: actorId,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'IsmsRiskAssessment',
      entityId: assessment.id,
      action: 'CREATE',
      actorId,
      after: assessment as unknown as Prisma.InputJsonValue,
    });

    return assessment;
  }

  // ---------------------------------------------------------------
  // IsmsIncident CRUD
  // ---------------------------------------------------------------

  async findAllIncidents(query: IncidentQuery, organizationId: string) {
    const { take, skip } = this.paginate(query.page, query.limit);
    const where: Prisma.IsmsIncidentWhereInput = { organizationId };

    if (query.incidentType) {
      where.incidentType = query.incidentType;
    }
    if (query.severity) {
      where.severity = query.severity;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.ismsIncident.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.ismsIncident.count({ where }),
    ]);

    return { data, total, page: query.page ?? 1, limit: take };
  }

  async createIncident(dto: CreateIncidentDto, actorId: string, organizationId: string) {
    // Duplicate incidentNo guard
    const existing = await this.prisma.ismsIncident.findFirst({
      where: { organizationId, incidentNo: dto.incidentNo },
    });

    if (existing) {
      throw new ConflictException(
        `incidentNo "${dto.incidentNo}" already exists in this organization`,
      );
    }

    const incident = await this.prisma.ismsIncident.create({
      data: {
        incidentNo: dto.incidentNo,
        incidentType: dto.incidentType,
        occurredAt: new Date(dto.occurredAt),
        description: dto.description,
        severity: dto.severity ?? Severity.MEDIUM,
        organizationId,
        reportedBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'IsmsIncident',
      entityId: incident.id,
      action: 'CREATE',
      actorId,
      after: incident as unknown as Prisma.InputJsonValue,
    });

    return incident;
  }

  async closeIncident(id: string, actorId: string, organizationId: string) {
    const incident = await this.prisma.ismsIncident.findFirst({
      where: { id, organizationId },
    });

    if (!incident) {
      throw new NotFoundException(`IsmsIncident ${id} not found`);
    }

    // Use updateMany for TOCTOU protection — filters on both id and organizationId
    const result = await this.prisma.ismsIncident.updateMany({
      where: { id, organizationId },
      data: {
        status: CorrectiveActionStatus.CLOSED,
        closedAt: new Date(),
        closedBy: actorId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`IsmsIncident ${id} not found or access denied`);
    }

    const updated = await this.prisma.ismsIncident.findFirst({
      where: { id, organizationId },
    });

    await this.recordAudit({
      entityType: 'IsmsIncident',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before: incident as unknown as Prisma.InputJsonValue,
      after: updated as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }
}
