import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Severity } from '@prisma/client';

export class CreateCorrectiveActionDto {
  @ApiProperty({ description: '是正処置番号 (一意)', example: 'CA-2026-001' })
  @IsString()
  @MaxLength(50)
  caNo!: string;

  @ApiProperty({
    description: '起票元種別',
    example: 'nonconformity',
    enum: ['nonconformity', 'complaint', 'audit_finding', 'near_miss'],
  })
  @IsString()
  @MaxLength(50)
  sourceType!: string;

  @ApiPropertyOptional({ description: '起票元エンティティ UUID' })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional({ description: '関連プロジェクト UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: 'タイトル' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: '問題の説明' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: '適用 ISO 規格', example: '9001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isoStandard?: string;

  @ApiPropertyOptional({ description: '重大度', enum: Severity, default: Severity.MEDIUM })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

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
