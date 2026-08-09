import { IsString, IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SafetyInspectionStatus } from '@prisma/client';

export class QuerySafetyInspectionDto {
  @ApiPropertyOptional({ description: 'プロジェクト UUID でフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'パトロール種別でフィルタ' })
  @IsOptional()
  @IsString()
  inspectionType?: string;

  @ApiPropertyOptional({ description: 'ステータスでフィルタ', enum: SafetyInspectionStatus })
  @IsOptional()
  @IsEnum(SafetyInspectionStatus)
  status?: SafetyInspectionStatus;

  @ApiPropertyOptional({ description: 'ページ番号', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '1ページ件数', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
