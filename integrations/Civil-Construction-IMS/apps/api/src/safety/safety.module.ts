import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { SafetyInspectionController } from './safety-inspection.controller';
import { SafetyInspectionService } from './safety-inspection.service';
import { SafetyIncidentController } from './safety-incident.controller';
import { SafetyIncidentService } from './safety-incident.service';
import { ToolboxTalkController } from './toolbox-talk.controller';
import { ToolboxTalkService } from './toolbox-talk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    SafetyController,
    SafetyInspectionController,
    SafetyIncidentController,
    ToolboxTalkController,
  ],
  providers: [SafetyService, SafetyInspectionService, SafetyIncidentService, ToolboxTalkService],
  exports: [SafetyService, SafetyInspectionService, SafetyIncidentService, ToolboxTalkService],
})
export class SafetyModule {}
