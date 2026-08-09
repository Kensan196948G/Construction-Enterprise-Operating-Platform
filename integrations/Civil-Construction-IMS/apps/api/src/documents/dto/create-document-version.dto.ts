import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsInt, Min } from 'class-validator';

export class CreateDocumentVersionDto {
  @ApiPropertyOptional({ description: 'このバージョンのタイトル（省略時は親文書タイトルを継承）' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'テキストコンテンツ' })
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

  @ApiPropertyOptional({ description: 'MIMEタイプ' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ description: '変更メモ', example: '図面更新に伴い改訂' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}
