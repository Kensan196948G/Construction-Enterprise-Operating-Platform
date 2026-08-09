import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ToolboxTalkService {
  private readonly logger = new Logger(ToolboxTalkService.name);

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
        },
      });
    } catch (err) {
      this.logger.error(
        `Audit trail write failed [${params.entityType}:${params.entityId} ${params.action}]: ${String(err)}`,
      );
    }
  }

  // ================================================================
  // ToolboxTalk CRUD
  // ================================================================

  async findAll(query: any, organizationId: string) {
    const { projectId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.ToolboxTalkWhereInput = {
      organizationId,
      ...(projectId ? { projectId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.toolboxTalk.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { conductedAt: 'desc' },
        include: {
          participants: { select: { id: true, userId: true, signedAt: true } },
        },
      }),
      this.prisma.toolboxTalk.count({ where }),
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

  async findOne(id: string, organizationId: string) {
    const talk = await this.prisma.toolboxTalk.findFirst({
      where: { id, organizationId },
      include: {
        participants: { select: { id: true, userId: true, signedAt: true } },
      },
    });
    if (!talk) {
      throw new NotFoundException(`ToolboxTalk id=${id} not found`);
    }
    return talk;
  }

  async create(dto: any, actorId: string, organizationId: string) {
    // Duplicate check scoped to organization (not global unique)
    const existing = await this.prisma.toolboxTalk.findFirst({
      where: { organizationId, talkNo: dto.talkNo },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`KY活動番号 "${dto.talkNo}" は既に使用されています`);
    }

    const talk = await this.prisma.toolboxTalk.create({
      data: {
        ...dto,
        organizationId,
        conductedAt: new Date(dto.conductedAt),
        createdBy: actorId,
      },
      include: {
        participants: { select: { id: true, userId: true, signedAt: true } },
      },
    });

    await this.recordAudit({
      entityType: 'ToolboxTalk',
      entityId: talk.id,
      action: 'CREATE',
      actorId,
      after: talk,
    });

    return talk;
  }

  async update(id: string, dto: any, actorId: string, orgId: string) {
    const before = await this.findOne(id, orgId);

    // Use updateMany for TOCTOU safety (atomically verifies org ownership)
    const result = await this.prisma.toolboxTalk.updateMany({
      where: { id, organizationId: orgId },
      data: {
        ...dto,
        ...(dto.conductedAt ? { conductedAt: new Date(dto.conductedAt) } : {}),
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`ToolboxTalk id=${id} not found`);
    }

    const after = await this.findOne(id, orgId);

    await this.recordAudit({
      entityType: 'ToolboxTalk',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before,
      after,
    });

    return after;
  }

  async remove(id: string, actorId: string, orgId: string): Promise<void> {
    const before = await this.findOne(id, orgId);

    // deleteMany for TOCTOU safety
    const result = await this.prisma.toolboxTalk.deleteMany({
      where: { id, organizationId: orgId },
    });

    if (result.count === 0) {
      throw new NotFoundException(`ToolboxTalk id=${id} not found`);
    }

    await this.recordAudit({
      entityType: 'ToolboxTalk',
      entityId: id,
      action: 'DELETE',
      actorId,
      before,
    });
  }

  // ================================================================
  // Participant management
  // ================================================================

  async addParticipant(
    talkId: string,
    dto: { userId: string; signedAt?: string },
    actorId: string,
    orgId: string,
  ) {
    // Verify talk ownership via findOne (throws NotFoundException if not found)
    await this.findOne(talkId, orgId);

    const participant = await this.prisma.$transaction(async (tx) => {
      // Upsert participant
      const p = await tx.toolboxTalkParticipant.upsert({
        where: { talkId_userId: { talkId, userId: dto.userId } },
        create: {
          talkId,
          userId: dto.userId,
          signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        },
        update: {
          signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        },
      });

      // Increment participantCount atomically
      await tx.toolboxTalk.updateMany({
        where: { id: talkId, organizationId: orgId },
        data: { participantCount: { increment: 1 } },
      });

      return p;
    });

    await this.recordAudit({
      entityType: 'ToolboxTalkParticipant',
      entityId: participant.id,
      action: 'CREATE',
      actorId,
      after: participant,
    });

    return participant;
  }

  async removeParticipant(
    talkId: string,
    userId: string,
    actorId: string,
    orgId: string,
  ): Promise<void> {
    // Verify talk ownership
    await this.findOne(talkId, orgId);

    const participant = await this.prisma.toolboxTalkParticipant.findUnique({
      where: { talkId_userId: { talkId, userId } },
    });
    if (!participant) {
      throw new NotFoundException(
        `Participant userId=${userId} not found in ToolboxTalk ${talkId}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.toolboxTalkParticipant.delete({
        where: { talkId_userId: { talkId, userId } },
      }),
      this.prisma.toolboxTalk.updateMany({
        where: { id: talkId, organizationId: orgId },
        data: { participantCount: { decrement: 1 } },
      }),
    ]);

    await this.recordAudit({
      entityType: 'ToolboxTalkParticipant',
      entityId: participant.id,
      action: 'DELETE',
      actorId,
      before: participant,
    });
  }
}
