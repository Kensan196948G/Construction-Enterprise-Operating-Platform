import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../decorators/current-user.decorator';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: CurrentUserType }>();
    const { method, url, body } = req;

    if (!WRITE_METHODS.has(method) || !req.user) {
      return next.handle();
    }

    const actorId = req.user.id;
    const entityType = this.extractEntityType(url);

    return next.handle().pipe(
      tap((responseData) => {
        // Fire-and-forget audit log (does not block response)
        this.prisma.auditTrail
          .create({
            data: {
              entityType,
              entityId: this.extractEntityId(url, responseData),
              action: this.mapMethodToAction(method),
              actorId,
              after: responseData as Prisma.InputJsonValue,
              before: method === 'DELETE' ? (body as Prisma.InputJsonValue) : Prisma.JsonNull,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          })
          .catch(() => {
            // Audit log failure must never crash the main request
          });
      }),
    );
  }

  private extractEntityType(url: string): string {
    const segments = url.split('/').filter(Boolean);
    // e.g. /api/v1/documents/uuid → "documents"
    const versionIdx = segments.findIndex((s) => s.match(/^v\d+$/));
    return segments[versionIdx + 1] ?? 'unknown';
  }

  private extractEntityId(url: string, data: unknown): string {
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = url.match(uuidRegex);
    if (match) return match[0];
    if (data && typeof data === 'object' && 'id' in data) {
      return String((data as Record<string, unknown>).id);
    }
    return 'unknown';
  }

  private mapMethodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return map[method] ?? method;
  }
}
