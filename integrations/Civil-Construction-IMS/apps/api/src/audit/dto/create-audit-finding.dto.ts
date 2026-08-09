import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FindingType, FindingStatus, Severity } from '@prisma/client';

export class CreateAuditFindingDto {
  @ApiProperty({
    description: '所見種別',
    enum: FindingType,
    example: FindingType.NONCONFORMITY,
  })
  @IsEnum(FindingType)
  findingType!: FindingType;

  @ApiPropertyOptional({
    description: 'ISO 規格条項参照 (e.g. "9001:8.5.2")',
    example: '9001:8.5.2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clauseRef?: string;

  @ApiProperty({ description: '所見内容・説明' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: '客観的証拠' })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({
    description: '重大度',
    enum: Severity,
    default: Severity.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({
    description: '所見ステータス',
    enum: FindingStatus,
    default: FindingStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus;

  @ApiPropertyOptional({ description: '紐付く是正処置 UUID' })
  @IsOptional()
  @IsString()
  caId?: string;

  /** Not persisted directly; used only for audit trail reason field */
  @ApiPropertyOptional({ description: '操作理由（監査証跡用）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
