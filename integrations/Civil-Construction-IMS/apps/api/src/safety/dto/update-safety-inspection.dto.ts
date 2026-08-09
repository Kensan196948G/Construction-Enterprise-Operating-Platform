import { IsString, IsOptional, IsEnum, IsArray, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SafetyInspectionStatus } from '@prisma/client';

export class UpdateSafetyInspectionDto {
  @ApiPropertyOptional({ description: 'パトロール種別' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  inspectionType?: string;

  @ApiPropertyOptional({ description: '実施場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'チェック項目リスト', type: 'array' })
  @IsOptional()
  @IsArray()
  checkItems?: Array<{ item: string; result: 'OK' | 'NG' | 'N/A' }>;

  @ApiPropertyOptional({ description: '所見・指摘事項' })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({ description: 'ステータス', enum: SafetyInspectionStatus })
  @IsOptional()
  @IsEnum(SafetyInspectionStatus)
  status?: SafetyInspectionStatus;
}
