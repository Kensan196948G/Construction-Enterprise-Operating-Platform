import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowService } from '../workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowActionType } from '@prisma/client';

const ACTOR_ID = 'user-uuid-1';
const WORKFLOW_ID = 'wf-uuid-1';
const REQUEST_ID = 'req-uuid-1';

const mockWorkflowRequest = {
  id: REQUEST_ID,
  workflowId: WORKFLOW_ID,
  targetType: 'document',
  targetId: null,
  documentId: null,
  requesterId: ACTOR_ID,
  comment: '承認依頼',
  dueDate: null,
  status: 'PENDING',
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  workflow: { id: WORKFLOW_ID, name: '文書承認ワークフロー' },
  requester: { id: ACTOR_ID, email: 'user@example.com', displayName: '山田太郎' },
  document: null,
  actions: [],
  _count: { actions: 0 },
};

const mockAction = {
  id: 'action-uuid-1',
  requestId: REQUEST_ID,
  stepOrder: 1,
  action: WorkflowActionType.APPROVE,
  actorId: ACTOR_ID,
  comment: '承認します',
  actedAt: new Date(),
  actor: { id: ACTOR_ID, email: 'user@example.com', displayName: '山田太郎' },
};

const mockPrisma = {
  workflowRequest: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workflowAction: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('フィルターなしでワークフロー申請一覧を返す', async () => {
      mockPrisma.workflowRequest.findMany.mockResolvedValue([mockWorkflowRequest]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(REQUEST_ID);
      expect(mockPrisma.workflowRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('status フィルターを適用する', async () => {
      mockPrisma.workflowRequest.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'PENDING' });

      const call = mockPrisma.workflowRequest.findMany.mock.calls[0][0];
      expect(call.where.status).toBeDefined();
    });

    it('targetType フィルターを適用する', async () => {
      mockPrisma.workflowRequest.findMany.mockResolvedValue([]);

      await service.findAll({ targetType: 'document' });

      const call = mockPrisma.workflowRequest.findMany.mock.calls[0][0];
      expect(call.where.targetType).toBe('document');
    });

    it('requesterId フィルターを適用する', async () => {
      mockPrisma.workflowRequest.findMany.mockResolvedValue([mockWorkflowRequest]);

      await service.findAll({ requesterId: ACTOR_ID });

      const call = mockPrisma.workflowRequest.findMany.mock.calls[0][0];
      expect(call.where.requesterId).toBe(ACTOR_ID);
    });
  });

  describe('findById', () => {
    it('存在するワークフロー申請を返す', async () => {
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(mockWorkflowRequest);

      const result = await service.findById(REQUEST_ID);

      expect(result.id).toBe(REQUEST_ID);
      expect(result.status).toBe('PENDING');
    });

    it('存在しない ID で NotFoundException', async () => {
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('ワークフロー申請を作成する', async () => {
      mockPrisma.workflowRequest.create.mockResolvedValue(mockWorkflowRequest);

      const dto = {
        workflowId: WORKFLOW_ID,
        targetType: 'document',
        comment: '承認依頼',
      };

      const result = await service.create(dto as any, ACTOR_ID);

      expect(result.id).toBe(REQUEST_ID);
      expect(mockPrisma.workflowRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requesterId: ACTOR_ID,
            workflowId: WORKFLOW_ID,
          }),
        }),
      );
    });

    it('dueDate を Date 型に変換して保存する', async () => {
      mockPrisma.workflowRequest.create.mockResolvedValue(mockWorkflowRequest);

      const dto = {
        workflowId: WORKFLOW_ID,
        targetType: 'document',
        dueDate: '2026-12-31',
      };

      await service.create(dto as any, ACTOR_ID);

      const createArgs = mockPrisma.workflowRequest.create.mock.calls[0][0];
      expect(createArgs.data.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('PENDING 状態の申請を更新できる', async () => {
      const pendingRequest = { ...mockWorkflowRequest, status: 'PENDING' };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(pendingRequest);
      mockPrisma.workflowRequest.update.mockResolvedValue({
        ...pendingRequest,
        comment: '修正済み',
      });

      const result = await service.update(REQUEST_ID, { comment: '修正済み' } as any, ACTOR_ID);

      expect(mockPrisma.workflowRequest.update).toHaveBeenCalled();
      expect(result.comment).toBe('修正済み');
    });

    it('APPROVED 状態の申請は更新不可 — BadRequestException', async () => {
      const approvedRequest = { ...mockWorkflowRequest, status: 'APPROVED' };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(approvedRequest);

      await expect(service.update(REQUEST_ID, {} as any, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('REJECTED 状態の申請は更新不可 — BadRequestException', async () => {
      const rejectedRequest = { ...mockWorkflowRequest, status: 'REJECTED' };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(rejectedRequest);

      await expect(service.update(REQUEST_ID, {} as any, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('PENDING 状態の申請を削除できる', async () => {
      const pendingRequest = { ...mockWorkflowRequest, status: 'PENDING' };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(pendingRequest);
      mockPrisma.workflowRequest.delete.mockResolvedValue(pendingRequest);

      await expect(service.delete(REQUEST_ID, ACTOR_ID)).resolves.toBeUndefined();
      expect(mockPrisma.workflowRequest.delete).toHaveBeenCalledWith({ where: { id: REQUEST_ID } });
    });

    it('APPROVED 状態の申請は削除不可 — BadRequestException', async () => {
      const approvedRequest = { ...mockWorkflowRequest, status: 'APPROVED' };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(approvedRequest);

      await expect(service.delete(REQUEST_ID, ACTOR_ID)).rejects.toThrow(BadRequestException);
    });

    it('IN_REVIEW 状態の申請は削除不可 — BadRequestException', async () => {
      const inReviewRequest = { ...mockWorkflowRequest, status: 'IN_REVIEW' };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(inReviewRequest);

      await expect(service.delete(REQUEST_ID, ACTOR_ID)).rejects.toThrow(BadRequestException);
    });

    it('存在しない申請は NotFoundException', async () => {
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent', ACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActionsByRequest', () => {
    it('申請に紐付くアクション一覧を返す', async () => {
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(mockWorkflowRequest);
      mockPrisma.workflowAction.findMany.mockResolvedValue([mockAction]);

      const result = await service.findActionsByRequest(REQUEST_ID);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe(WorkflowActionType.APPROVE);
    });

    it('申請が存在しない場合は NotFoundException', async () => {
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(null);

      await expect(service.findActionsByRequest('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAction', () => {
    it('APPROVE アクションで申請ステータスが APPROVED に更新される', async () => {
      const pendingRequest = { ...mockWorkflowRequest, status: 'PENDING', actions: [] };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(pendingRequest);
      mockPrisma.workflowAction.create.mockResolvedValue(mockAction);
      mockPrisma.workflowRequest.update.mockResolvedValue({
        ...pendingRequest,
        status: 'APPROVED',
      });

      const dto = {
        requestId: REQUEST_ID,
        stepOrder: 1,
        action: 'APPROVE',
        comment: '承認',
      };

      const result = await service.createAction(dto as any, ACTOR_ID);

      expect(result.action).toBe(WorkflowActionType.APPROVE);
      expect(mockPrisma.workflowRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'APPROVED' }),
        }),
      );
    });

    it('REJECT アクションで申請ステータスが REJECTED に更新される', async () => {
      const pendingRequest = { ...mockWorkflowRequest, status: 'PENDING', actions: [] };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(pendingRequest);
      const rejectedAction = { ...mockAction, action: WorkflowActionType.REJECT };
      mockPrisma.workflowAction.create.mockResolvedValue(rejectedAction);
      mockPrisma.workflowRequest.update.mockResolvedValue({
        ...pendingRequest,
        status: 'REJECTED',
      });

      const dto = {
        requestId: REQUEST_ID,
        stepOrder: 1,
        action: 'REJECT',
        comment: '却下',
      };

      await service.createAction(dto as any, ACTOR_ID);

      expect(mockPrisma.workflowRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REJECTED' }),
        }),
      );
    });

    it('REVIEW アクションではステータスが変更されない（update は呼ばれない）', async () => {
      const pendingRequest = { ...mockWorkflowRequest, status: 'PENDING', actions: [] };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(pendingRequest);
      const reviewAction = { ...mockAction, action: WorkflowActionType.REVIEW };
      mockPrisma.workflowAction.create.mockResolvedValue(reviewAction);

      const dto = {
        requestId: REQUEST_ID,
        stepOrder: 1,
        action: 'REVIEW',
        comment: '審査中',
      };

      const result = await service.createAction(dto as any, ACTOR_ID);

      expect(result.action).toBe(WorkflowActionType.REVIEW);
      // resolveStatus returns null for REVIEW → workflowRequest.update is NOT called
      expect(mockPrisma.workflowRequest.update).not.toHaveBeenCalled();
    });

    it('APPROVED 状態の申請にはアクション追加不可 — BadRequestException', async () => {
      const approvedRequest = { ...mockWorkflowRequest, status: 'APPROVED', actions: [] };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(approvedRequest);

      const dto = { requestId: REQUEST_ID, stepOrder: 1, action: 'APPROVE' };

      await expect(service.createAction(dto as any, ACTOR_ID)).rejects.toThrow(BadRequestException);
    });

    it('不正なアクション種別で BadRequestException', async () => {
      const pendingRequest = { ...mockWorkflowRequest, status: 'PENDING', actions: [] };
      mockPrisma.workflowRequest.findUnique.mockResolvedValue(pendingRequest);

      const dto = { requestId: REQUEST_ID, stepOrder: 1, action: 'INVALID_ACTION' };

      await expect(service.createAction(dto as any, ACTOR_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
