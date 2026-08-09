import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: '文書タイトル' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '文書カテゴリ UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'プロジェクト UUID (null を渡すと紐付けを解除)' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;
}
