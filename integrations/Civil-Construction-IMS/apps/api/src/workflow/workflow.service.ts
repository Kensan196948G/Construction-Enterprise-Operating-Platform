import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, WorkflowActionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkflowRequestDto,
  UpdateWorkflowRequestDto,
  CreateWorkflowActionDto,
  ListWorkflowRequestsDto as ListWorkflowRequestsFilter,
} from './dto';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // WorkflowRequest CRUD
  // ----------------------------------------------------------------

  async findAll(filter: ListWorkflowRequestsFilter = {}) {
    const where: Prisma.WorkflowRequestWhereInput = {};

    if (filter.status) {
      where.status = filter.status as Prisma.EnumWorkflowStatusFilter;
    }
    if (filter.targetType) {
      where.targetType = filter.targetType;
    }
    if (filter.requesterId) {
      where.requesterId = filter.requesterId;
    }

    return this.prisma.workflowRequest.findMany({
      where,
      include: {
        workflow: { select: { id: true, name: true } },
        requester: { select: { id: true, email: true, displayName: true } },
        document: { select: { id: true, documentNo: true, title: true } },
        actions: {
          orderBy: { actedAt: 'desc' },
          take: 3,
          include: {
            actor: { select: { id: true, email: true, displayName: true } },
          },
        },
        _count: { select: { actions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const request = await this.prisma.workflowRequest.findUnique({
      where: { id },
      include: {
        workflow: { select: { id: true, name: true } },
        requester: { select: { id: true, email: true, displayName: true } },
        document: { select: { id: true, documentNo: true, title: true } },
        actions: {
          include: {
            actor: { select: { id: true, email: true, displayName: true } },
          },
          orderBy: { actedAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`WorkflowRequest not found: ${id}`);
    }

    return request;
  }

  async create(dto: CreateWorkflowRequestDto, actorId: string) {
    const request = await this.prisma.workflowRequest.create({
      data: {
        workflowId: dto.workflowId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        documentId: dto.documentId,
        requesterId: actorId,
        comment: dto.comment,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        workflow: { select: { id: true, name: true } },
        requester: { select: { id: true, email: true, displayName: true } },
      },
    });

    return request;
  }

  async update(id: string, dto: UpdateWorkflowRequestDto, actorId: string) {
    const existing = await this.findById(id);

    if (existing.status === 'APPROVED' || existing.status === 'REJECTED') {
      throw new BadRequestException(`Cannot modify workflow request in status: ${existing.status}`);
    }

    const updated = await this.prisma.workflowRequest.update({
      where: { id },
      data: {
        comment: dto.comment ?? existing.comment,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : existing.dueDate,
        updatedAt: new Date(),
      },
    });

    this.logger.debug(`WorkflowRequest ${id} updated by ${actorId}`);

    return updated;
  }

  async delete(id: string, actorId: string) {
    const existing = await this.findById(id);

    if (existing.status !== 'PENDING') {
      throw new BadRequestException(`Cannot delete workflow request in status: ${existing.status}`);
    }

    await this.prisma.workflowRequest.delete({ where: { id } });

    this.logger.debug(`WorkflowRequest ${id} deleted by ${actorId}`);
  }

  // ----------------------------------------------------------------
  // WorkflowAction CRUD
  // ----------------------------------------------------------------

  async findActionsByRequest(requestId: string) {
    await this.findById(requestId);

    return this.prisma.workflowAction.findMany({
      where: { requestId },
      include: {
        actor: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { actedAt: 'asc' },
    });
  }

  async createAction(dto: CreateWorkflowActionDto, actorId: string) {
    const request = await this.findById(dto.requestId);

    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      throw new BadRequestException(`Cannot add action to workflow in status: ${request.status}`);
    }

    // Validate action type
    if (!Object.values(WorkflowActionType).includes(dto.action as WorkflowActionType)) {
      throw new BadRequestException(
        `Invalid action type: ${dto.action}. Valid values: ${Object.values(WorkflowActionType).join(', ')}`,
      );
    }

    const action = await this.prisma.workflowAction.create({
      data: {
        requestId: dto.requestId,
        stepOrder: dto.stepOrder,
        action: dto.action as WorkflowActionType,
        actorId,
        comment: dto.comment,
        actedAt: new Date(),
      },
      include: {
        actor: { select: { id: true, email: true, displayName: true } },
      },
    });

    // Update parent request status based on action
    const newStatus = this.resolveStatus(dto.action);
    if (newStatus) {
      await this.prisma.workflowRequest.update({
        where: { id: dto.requestId },
        data: {
          status: newStatus as import('@prisma/client').WorkflowStatus,
          updatedAt: new Date(),
          completedAt:
            newStatus === 'APPROVED' || newStatus === 'REJECTED' ? new Date() : undefined,
        },
      });
    }

    return action;
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  private resolveStatus(action: string): string | null {
    const map: Record<string, string> = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      REQUEST_CHANGE: 'PENDING',
    };
    return map[action.toUpperCase()] ?? null;
  }
}
