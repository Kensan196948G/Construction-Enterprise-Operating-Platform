import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';

const USER_ID = 'user-uuid-1';
const ORG_ID = 'org-uuid-1';
const DEPT_ID = 'dept-uuid-1';

const mockUser = {
  id: USER_ID,
  email: 'yamada@example.com',
  displayName: '山田太郎',
  employeeNo: 'EMP-001',
  departmentId: DEPT_ID,
  organizationId: ORG_ID,
  lastLoginAt: new Date('2026-06-01T09:00:00Z'),
  roles: [
    {
      role: {
        id: 'role-uuid-1',
        name: 'QUALITY_MANAGER',
        displayName: '品質管理者',
        permissions: [],
      },
    },
  ],
};

const mockUserFull = {
  ...mockUser,
  deletedAt: null,
  isActive: true,
  organization: { id: ORG_ID, name: 'テスト建設株式会社' },
  department: { id: DEPT_ID, name: '品質管理部' },
  roles: [
    {
      role: {
        id: 'role-uuid-1',
        name: 'QUALITY_MANAGER',
        displayName: '品質管理者',
        permissions: [
          {
            permission: { id: 'perm-uuid-1', resource: 'document', action: 'read' },
          },
        ],
      },
    },
  ],
};

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('有効なユーザー一覧を返す', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(USER_ID);
      expect(result[0].email).toBe('yamada@example.com');
    });

    it('deletedAt: null かつ isActive: true のフィルターを適用する', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, isActive: true },
        }),
      );
    });

    it('roles を include して返す', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result[0].roles).toBeDefined();
      expect(result[0].roles[0].role.name).toBe('QUALITY_MANAGER');
    });

    it('ユーザーが存在しない場合は空配列を返す', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('存在するユーザーを organization / department / roles 付きで返す', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserFull);

      const result = await service.findById(USER_ID);

      expect(result.id).toBe(USER_ID);
      expect(result.organization).toBeDefined();
      expect(result.organization.name).toBe('テスト建設株式会社');
      expect(result.department).toBeDefined();
      expect(result.department?.name).toBe('品質管理部');
    });

    it('roles に permissions が含まれる', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserFull);

      const result = await service.findById(USER_ID);

      const perm = result.roles[0].role.permissions[0].permission;
      expect(perm.resource).toBe('document');
      expect(perm.action).toBe('read');
    });

    it('where に id と deletedAt: null を含める', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserFull);

      await service.findById(USER_ID);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID, deletedAt: null },
        }),
      );
    });

    it('存在しない ID で NotFoundException を投げる', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('論理削除済みユーザーは NotFoundException を投げる', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
