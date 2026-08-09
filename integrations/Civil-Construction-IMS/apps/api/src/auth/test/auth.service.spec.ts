import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createRemoteJWKSet, jwtVerify } from 'jose';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(),
  jwtVerify: jest.fn(),
}));

const mockUser = {
  id: 'user-uuid-1',
  email: 'admin@civil-ims.local',
  displayName: 'テスト管理者',
  passwordHash: null as string | null,
  isActive: true,
  organizationId: 'org-uuid-1',
  departmentId: null,
  employeeNo: 'SYS001',
  externalId: null,
  lastLoginAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [{ role: { code: 'SYSTEM_ADMIN' } }],
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn().mockResolvedValue({ id: 'rt-uuid-1' }),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
  },
};

const mockConfig = {
  get: jest.fn().mockReturnValue('test-jwt-secret'),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('正しいメール・パスワードでログイン成功', async () => {
      const hash = await bcrypt.hash('Admin1234!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login('admin@civil-ims.local', 'Admin1234!');

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('admin@civil-ims.local');
      expect(result.user.roles).toContain('SYSTEM_ADMIN');
    });

    it('存在しないユーザーで UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('unknown@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('パスワード不一致で UnauthorizedException', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });

      await expect(service.login('admin@civil-ims.local', 'wrong-pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('passwordHash が null の場合は UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(service.login('admin@civil-ims.local', 'any')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('exchangeEntraToken', () => {
    const mockOid = 'entra-oid-abc123';
    const mockIdToken = 'mock.entra.id_token';
    const mockEntraUser = { ...mockUser, externalId: mockOid };

    beforeEach(() => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'AZURE_AD_TENANT_ID') return 'tenant-uuid-1';
        if (key === 'AZURE_AD_CLIENT_ID') return 'client-uuid-1';
        return 'test-jwt-secret';
      });
      (createRemoteJWKSet as jest.Mock).mockReturnValue('mock-jwks');
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { oid: mockOid, sub: 'entra-sub', email: 'admin@civil-ims.local' },
      });
      mockPrisma.user.findFirst.mockResolvedValue(mockEntraUser);
      mockPrisma.user.update.mockResolvedValue(mockEntraUser);
    });

    it('有効な id_token でトークン交換成功', async () => {
      const result = await service.exchangeEntraToken(mockIdToken);

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.email).toBe('admin@civil-ims.local');
      expect(result.roles).toContain('SYSTEM_ADMIN');
      expect(jwtVerify).toHaveBeenCalledWith(
        mockIdToken,
        'mock-jwks',
        expect.objectContaining({
          issuer: expect.arrayContaining([expect.stringContaining('tenant-uuid-1')]),
          audience: 'client-uuid-1',
        }),
      );
    });

    it('AZURE_AD_TENANT_ID 未設定で UnauthorizedException', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'AZURE_AD_TENANT_ID') return undefined;
        if (key === 'AZURE_AD_CLIENT_ID') return 'client-uuid-1';
        return 'test-jwt-secret';
      });

      await expect(service.exchangeEntraToken(mockIdToken)).rejects.toThrow(UnauthorizedException);
    });

    it('AZURE_AD_CLIENT_ID 未設定で UnauthorizedException', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'AZURE_AD_TENANT_ID') return 'tenant-uuid-1';
        if (key === 'AZURE_AD_CLIENT_ID') return undefined;
        return 'test-jwt-secret';
      });

      await expect(service.exchangeEntraToken(mockIdToken)).rejects.toThrow(UnauthorizedException);
    });

    it('jwtVerify 失敗（署名不正）で UnauthorizedException', async () => {
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('JWS signature verification failed'));

      await expect(service.exchangeEntraToken(mockIdToken)).rejects.toThrow(UnauthorizedException);
    });

    it('oid クレームなしで UnauthorizedException', async () => {
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { sub: 'entra-sub' },
      });

      await expect(service.exchangeEntraToken(mockIdToken)).rejects.toThrow(UnauthorizedException);
    });

    it('DB にユーザーが存在しない場合 UnauthorizedException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.exchangeEntraToken(mockIdToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('一致するトークンが存在しない場合 UnauthorizedException', async () => {
      // refreshToken.findMany returns empty list → no hash match
      mockPrisma.refreshToken.findMany.mockResolvedValue([]);

      await expect(service.refresh('nonexistent.token')).rejects.toThrow(UnauthorizedException);
    });

    it('ユーザーが無効の場合 UnauthorizedException', async () => {
      const hash = await bcrypt.hash('test.token', 10);
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-uuid-1',
          tokenHash: hash,
          userId: 'user-uuid-1',
          expiresAt: new Date(Date.now() + 86400000),
          revokedAt: null,
          user: { ...mockUser, isActive: false, roles: [] },
        },
      ]);
      await expect(service.refresh('test.token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
