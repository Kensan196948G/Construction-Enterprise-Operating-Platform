import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Significance } from '@prisma/client';

export class EnvironmentalAspectQueryDto {
  @ApiPropertyOptional({ description: 'プロジェクトIDでフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: Significance, description: '重要度でフィルタ' })
  @IsOptional()
  @IsEnum(Significance)
  significance?: Significance;
}
