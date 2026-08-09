import { Module } from '@nestjs/common';
import { IsmsController } from './isms.controller';
import { IsmsService } from './isms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [IsmsController],
  providers: [IsmsService],
  exports: [IsmsService],
})
export class IsmsModule {}
