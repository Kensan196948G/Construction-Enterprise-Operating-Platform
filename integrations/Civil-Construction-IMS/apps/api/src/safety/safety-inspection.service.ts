import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../audit/audit-trail.service';
import {
  CreateSafetyInspectionDto,
  UpdateSafetyInspectionDto,
  QuerySafetyInspectionDto,
} from './dto';
import { SafetyInspectionStatus } from '@prisma/client';

@Injectable()
export class SafetyInspectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  async findAll(query: QuerySafetyInspectionDto, organizationId: string) {
    const { projectId, inspectionType, status, page = 1, limit = 20 } = query;

    // Use direct organizationId for org-scope — includes projectId=null rows
    const where = {
      organizationId,
      ...(projectId ? { projectId } : {}),
      ...(inspectionType ? { inspectionType } : {}),
      ...(status ? { status } : {}),
    };

    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.safetyInspection.findMany({
        where,
        include: {
          inspector: { select: { id: true, displayName: true, email: true } },
          correctiveItems: true,
        },
        orderBy: { inspectedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.safetyInspection.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, organizationId: string) {
    const inspection = await this.prisma.safetyInspection.findFirst({
      where: { id, organizationId },
      include: {
        inspector: { select: { id: true, displayName: true, email: true } },
        correctiveItems: { orderBy: { itemNo: 'asc' } },
      },
    });
    if (!inspection) throw new NotFoundException(`SafetyInspection ${id} not found`);
    return inspection;
  }

  async create(dto: CreateSafetyInspectionDto, actorId: string, organizationId: string) {
    // Duplicate check scoped to organization (not global)
    const existing = await this.prisma.safetyInspection.findFirst({
      where: { organizationId, inspectionNo: dto.inspectionNo },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(`パトロール番号 ${dto.inspectionNo} は既に使用されています`);

    const { checkItems, inspectedAt, ...rest } = dto;
    const inspection = await this.prisma.safetyInspection.create({
      data: {
        ...rest,
        organizationId,
        inspectedAt: new Date(inspectedAt),
        checkItems: checkItems ? (checkItems as object[]) : undefined,
        createdBy: actorId,
      },
    });

    await this.auditTrail.record({
      entityType: 'SafetyInspection',
      entityId: inspection.id,
      action: 'CREATE',
      actorId,
      before: null,
      after: inspection,
      reason: `安全パトロール ${inspection.inspectionNo} 登録`,
    });

    return inspection;
  }

  async update(
    id: string,
    dto: UpdateSafetyInspectionDto,
    actorId: string,
    organizationId: string,
  ) {
    const existing = await this.findOne(id, organizationId);

    const result = await this.prisma.safetyInspection.updateMany({
      where: { id, organizationId },
      data: { ...dto },
    });
    if (result.count === 0) throw new NotFoundException(`SafetyInspection ${id} not found`);

    const updated = await this.prisma.safetyInspection.findUniqueOrThrow({ where: { id } });
    await this.auditTrail.record({
      entityType: 'SafetyInspection',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing,
      after: updated,
      reason: '安全パトロール 更新',
    });
    return updated;
  }

  async close(id: string, actorId: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

    const result = await this.prisma.safetyInspection.updateMany({
      where: { id, organizationId },
      data: { status: SafetyInspectionStatus.CLOSED, closedAt: new Date(), closedBy: actorId },
    });
    if (result.count === 0) throw new NotFoundException(`SafetyInspection ${id} not found`);

    const updated = await this.prisma.safetyInspection.findUniqueOrThrow({ where: { id } });
    await this.auditTrail.record({
      entityType: 'SafetyInspection',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before: existing,
      after: updated,
      reason: '安全パトロール クローズ',
    });
    return updated;
  }

  async remove(id: string, actorId: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

    const result = await this.prisma.safetyInspection.deleteMany({
      where: { id, organizationId },
    });
    if (result.count === 0) throw new NotFoundException(`SafetyInspection ${id} not found`);

    await this.auditTrail.record({
      entityType: 'SafetyInspection',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: existing,
      after: null,
      reason: '安全パトロール 削除',
    });
  }
}
