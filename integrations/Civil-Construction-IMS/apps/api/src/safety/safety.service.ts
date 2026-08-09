import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CorrectiveActionStatus, RiskLevel } from '@prisma/client';
import {
  CreateHazardIdentificationDto,
  UpdateHazardIdentificationDto,
  CreateNearMissDto,
  UpdateNearMissDto,
  CloseNearMissDto,
  CreateSafetyEducationDto,
  UpdateSafetyEducationDto,
  AddParticipantDto,
  HazardFilterDto,
  NearMissFilterDto,
  EducationFilterDto,
} from './dto';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // Private: Audit Trail helper
  // ================================================================

  private async recordAudit(params: {
    entityType: string;
    entityId: string;
    action: string;
    actorId: string;
    before?: unknown;
    after?: unknown;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditTrail.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          actorId: params.actorId,
          before: (params.before as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          after: (params.after as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          reason: params.reason,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(
        `Audit trail write failed [${params.entityType}:${params.entityId} ${params.action}]: ${String(err)}`,
      );
    }
  }

  // ================================================================
  // Hazard Identification
  // ================================================================

  async createHazard(dto: CreateHazardIdentificationDto, actorId: string, organizationId: string) {
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

    const hazard = await this.prisma.hazardIdentification.create({
      data: {
        ...dto,
        organizationId,
        createdBy: actorId,
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    });

    await this.recordAudit({
      entityType: 'HazardIdentification',
      entityId: hazard.id,
      action: 'CREATE',
      actorId,
      after: hazard,
    });

    return hazard;
  }

  async listHazards(filter: HazardFilterDto, organizationId: string) {
    const { projectId, riskLevel, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.HazardIdentificationWhereInput = {
      project: { organizationId },
      ...(projectId ? { projectId } : {}),
      ...(riskLevel ? { riskLevel: riskLevel as RiskLevel } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.hazardIdentification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.hazardIdentification.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getHazard(id: string, organizationId: string) {
    const hazard = await this.prisma.hazardIdentification.findFirst({
      where: { id, project: { organizationId } },
      include: { project: { select: { id: true, name: true, code: true } } },
    });
    if (!hazard) {
      throw new NotFoundException(`HazardIdentification id=${id} not found`);
    }
    return hazard;
  }

  async updateHazard(
    id: string,
    dto: UpdateHazardIdentificationDto,
    actorId: string,
    organizationId: string,
  ) {
    const before = await this.getHazard(id, organizationId);

    const after = await this.prisma.hazardIdentification.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: { project: { select: { id: true, name: true, code: true } } },
    });

    await this.recordAudit({
      entityType: 'HazardIdentification',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
    });

    return after;
  }

  async deleteHazard(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.getHazard(id, organizationId);

    // Soft delete via updatedAt sentinel — schema has no deletedAt on HazardIdentification,
    // so we perform a hard delete but preserve an audit trail.
    await this.prisma.hazardIdentification.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'HazardIdentification',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
    });
  }

  // ================================================================
  // Near Miss
  // ================================================================

  async createNearMiss(dto: CreateNearMissDto, actorId: string, organizationId: string) {
    const nearMiss = await this.prisma.nearMiss.create({
      data: {
        ...dto,
        organizationId,
        reportedBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'NearMiss',
      entityId: nearMiss.id,
      action: 'CREATE',
      actorId,
      after: nearMiss,
    });

    return nearMiss;
  }

  async listNearMisses(filter: NearMissFilterDto, organizationId: string) {
    const { projectId, status, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.NearMissWhereInput = {
      organizationId,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as CorrectiveActionStatus } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.nearMiss.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.nearMiss.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getNearMiss(id: string, organizationId: string) {
    const nearMiss = await this.prisma.nearMiss.findFirst({ where: { id, organizationId } });
    if (!nearMiss) {
      throw new NotFoundException(`NearMiss id=${id} not found`);
    }
    return nearMiss;
  }

  async updateNearMiss(
    id: string,
    dto: UpdateNearMissDto,
    actorId: string,
    organizationId: string,
  ) {
    const before = await this.getNearMiss(id, organizationId);

    const after = await this.prisma.nearMiss.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    await this.recordAudit({
      entityType: 'NearMiss',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
    });

    return after;
  }

  async closeNearMiss(id: string, dto: CloseNearMissDto, actorId: string, organizationId: string) {
    const before = await this.getNearMiss(id, organizationId);

    const after = await this.prisma.nearMiss.update({
      where: { id },
      data: {
        rootCause: dto.rootCause,
        preventiveMeasure: dto.preventiveMeasure,
        status: CorrectiveActionStatus.CLOSED,
        updatedAt: new Date(),
      },
    });

    await this.recordAudit({
      entityType: 'NearMiss',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before,
      after,
      reason: dto.reason,
    });

    return after;
  }

  async deleteNearMiss(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.getNearMiss(id, organizationId);

    await this.prisma.nearMiss.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'NearMiss',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
    });
  }

  // ================================================================
  // Safety Education
  // ================================================================

  async createEducation(dto: CreateSafetyEducationDto, actorId: string, organizationId: string) {
    const education = await this.prisma.safetyEducation.create({
      data: {
        organizationId,
        educationType: dto.educationType,
        title: dto.title,
        projectId: dto.projectId,
        conductedAt: dto.conductedAt,
        instructorId: dto.instructorId,
        durationHours: dto.durationHours,
        createdBy: actorId,
      },
      include: { participants: true },
    });

    await this.recordAudit({
      entityType: 'SafetyEducation',
      entityId: education.id,
      action: 'CREATE',
      actorId,
      after: education,
    });

    return education;
  }

  async listEducations(filter: EducationFilterDto, organizationId: string) {
    const { projectId, educationType, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.SafetyEducationWhereInput = {
      organizationId,
      ...(projectId ? { projectId } : {}),
      ...(educationType ? { educationType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.safetyEducation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { conductedAt: 'desc' },
        include: {
          participants: { select: { userId: true, attendedAt: true, result: true } },
        },
      }),
      this.prisma.safetyEducation.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEducation(id: string, organizationId: string) {
    const education = await this.prisma.safetyEducation.findFirst({
      where: { id, organizationId },
      include: {
        participants: { select: { userId: true, attendedAt: true, result: true } },
      },
    });
    if (!education) {
      throw new NotFoundException(`SafetyEducation id=${id} not found`);
    }
    return education;
  }

  async updateEducation(
    id: string,
    dto: UpdateSafetyEducationDto,
    actorId: string,
    organizationId: string,
  ) {
    const before = await this.getEducation(id, organizationId);

    const after = await this.prisma.safetyEducation.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        participants: { select: { userId: true, attendedAt: true, result: true } },
      },
    });

    await this.recordAudit({
      entityType: 'SafetyEducation',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
    });

    return after;
  }

  async addParticipant(
    educationId: string,
    dto: AddParticipantDto,
    actorId: string,
    organizationId: string,
  ) {
    await this.getEducation(educationId, organizationId); // existence + org scope check

    // Upsert to handle idempotency
    const existing = await this.prisma.safetyEducationParticipant.findUnique({
      where: { educationId_userId: { educationId, userId: dto.userId } },
    });
    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} is already registered for this education session`,
      );
    }

    const participant = await this.prisma.safetyEducationParticipant.create({
      data: {
        educationId,
        userId: dto.userId,
        attendedAt: dto.attendedAt,
        result: dto.result,
      },
    });

    await this.recordAudit({
      entityType: 'SafetyEducationParticipant',
      entityId: participant.id,
      action: 'CREATE',
      actorId,
      after: participant,
    });

    return participant;
  }

  async removeParticipant(
    educationId: string,
    userId: string,
    actorId: string,
    organizationId: string,
  ): Promise<void> {
    await this.getEducation(educationId, organizationId); // org scope check before participant ops

    const participant = await this.prisma.safetyEducationParticipant.findUnique({
      where: { educationId_userId: { educationId, userId } },
    });
    if (!participant) {
      throw new NotFoundException(
        `Participant userId=${userId} not found in education ${educationId}`,
      );
    }

    await this.prisma.safetyEducationParticipant.delete({
      where: { educationId_userId: { educationId, userId } },
    });

    await this.recordAudit({
      entityType: 'SafetyEducationParticipant',
      entityId: participant.id,
      action: 'DELETE',
      actorId,
      before: participant,
    });
  }

  async deleteEducation(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.getEducation(id, organizationId);

    // Remove participants first (cascade not defined in schema)
    await this.prisma.safetyEducationParticipant.deleteMany({
      where: { educationId: id },
    });
    await this.prisma.safetyEducation.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'SafetyEducation',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
    });
  }

  // ================================================================
  // Dashboard
  // ================================================================

  async getDashboard(organizationId: string, projectId?: string) {
    const hazardWhere: Prisma.HazardIdentificationWhereInput = {
      project: { organizationId },
      ...(projectId ? { projectId } : {}),
    };
    const nearMissWhere: Prisma.NearMissWhereInput = {
      organizationId,
      ...(projectId ? { projectId } : {}),
    };
    const educationWhere: Prisma.SafetyEducationWhereInput = projectId ? { projectId } : {};

    const [
      totalHazards,
      criticalHazards,
      openNearMisses,
      closedNearMisses,
      educationCount,
      recentNearMisses,
    ] = await this.prisma.$transaction([
      this.prisma.hazardIdentification.count({ where: hazardWhere }),
      this.prisma.hazardIdentification.count({
        where: { ...hazardWhere, riskLevel: RiskLevel.CRITICAL },
      }),
      this.prisma.nearMiss.count({
        where: { ...nearMissWhere, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.nearMiss.count({
        where: { ...nearMissWhere, status: CorrectiveActionStatus.CLOSED },
      }),
      this.prisma.safetyEducation.count({ where: educationWhere }),
      this.prisma.nearMiss.findMany({
        where: nearMissWhere,
        orderBy: { occurredAt: 'desc' },
        take: 5,
        select: {
          id: true,
          reportNo: true,
          description: true,
          potentialSeverity: true,
          status: true,
          occurredAt: true,
        },
      }),
    ]);

    return {
      hazards: {
        total: totalHazards,
        critical: criticalHazards,
      },
      nearMisses: {
        open: openNearMisses,
        closed: closedNearMisses,
        total: openNearMisses + closedNearMisses,
        closureRate:
          openNearMisses + closedNearMisses > 0
            ? Math.round((closedNearMisses / (openNearMisses + closedNearMisses)) * 100)
            : 0,
        recent: recentNearMisses,
      },
      education: {
        total: educationCount,
      },
    };
  }
}
