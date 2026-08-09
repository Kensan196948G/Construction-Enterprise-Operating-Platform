import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordTrailOptions {
  /** Prisma model name, e.g. "Document", "AuditPlan" */
  entityType: string;
  entityId: string;
  /** Verb describing the operation, e.g. CREATE / UPDATE / DELETE / APPROVE */
  action: string;
  actorId: string;
  before?: unknown;
  after?: unknown;
  /** Human-readable justification supplied by the user */
  reason?: string;
  /** Express request object — used to extract ip / user-agent */
  req?: Partial<Pick<Request, 'ip' | 'headers'>>;
}

/**
 * AuditTrailService
 *
 * Provides a single `record()` method that persists an immutable audit entry
 * capturing who/when/before/after/reason for every mutation in the system.
 *
 * Usage in other services:
 *   constructor(private readonly trail: AuditTrailService) {}
 *   await this.trail.record({ entityType: 'Document', entityId: doc.id, action: 'APPROVE', actorId, before, after, req });
 */
@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist one immutable audit trail entry.
   * Errors are caught and logged rather than propagated so that a trail write
   * failure never rolls back the primary business operation.
   */
  async record(opts: RecordTrailOptions): Promise<void> {
    const {
      entityType,
      entityId,
      action,
      actorId,
      before = null,
      after = null,
      reason,
      req,
    } = opts;

    const ipAddress =
      req?.ip ?? (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();

    const userAgent =
      typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    try {
      await this.prisma.auditTrail.create({
        data: {
          entityType,
          entityId,
          action,
          actorId,
          before: before !== null && before !== undefined ? (before as object) : undefined,
          after: after !== null && after !== undefined ? (after as object) : undefined,
          reason,
          ipAddress,
          userAgent,
        },
      });
    } catch (err) {
      // Trail write must NOT crash the primary operation
      this.logger.error(
        `Failed to write audit trail [${entityType}:${entityId} ${action}]: ${String(err)}`,
      );
    }
  }
}
