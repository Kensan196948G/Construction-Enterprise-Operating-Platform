import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsInt, Min } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: '文書番号 (一意)', example: 'DOC-2026-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentNo!: string;

  @ApiProperty({ description: '文書タイトル', example: '品質管理計画書' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: '文書カテゴリ UUID' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ description: 'プロジェクト UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: '初版テキストコンテンツ' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'オブジェクトストレージのファイルパス' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  filePath?: string;

  @ApiPropertyOptional({ description: 'ファイルサイズ (バイト)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIMEタイプ', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ description: '変更メモ', example: '初版作成' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}
