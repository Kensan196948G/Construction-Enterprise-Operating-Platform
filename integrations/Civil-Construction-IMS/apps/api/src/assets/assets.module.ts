import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * AssetsModule
 *
 * Manages assets in compliance with ISO 55001 (Asset Management).
 * Handles: Asset, AssetMaintenancePlan, AssetInspection models.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
