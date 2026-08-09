import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * WorkflowModule
 *
 * Manages workflow requests and approval actions (WorkflowRequest, WorkflowAction models).
 * Provides approval routing and status tracking for documents and other entities.
 */
@Module({
  imports: [PrismaModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
