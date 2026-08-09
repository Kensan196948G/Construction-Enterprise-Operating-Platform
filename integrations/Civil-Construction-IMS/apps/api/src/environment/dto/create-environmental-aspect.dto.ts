import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Significance } from '@prisma/client';

export class CreateEnvironmentalAspectDto {
  @ApiPropertyOptional({ description: 'プロジェクトID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: '環境側面名称' })
  @IsString()
  @MaxLength(255)
  aspectName!: string;

  @ApiPropertyOptional({ description: '関連活動・工程' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  activity?: string;

  @ApiPropertyOptional({ description: '環境影響の内容' })
  @IsOptional()
  @IsString()
  environmentalImpact?: string;

  @ApiPropertyOptional({ enum: Significance, description: '重要度', default: Significance.MINOR })
  @IsOptional()
  @IsEnum(Significance)
  significance?: Significance;

  @ApiPropertyOptional({ description: '管理・対策措置' })
  @IsOptional()
  @IsString()
  controlMeasure?: string;

  @ApiPropertyOptional({ description: '法的義務の有無', default: false })
  @IsOptional()
  @IsBoolean()
  isLegallyRequired?: boolean;

  @ApiPropertyOptional({ description: 'レビュー実施日 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  reviewedAt?: string;
}
