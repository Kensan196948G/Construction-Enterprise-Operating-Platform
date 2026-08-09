import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../audit/audit-trail.service';
import {
  CreateEnvironmentalAspectDto,
  UpdateEnvironmentalAspectDto,
  CreateLegalRequirementDto,
  UpdateLegalRequirementDto,
  CreateWasteRecordDto,
  UpdateWasteRecordDto,
  EnvironmentalAspectQueryDto,
  LegalRequirementQueryDto,
  WasteRecordQueryDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EnvironmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Environmental Aspects (環境側面)
  // ──────────────────────────────────────────────────────────

  async findAllAspects(query: EnvironmentalAspectQueryDto, organizationId: string) {
    const where: Prisma.EnvironmentalAspectWhereInput = {
      project: { organizationId },
    };
    if (query.projectId) where.projectId = query.projectId;
    if (query.significance) where.significance = query.significance;

    return this.prisma.environmentalAspect.findMany({
      where,
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAspect(id: string, organizationId: string) {
    const aspect = await this.prisma.environmentalAspect.findFirst({
      where: { id, project: { organizationId } },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    if (!aspect) {
      throw new NotFoundException(`EnvironmentalAspect id=${id} not found`);
    }
    return aspect;
  }

  async createAspect(dto: CreateEnvironmentalAspectDto, actorId: string, organizationId: string) {
    // Verify the target project belongs to the caller's organization
    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, organizationId },
        select: { id: true },
      });
      if (!project) {
        throw new NotFoundException(`Project id=${dto.projectId} not found in organization`);
      }
    }

    const aspect = await this.prisma.environmentalAspect.create({
      data: { ...dto, createdBy: actorId },
    });

    await this.auditTrail.record({
      entityType: 'EnvironmentalAspect',
      entityId: aspect.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: aspect,
      reason: 'ISO 14001 環境側面登録',
    });

    return aspect;
  }

  async updateAspect(
    id: string,
    dto: UpdateEnvironmentalAspectDto,
    actorId: string,
    organizationId: string,
  ) {
    const before = await this.findOneAspect(id, organizationId);

    const after = await this.prisma.environmentalAspect.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    await this.auditTrail.record({
      entityType: 'EnvironmentalAspect',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
      reason: dto.reason ?? 'ISO 14001 環境側面更新',
    });

    return after;
  }

  async removeAspect(id: string, actorId: string, organizationId: string) {
    const before = await this.findOneAspect(id, organizationId);

    await this.prisma.environmentalAspect.delete({ where: { id } });

    await this.auditTrail.record({
      entityType: 'EnvironmentalAspect',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
      after: null,
      reason: 'ISO 14001 環境側面削除',
    });
  }

  // ──────────────────────────────────────────────────────────
  // Legal Requirements (法規制要求事項)
  // ──────────────────────────────────────────────────────────

  async findAllLegalRequirements(query: LegalRequirementQueryDto, organizationId: string) {
    const where: Prisma.LegalRequirementWhereInput = { organizationId };
    if (query.complianceStatus) where.complianceStatus = query.complianceStatus;

    return this.prisma.legalRequirement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLegalRequirement(id: string, organizationId: string) {
    const req = await this.prisma.legalRequirement.findFirst({ where: { id, organizationId } });
    if (!req) {
      throw new NotFoundException(`LegalRequirement id=${id} not found`);
    }
    return req;
  }

  async createLegalRequirement(
    dto: CreateLegalRequirementDto,
    actorId: string,
    organizationId: string,
  ) {
    const record = await this.prisma.legalRequirement.create({
      data: { ...dto, organizationId, createdBy: actorId },
    });

    await this.auditTrail.record({
      entityType: 'LegalRequirement',
      entityId: record.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: record,
      reason: 'ISO 14001 法規制要求事項登録',
    });

    return record;
  }

  async updateLegalRequirement(
    id: string,
    dto: UpdateLegalRequirementDto,
    actorId: string,
    organizationId: string,
  ) {
    const before = await this.findOneLegalRequirement(id, organizationId);

    const after = await this.prisma.legalRequirement.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    await this.auditTrail.record({
      entityType: 'LegalRequirement',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
      reason: dto.reason ?? 'ISO 14001 法規制要求事項更新',
    });

    return after;
  }

  async removeLegalRequirement(id: string, actorId: string, organizationId: string) {
    const before = await this.findOneLegalRequirement(id, organizationId);

    await this.prisma.legalRequirement.delete({ where: { id } });

    await this.auditTrail.record({
      entityType: 'LegalRequirement',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
      after: null,
      reason: 'ISO 14001 法規制要求事項削除',
    });
  }

  // ──────────────────────────────────────────────────────────
  // Waste Records (廃棄物管理記録)
  // ──────────────────────────────────────────────────────────

  async findAllWasteRecords(query: WasteRecordQueryDto, organizationId: string) {
    const where: Prisma.WasteRecordWhereInput = { organizationId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.wasteType) where.wasteType = query.wasteType;

    return this.prisma.wasteRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneWasteRecord(id: string, organizationId: string) {
    const record = await this.prisma.wasteRecord.findFirst({ where: { id, organizationId } });
    if (!record) {
      throw new NotFoundException(`WasteRecord id=${id} not found`);
    }
    return record;
  }

  async createWasteRecord(dto: CreateWasteRecordDto, actorId: string, organizationId: string) {
    if (dto.projectId) {
      const proj = await this.prisma.project.findFirst({
        where: { id: dto.projectId, organizationId },
      });
      if (!proj) {
        throw new BadRequestException(
          `Project id=${dto.projectId} does not belong to the organization`,
        );
      }
    }

    const record = await this.prisma.wasteRecord.create({
      data: { ...dto, organizationId, createdBy: actorId },
    });

    await this.auditTrail.record({
      entityType: 'WasteRecord',
      entityId: record.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: record,
      reason: 'ISO 14001 廃棄物記録登録',
    });

    return record;
  }

  async updateWasteRecord(
    id: string,
    dto: UpdateWasteRecordDto,
    actorId: string,
    organizationId: string,
  ) {
    const before = await this.findOneWasteRecord(id, organizationId);

    const after = await this.prisma.wasteRecord.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    await this.auditTrail.record({
      entityType: 'WasteRecord',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
      reason: dto.reason ?? 'ISO 14001 廃棄物記録更新',
    });

    return after;
  }

  async removeWasteRecord(id: string, actorId: string, organizationId: string) {
    const before = await this.findOneWasteRecord(id, organizationId);

    await this.prisma.wasteRecord.delete({ where: { id } });

    await this.auditTrail.record({
      entityType: 'WasteRecord',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
      after: null,
      reason: 'ISO 14001 廃棄物記録削除',
    });
  }
}
