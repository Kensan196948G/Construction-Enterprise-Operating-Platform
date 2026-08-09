import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';

/**
 * QualityModule - ISO 9001 Quality Management
 *
 * Manages:
 *   - Quality Plans (QualityPlan)
 *   - Quality Inspections (QualityInspection)
 *   - Nonconformities (Nonconformity)
 *
 * PrismaModule is @Global, so PrismaService is available without explicit import.
 */
@Module({
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
