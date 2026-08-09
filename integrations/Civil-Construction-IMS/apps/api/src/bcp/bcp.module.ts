import { Module } from '@nestjs/common';
import { BcpController } from './bcp.controller';
import { BcpService } from './bcp.service';

/**
 * BcpModule — Business Continuity Planning
 *
 * Manages:
 *   - BcpPlan          (事業継続計画書)
 *   - BcpRiskScenario  (リスクシナリオ)
 *   - BcpDrillRecord   (訓練記録)
 *
 * PrismaModule is @Global, so PrismaService is injected without explicit import.
 */
@Module({
  controllers: [BcpController],
  providers: [BcpService],
  exports: [BcpService],
})
export class BcpModule {}
