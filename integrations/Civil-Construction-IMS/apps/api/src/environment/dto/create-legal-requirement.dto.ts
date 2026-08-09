import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ComplianceStatus } from '@prisma/client';

export class CreateLegalRequirementDto {
  @ApiProperty({ description: '法令名称' })
  @IsString()
  @MaxLength(255)
  lawName!: string;

  @ApiPropertyOptional({ description: '法令番号・条項' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lawNo?: string;

  @ApiPropertyOptional({ description: '適用範囲' })
  @IsOptional()
  @IsString()
  applicableScope?: string;

  @ApiPropertyOptional({ description: '遵守のための注記・対策' })
  @IsOptional()
  @IsString()
  complianceNote?: string;

  @ApiPropertyOptional({ description: '最終評価日 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  lastEvaluatedAt?: string;

  @ApiPropertyOptional({
    enum: ComplianceStatus,
    description: '遵守状況',
    default: ComplianceStatus.COMPLIANT,
  })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  complianceStatus?: ComplianceStatus;
}
