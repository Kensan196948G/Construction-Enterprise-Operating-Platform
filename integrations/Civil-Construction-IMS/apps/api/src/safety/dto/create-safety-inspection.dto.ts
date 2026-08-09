import { IsString, IsUUID, IsOptional, IsDateString, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSafetyInspectionDto {
  @ApiProperty({ description: 'パトロール番号 (一意)', example: 'SI-2026-001' })
  @IsString()
  @MaxLength(50)
  inspectionNo!: string;

  @ApiPropertyOptional({ description: '関連プロジェクト UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'パトロール種別',
    example: 'daily',
    enum: ['daily', 'weekly', 'monthly', 'special'],
  })
  @IsString()
  @MaxLength(50)
  inspectionType!: string;

  @ApiProperty({ description: 'パトロール実施日時 (ISO 8601)' })
  @IsDateString()
  inspectedAt!: string;

  @ApiProperty({ description: 'パトロール実施者 User UUID' })
  @IsUUID()
  inspectorId!: string;

  @ApiPropertyOptional({ description: '実施場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'チェック項目リスト (JSON array)',
    example: [{ item: '安全帯使用', result: 'OK' }],
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  checkItems?: Array<{ item: string; result: 'OK' | 'NG' | 'N/A' }>;

  @ApiPropertyOptional({ description: '所見・指摘事項' })
  @IsOptional()
  @IsString()
  findings?: string;
}
