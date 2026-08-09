import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentStatus } from '@prisma/client';

export class DocumentQueryDto {
  @ApiPropertyOptional({ description: 'プロジェクト UUID でフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'カテゴリ UUID でフィルタ' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ステータスでフィルタ',
    enum: DocumentStatus,
  })
  @IsOptional()
  @IsIn(Object.values(DocumentStatus))
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'タイトル・文書番号のキーワード検索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'ページ番号 (1始まり)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '1ページ件数 (最大100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
