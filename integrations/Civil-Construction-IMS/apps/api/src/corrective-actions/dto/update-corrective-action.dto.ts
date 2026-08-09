import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Severity, CorrectiveActionStatus } from '@prisma/client';

export class UpdateCorrectiveActionDto {
  @ApiPropertyOptional({ description: 'タイトル' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: '問題の説明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '重大度', enum: Severity })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ description: 'ステータス', enum: CorrectiveActionStatus })
  @IsOptional()
  @IsEnum(CorrectiveActionStatus)
  status?: CorrectiveActionStatus;

  @ApiPropertyOptional({ description: '根本原因分析' })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional({ description: '是正処置内容' })
  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @ApiPropertyOptional({ description: '予防処置内容' })
  @IsOptional()
  @IsString()
  preventiveAction?: string;

  @ApiPropertyOptional({ description: '完了期限 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
