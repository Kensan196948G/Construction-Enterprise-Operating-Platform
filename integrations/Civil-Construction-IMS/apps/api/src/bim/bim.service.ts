import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BimEir,
  BimBep,
  BimInformationContainer,
  CdeStatus,
  DocumentStatus,
  SuitabilityCode,
  CorrectiveActionStatus,
  Severity,
  Prisma,
} from '@prisma/client';
import {
  CreateEirDto,
  UpdateEirDto,
  CreateBepDto,
  UpdateBepDto,
  CreateContainerDto,
  UpdateContainerDto,
  UpdateCdeStatusDto,
  BimQueryDto,
} from './dto';

/** CDE ステータス遷移の許容マップ (ISO 19650 Table 1) */
const CDE_ALLOWED_TRANSITIONS: Record<CdeStatus, CdeStatus[]> = {
  [CdeStatus.WORK_IN_PROGRESS]: [CdeStatus.SHARED],
  [CdeStatus.SHARED]: [CdeStatus.PUBLISHED, CdeStatus.WORK_IN_PROGRESS],
  [CdeStatus.PUBLISHED]: [CdeStatus.ARCHIVED],
  [CdeStatus.ARCHIVED]: [],
};

/** 監査証跡記録用ヘルパー型 */
interface AuditContext {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class BimService {
  private readonly logger = new Logger(BimService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // EIR (Exchange Information Requirements)
  // ================================================================

  async createEir(dto: CreateEirDto, actorId: string, organizationId: string): Promise<BimEir> {
    const eir = await this.prisma.bimEir.create({
      data: {
        organizationId,
        title: dto.title,
        requirements: (dto.requirements as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        status: DocumentStatus.DRAFT,
        createdBy: actorId,
        ...(dto.projectId ? { projectId: dto.projectId } : {}),
      },
    });

    await this.recordAudit({
      entityType: 'BimEir',
      entityId: eir.id,
      action: 'CREATE',
      actorId,
      after: eir as unknown as Record<string, unknown>,
    });

    this.logger.log(`EIR created: ${eir.id} by ${actorId}`);
    return eir;
  }

  async findAllEirs(
    query: BimQueryDto,
    organizationId: string,
  ): Promise<{
    data: BimEir[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { projectId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BimEirWhereInput = {
      organizationId,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bimEir.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bimEir.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findEirById(id: string, organizationId: string): Promise<BimEir> {
    const eir = await this.prisma.bimEir.findFirst({ where: { id, organizationId } });
    if (!eir) {
      throw new NotFoundException(`EIR (id=${id}) が見つかりません`);
    }
    return eir;
  }

  async updateEir(
    id: string,
    dto: UpdateEirDto,
    actorId: string,
    organizationId: string,
  ): Promise<BimEir> {
    const before = await this.findEirById(id, organizationId);

    const updated = await this.prisma.bimEir.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.requirements !== undefined
          ? { requirements: dto.requirements as Prisma.InputJsonValue }
          : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        version: { increment: 1 },
      },
    });

    await this.recordAudit({
      entityType: 'BimEir',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    this.logger.log(`EIR updated: ${id} by ${actorId}`);
    return updated;
  }

  async deleteEir(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.findEirById(id, organizationId);

    await this.prisma.bimEir.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'BimEir',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: before as unknown as Record<string, unknown>,
    });

    this.logger.log(`EIR deleted: ${id} by ${actorId}`);
  }

  // ================================================================
  // BEP (BIM Execution Plan)
  // ================================================================

  async createBep(dto: CreateBepDto, actorId: string, organizationId: string): Promise<BimBep> {
    const bep = await this.prisma.bimBep.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        namingConvention: dto.namingConvention,
        status: DocumentStatus.DRAFT,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'BimBep',
      entityId: bep.id,
      action: 'CREATE',
      actorId,
      after: bep as unknown as Record<string, unknown>,
    });

    this.logger.log(`BEP created: ${bep.id} by ${actorId}`);
    return bep;
  }

  async findAllBeps(
    query: BimQueryDto,
    organizationId: string,
  ): Promise<{
    data: BimBep[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { projectId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BimBepWhereInput = {
      organizationId,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bimBep.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { project: { select: { id: true, code: true, name: true } } },
      }),
      this.prisma.bimBep.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findBepById(
    id: string,
    organizationId: string,
  ): Promise<BimBep & { containers: BimInformationContainer[] }> {
    const bep = await this.prisma.bimBep.findFirst({
      where: { id, organizationId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        containers: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!bep) {
      throw new NotFoundException(`BEP (id=${id}) が見つかりません`);
    }
    return bep as BimBep & { containers: BimInformationContainer[] };
  }

  async updateBep(
    id: string,
    dto: UpdateBepDto,
    actorId: string,
    organizationId: string,
  ): Promise<BimBep> {
    const before = await this.findBepById(id, organizationId);

    const updated = await this.prisma.bimBep.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.namingConvention !== undefined ? { namingConvention: dto.namingConvention } : {}),
        ...(dto.approvedAt !== undefined ? { approvedAt: new Date(dto.approvedAt) } : {}),
        ...(dto.approvedBy !== undefined ? { approvedBy: dto.approvedBy } : {}),
        version: { increment: 1 },
      },
    });

    await this.recordAudit({
      entityType: 'BimBep',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    this.logger.log(`BEP updated: ${id} by ${actorId}`);
    return updated;
  }

  async deleteBep(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.findBepById(id, organizationId);

    // 関連コンテナが存在する場合は削除を拒否
    const containerCount = await this.prisma.bimInformationContainer.count({
      where: { bepId: id },
    });
    if (containerCount > 0) {
      throw new BadRequestException(
        `BEP (id=${id}) には ${containerCount} 件の情報コンテナが紐づいています。先にコンテナを削除してください。`,
      );
    }

    await this.prisma.bimBep.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'BimBep',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: before as unknown as Record<string, unknown>,
    });

    this.logger.log(`BEP deleted: ${id} by ${actorId}`);
  }

  // ================================================================
  // Information Containers
  // ================================================================

  async createContainer(
    dto: CreateContainerDto,
    actorId: string,
    organizationId: string,
  ): Promise<BimInformationContainer> {
    // コンテナコードの重複チェック（org スコープ）
    const existing = await this.prisma.bimInformationContainer.findFirst({
      where: { organizationId, containerCode: dto.containerCode },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`コンテナコード "${dto.containerCode}" は既に使用されています`);
    }

    const container = await this.prisma.bimInformationContainer.create({
      data: {
        organizationId,
        bepId: dto.bepId,
        containerCode: dto.containerCode,
        title: dto.title,
        discipline: dto.discipline,
        suitabilityCode: (dto as any).suitabilityCode ?? SuitabilityCode.S0,
        cdeStatus: dto.cdeStatus ?? CdeStatus.WORK_IN_PROGRESS,
        cdeExternalId: dto.cdeExternalId,
        filePath: dto.filePath,
        fileVersion: dto.fileVersion,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'BimInformationContainer',
      entityId: container.id,
      action: 'CREATE',
      actorId,
      after: container as unknown as Record<string, unknown>,
    });

    this.logger.log(`Container created: ${container.id} [${dto.containerCode}] by ${actorId}`);
    return container;
  }

  async findAllContainers(
    query: BimQueryDto,
    organizationId: string,
  ): Promise<{
    data: BimInformationContainer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { bepId, cdeStatus, discipline, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BimInformationContainerWhereInput = {
      organizationId,
      ...(bepId ? { bepId } : {}),
      ...(cdeStatus ? { cdeStatus } : {}),
      ...(discipline ? { discipline } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bimInformationContainer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          bep: { select: { id: true, title: true } },
        },
      }),
      this.prisma.bimInformationContainer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findContainerById(id: string, organizationId: string): Promise<BimInformationContainer> {
    const container = await this.prisma.bimInformationContainer.findFirst({
      where: { id, organizationId },
      include: {
        bep: { select: { id: true, title: true, projectId: true } },
      },
    });
    if (!container) {
      throw new NotFoundException(`情報コンテナ (id=${id}) が見つかりません`);
    }
    return container;
  }

  async updateContainer(
    id: string,
    dto: UpdateContainerDto,
    actorId: string,
    organizationId: string,
  ): Promise<BimInformationContainer> {
    const before = await this.findContainerById(id, organizationId);

    // コンテナコード変更時の重複チェック（org スコープ）
    if (dto.containerCode && dto.containerCode !== before.containerCode) {
      const duplicate = await this.prisma.bimInformationContainer.findFirst({
        where: { organizationId, containerCode: dto.containerCode },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException(
          `コンテナコード "${dto.containerCode}" は既に使用されています`,
        );
      }
    }

    const updated = await this.prisma.bimInformationContainer.update({
      where: { id },
      data: {
        ...(dto.bepId !== undefined ? { bepId: dto.bepId } : {}),
        ...(dto.containerCode !== undefined ? { containerCode: dto.containerCode } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.discipline !== undefined ? { discipline: dto.discipline } : {}),
        ...(dto.cdeStatus !== undefined ? { cdeStatus: dto.cdeStatus } : {}),
        ...(dto.cdeExternalId !== undefined ? { cdeExternalId: dto.cdeExternalId } : {}),
        ...(dto.filePath !== undefined ? { filePath: dto.filePath } : {}),
        ...(dto.fileVersion !== undefined ? { fileVersion: dto.fileVersion } : {}),
        ...(dto.reviewStatus !== undefined ? { reviewStatus: dto.reviewStatus } : {}),
        ...(dto.handoverStatus !== undefined ? { handoverStatus: dto.handoverStatus } : {}),
      },
    });

    await this.recordAudit({
      entityType: 'BimInformationContainer',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    this.logger.log(`Container updated: ${id} by ${actorId}`);
    return updated;
  }

  async updateCdeStatus(
    id: string,
    dto: UpdateCdeStatusDto,
    actorId: string,
    organizationId: string,
  ): Promise<BimInformationContainer> {
    const container = await this.findContainerById(id, organizationId);

    // ISO 19650 CDE ステータス遷移バリデーション
    const allowed = CDE_ALLOWED_TRANSITIONS[container.cdeStatus];
    if (!allowed.includes(dto.cdeStatus)) {
      throw new BadRequestException(
        `CDE ステータス遷移 "${container.cdeStatus}" → "${dto.cdeStatus}" は許可されていません。` +
          ` 許可遷移先: [${allowed.join(', ') || 'なし'}]`,
      );
    }

    const updated = await this.prisma.bimInformationContainer.update({
      where: { id },
      data: { cdeStatus: dto.cdeStatus },
    });

    await this.recordAudit({
      entityType: 'BimInformationContainer',
      entityId: id,
      action: 'CDE_STATUS_CHANGE',
      actorId,
      before: { cdeStatus: container.cdeStatus },
      after: { cdeStatus: updated.cdeStatus },
      reason: dto.reason,
    });

    this.logger.log(
      `CDE status changed: ${id} ${container.cdeStatus} → ${dto.cdeStatus} by ${actorId}`,
    );
    return updated;
  }

  async deleteContainer(id: string, actorId: string, organizationId: string): Promise<void> {
    const before = await this.findContainerById(id, organizationId);

    // PUBLISHED / ARCHIVED は削除禁止
    if (before.cdeStatus === CdeStatus.PUBLISHED || before.cdeStatus === CdeStatus.ARCHIVED) {
      throw new BadRequestException(
        `CDE ステータスが "${before.cdeStatus}" の情報コンテナは削除できません`,
      );
    }

    await this.prisma.bimInformationContainer.delete({ where: { id } });

    await this.recordAudit({
      entityType: 'BimInformationContainer',
      entityId: id,
      action: 'DELETE',
      actorId,
      before: before as unknown as Record<string, unknown>,
    });

    this.logger.log(`Container deleted: ${id} by ${actorId}`);
  }

  // ================================================================
  // Summary / Reports
  // ================================================================

  async getProjectBimSummary(
    projectId: string,
    organizationId: string,
  ): Promise<{
    projectId: string;
    eirCount: number;
    bepCount: number;
    containersByStatus: Record<string, number>;
    containersByDiscipline: Record<string, number>;
  }> {
    const [eirCount, bepCount, containerGroups] = await this.prisma.$transaction([
      this.prisma.bimEir.count({ where: { organizationId, projectId } }),
      this.prisma.bimBep.count({ where: { organizationId, projectId } }),
      this.prisma.bimInformationContainer.groupBy({
        by: ['cdeStatus'],
        where: { organizationId, bep: { projectId } },
        orderBy: { cdeStatus: 'asc' },
        _count: { id: true },
      }),
    ]);

    const containersByStatus = containerGroups.reduce<Record<string, number>>((acc, g) => {
      acc[g.cdeStatus] = (g._count as { id: number }).id;
      return acc;
    }, {});

    const disciplineGroups = await this.prisma.bimInformationContainer.groupBy({
      by: ['discipline'],
      where: { organizationId, bep: { projectId }, discipline: { not: null } },
      _count: { id: true },
    });

    const containersByDiscipline = disciplineGroups.reduce<Record<string, number>>((acc, g) => {
      const key = g.discipline ?? 'unknown';
      acc[key] = g._count.id;
      return acc;
    }, {});

    return {
      projectId,
      eirCount,
      bepCount,
      containersByStatus,
      containersByDiscipline,
    };
  }

  // ================================================================
  // Coordination Issues (ISO 19650 §5.7)
  // ================================================================

  async createCoordinationIssue(
    dto: {
      issueNo: string;
      title: string;
      description?: string;
      issueType: string;
      priority?: Severity;
      discipline?: string;
      location?: string;
      bepId?: string;
      assignedTo?: string;
      dueDate?: string;
    },
    actorId: string,
    organizationId: string,
  ) {
    const existing = await this.prisma.bimCoordinationIssue.findFirst({
      where: { organizationId, issueNo: dto.issueNo },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`課題番号 "${dto.issueNo}" は既に使用されています`);
    }

    const issue = await this.prisma.bimCoordinationIssue.create({
      data: {
        organizationId,
        issueNo: dto.issueNo,
        title: dto.title,
        description: dto.description,
        issueType: dto.issueType,
        priority: dto.priority ?? Severity.MEDIUM,
        bepId: dto.bepId,
        discipline: dto.discipline,
        location: dto.location,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdBy: actorId,
      },
    });

    await this.recordAudit({
      entityType: 'BimCoordinationIssue',
      entityId: issue.id,
      action: 'CREATE',
      actorId,
      after: issue as unknown as Record<string, unknown>,
    });

    return issue;
  }

  async findAllCoordinationIssues(
    query: { bepId?: string; status?: string; issueType?: string; page?: number; limit?: number },
    organizationId: string,
  ) {
    const { bepId, status, issueType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(bepId ? { bepId } : {}),
      ...(status ? { status: status as CorrectiveActionStatus } : {}),
      ...(issueType ? { issueType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bimCoordinationIssue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bimCoordinationIssue.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findCoordinationIssueById(id: string, organizationId: string) {
    const issue = await this.prisma.bimCoordinationIssue.findFirst({
      where: { id, organizationId },
    });
    if (!issue) throw new NotFoundException(`BimCoordinationIssue ${id} not found`);
    return issue;
  }

  async updateCoordinationIssue(
    id: string,
    dto: Record<string, unknown>,
    actorId: string,
    organizationId: string,
  ) {
    const existing = await this.findCoordinationIssueById(id, organizationId);

    const result = await this.prisma.bimCoordinationIssue.updateMany({
      where: { id, organizationId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title as string } : {}),
        ...(dto.description !== undefined ? { description: dto.description as string } : {}),
        ...(dto.issueType !== undefined ? { issueType: dto.issueType as string } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority as Severity } : {}),
        ...(dto.status !== undefined ? { status: dto.status as CorrectiveActionStatus } : {}),
        ...(dto.discipline !== undefined ? { discipline: dto.discipline as string } : {}),
        ...(dto.location !== undefined ? { location: dto.location as string } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo as string } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate as string) } : {}),
      },
    });
    if (result.count === 0) throw new NotFoundException(`BimCoordinationIssue ${id} not found`);

    const updated = await this.prisma.bimCoordinationIssue.findUniqueOrThrow({ where: { id } });
    await this.recordAudit({
      entityType: 'BimCoordinationIssue',
      entityId: id,
      action: 'UPDATE',
      actorId,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  async closeCoordinationIssue(id: string, actorId: string, organizationId: string) {
    const existing = await this.findCoordinationIssueById(id, organizationId);

    const result = await this.prisma.bimCoordinationIssue.updateMany({
      where: { id, organizationId },
      data: { status: CorrectiveActionStatus.CLOSED, closedAt: new Date(), closedBy: actorId },
    });
    if (result.count === 0) throw new NotFoundException(`BimCoordinationIssue ${id} not found`);

    const updated = await this.prisma.bimCoordinationIssue.findUniqueOrThrow({ where: { id } });
    await this.recordAudit({
      entityType: 'BimCoordinationIssue',
      entityId: id,
      action: 'CLOSE',
      actorId,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  // ================================================================
  // Private: Audit Trail
  // ================================================================

  /**
   * 全操作の who/when/before/after/reason を AuditTrail テーブルへ記録する。
   * エラーが発生しても主処理は止めない（fire-and-forget + error log）。
   */
  private async recordAudit(params: {
    entityType: string;
    entityId: string;
    action: string;
    actorId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    reason?: string;
    context?: AuditContext;
  }): Promise<void> {
    try {
      await this.prisma.auditTrail.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          actorId: params.actorId,
          before:
            params.before !== undefined
              ? (params.before as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          after:
            params.after !== undefined ? (params.after as Prisma.InputJsonValue) : Prisma.JsonNull,
          reason: params.reason,
          ipAddress: params.context?.ipAddress,
          userAgent: params.context?.userAgent,
        },
      });
    } catch (err) {
      // 監査記録の失敗は主処理に影響させない
      this.logger.error(
        `AuditTrail 記録失敗: entity=${params.entityType}/${params.entityId} action=${params.action}`,
        err,
      );
    }
  }
}
