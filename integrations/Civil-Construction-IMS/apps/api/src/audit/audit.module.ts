import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditTrailService } from './audit-trail.service';

/**
 * AuditModule
 *
 * Handles:
 * - AuditTrail: immutable who/when/before/after/reason records for every mutation
 * - AuditPlan: internal audit schedule management (ISO 9001/14001/45001/55001/19650)
 * - AuditFinding: findings raised during internal audits
 *
 * AuditTrailService is exported so other modules can record trail entries.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService, AuditTrailService],
  exports: [AuditTrailService],
})
export class AuditModule {}
