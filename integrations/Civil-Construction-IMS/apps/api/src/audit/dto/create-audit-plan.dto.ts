import { IsString, IsOptional, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '@prisma/client';

export class CreateAuditPlanDto {
  @ApiProperty({ description: '計画番号 (一意)', example: 'AP-2025-001' })
  @IsString()
  @MaxLength(50)
  planNo!: string;

  @ApiProperty({ description: '計画タイトル', example: '2025年度 品質管理システム内部監査' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: '適用 ISO 規格',
    example: '9001',
    enum: ['9001', '14001', '45001', '55001', '19650'],
  })
  @IsString()
  isoStandard!: string;

  @ApiPropertyOptional({ description: '関連プロジェクト UUID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ description: '計画実施予定日時 (ISO 8601)', example: '2025-10-01T09:00:00Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({
    description: '監査ステータス',
    enum: AuditStatus,
    default: AuditStatus.PLANNED,
  })
  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;

  @ApiPropertyOptional({ description: '監査員 User UUID' })
  @IsOptional()
  @IsString()
  auditorId?: string;

  @ApiPropertyOptional({ description: '被監査部門 User/Dept UUID' })
  @IsOptional()
  @IsString()
  auditeeId?: string;

  @ApiPropertyOptional({ description: '監査スコープ・対象範囲' })
  @IsOptional()
  @IsString()
  scope?: string;

  /** Not persisted directly; used only for audit trail reason field */
  @ApiPropertyOptional({ description: '操作理由（監査証跡用）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
