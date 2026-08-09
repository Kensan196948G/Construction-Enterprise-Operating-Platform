import { IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Severity, CorrectiveActionStatus } from '@prisma/client';

export class UpdateSafetyIncidentDto {
  @ApiPropertyOptional({ description: '状況説明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '発生場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

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

  @ApiPropertyOptional({ description: '休業日数', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lostDays?: number;

  @ApiPropertyOptional({ description: '重大度', enum: Severity })
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

  @ApiPropertyOptional({ description: 'ステータス', enum: CorrectiveActionStatus })
  @IsOptional()
  @IsEnum(CorrectiveActionStatus)
  status?: CorrectiveActionStatus;

  @ApiPropertyOptional({ description: '調査担当者 User UUID' })
  @IsOptional()
  @IsUUID()
  investigatedBy?: string;
}
