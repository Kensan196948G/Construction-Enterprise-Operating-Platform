import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentType, Severity } from '@prisma/client';

export class CreateSafetyIncidentDto {
  @ApiProperty({ description: 'インシデント番号 (一意)', example: 'INC-2026-001' })
  @IsString()
  @MaxLength(50)
  incidentNo!: string;

  @ApiPropertyOptional({ description: '関連プロジェクト UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: 'インシデント種別', enum: IncidentType })
  @IsEnum(IncidentType)
  incidentType!: IncidentType;

  @ApiProperty({ description: '発生日時 (ISO 8601)' })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional({ description: '発生場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ description: '状況説明' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: '被災者名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  injuredPerson?: string;

  @ApiPropertyOptional({ description: '傷病種類' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  injuryType?: string;

  @ApiPropertyOptional({ description: '休業日数', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lostDays?: number;

  @ApiPropertyOptional({ description: '重大度', enum: Severity, default: Severity.MEDIUM })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ description: '緊急処置内容' })
  @IsOptional()
  @IsString()
  immediateAction?: string;

  @ApiPropertyOptional({ description: '根本原因分析' })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional({ description: '再発防止対策' })
  @IsOptional()
  @IsString()
  preventiveMeasure?: string;
}
