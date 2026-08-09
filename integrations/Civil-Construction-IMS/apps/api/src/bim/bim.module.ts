import { Module } from '@nestjs/common';
import { BimController } from './bim.controller';
import { BimService } from './bim.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BimController],
  providers: [BimService],
  exports: [BimService],
})
export class BimModule {}
