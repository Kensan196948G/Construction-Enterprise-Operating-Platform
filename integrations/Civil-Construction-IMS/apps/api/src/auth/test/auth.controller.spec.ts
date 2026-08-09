import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockAuthService = {
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  exchangeEntraToken: jest.fn(),
};

// JwtAuthGuard を差し替え: req.user を注入して常に通過させる
const mockJwtAuthGuard = {
  canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-uuid-1' };
    return true;
  }),
};

const mockAccessResult = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
  user: {
    id: 'user-uuid-1',
    email: 'admin@civil-ims.local',
    displayName: 'テスト管理者',
    roles: ['SYSTEM_ADMIN'],
    organizationId: 'org-uuid-1',
  },
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('email・password を AuthService.login に委譲して結果を返す', async () => {
      mockAuthService.login.mockResolvedValue(mockAccessResult);

      const result = await controller.login({
        email: 'admin@civil-ims.local',
        password: 'Admin1234!',
      } as never);

      expect(mockAuthService.login).toHaveBeenCalledWith('admin@civil-ims.local', 'Admin1234!');
      expect(result).toEqual(mockAccessResult);
    });

    it('AuthService.login が例外を投げた場合は呼び出し元へ伝播する', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        controller.login({ email: 'bad@test.com', password: 'wrong' } as never),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('refresh', () => {
    it('refreshToken を AuthService.refresh に委譲して結果を返す', async () => {
      const refreshed = { accessToken: 'new.access.token', refreshToken: 'new.refresh.token' };
      mockAuthService.refresh.mockResolvedValue(refreshed);

      const result = await controller.refresh({ refreshToken: 'old.refresh.token' } as never);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('old.refresh.token');
      expect(result).toEqual(refreshed);
    });

    it('AuthService.refresh が例外を投げた場合は伝播する', async () => {
      mockAuthService.refresh.mockRejectedValue(new Error('Unauthorized'));

      await expect(controller.refresh({ refreshToken: 'expired.token' } as never)).rejects.toThrow(
        'Unauthorized',
      );
    });
  });

  describe('logout', () => {
    const req = { user: { id: 'user-uuid-1' } } as Express.Request & { user: { id: string } };

    it('userId と refreshToken を AuthService.logout に委譲する', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(req, { refreshToken: 'token-to-revoke' } as never);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-uuid-1', 'token-to-revoke');
    });

    it('logout は undefined を返す (204 No Content)', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(req, { refreshToken: 'any-token' } as never);

      expect(result).toBeUndefined();
    });
  });

  describe('entraExchange', () => {
    it('idToken を AuthService.exchangeEntraToken に委譲して結果を返す', async () => {
      const entraResult = {
        accessToken: 'ims.jwt.token',
        userId: 'user-uuid-1',
        email: 'admin@civil-ims.local',
        displayName: 'テスト管理者',
        roles: ['SYSTEM_ADMIN'],
        organizationId: 'org-uuid-1',
      };
      mockAuthService.exchangeEntraToken.mockResolvedValue(entraResult);

      const result = await controller.entraExchange({ idToken: 'entra.id.token' } as never);

      expect(mockAuthService.exchangeEntraToken).toHaveBeenCalledWith('entra.id.token');
      expect(result).toEqual(entraResult);
    });

    it('idToken 検証失敗時は例外が伝播する', async () => {
      mockAuthService.exchangeEntraToken.mockRejectedValue(new Error('UnauthorizedException'));

      await expect(controller.entraExchange({ idToken: 'invalid.token' } as never)).rejects.toThrow(
        'UnauthorizedException',
      );
    });
  });
});
