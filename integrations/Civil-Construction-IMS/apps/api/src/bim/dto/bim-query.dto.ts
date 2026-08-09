import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CdeStatus, DocumentStatus } from '@prisma/client';

export class BimQueryDto {
  @ApiPropertyOptional({ description: 'プロジェクト UUID でフィルタ' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'BEP UUID でフィルタ' })
  @IsUUID()
  @IsOptional()
  bepId?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'ドキュメントステータスでフィルタ' })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: CdeStatus, description: 'CDE ステータスでフィルタ' })
  @IsEnum(CdeStatus)
  @IsOptional()
  cdeStatus?: CdeStatus;

  @ApiPropertyOptional({ description: '工種でフィルタ', example: 'structure' })
  @IsString()
  @IsOptional()
  discipline?: string;

  @ApiPropertyOptional({ description: 'ページ番号 (1 始まり)', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '1 ページあたりの件数', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
