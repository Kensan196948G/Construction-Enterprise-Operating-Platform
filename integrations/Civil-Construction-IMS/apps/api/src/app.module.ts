import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsModule } from './documents/documents.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AuditModule } from './audit/audit.module';
import { QualityModule } from './quality/quality.module';
import { EnvironmentModule } from './environment/environment.module';
import { SafetyModule } from './safety/safety.module';
import { AssetsModule } from './assets/assets.module';
import { BimModule } from './bim/bim.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CorrectiveActionsModule } from './corrective-actions/corrective-actions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IsmsModule } from './isms/isms.module';
import { BcpModule } from './bcp/bcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    DocumentsModule,
    WorkflowModule,
    AuditModule,
    QualityModule,
    EnvironmentModule,
    SafetyModule,
    AssetsModule,
    BimModule,
    NotificationsModule,
    CorrectiveActionsModule,
    DashboardModule,
    AnalyticsModule,
    IsmsModule,
    BcpModule,
  ],
})
export class AppModule {}
