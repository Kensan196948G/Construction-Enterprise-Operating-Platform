import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn(),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('liveness で status=ok を返す', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('ready', () => {
    it('DB 接続成功時 status=ready', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await controller.ready();
      expect(result.status).toBe('ready');
      expect(result.database).toBe('connected');
    });

    it('DB 接続失敗時 status=not_ready', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
      const result = await controller.ready();
      expect(result.status).toBe('not_ready');
      expect(result.database).toBe('disconnected');
    });
  });
});
