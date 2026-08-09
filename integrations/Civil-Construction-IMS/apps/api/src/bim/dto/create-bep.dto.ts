import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateBepDto {
  @ApiProperty({ description: 'プロジェクト UUID' })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: 'BEP タイトル', example: '○○橋梁工事 BIM実行計画書 v1' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: '命名規則 (ファイル・コンテナ命名規則テンプレート)',
    example: '[Proj]-[Disc]-[Type]-[Zone]-[Level]',
  })
  @IsString()
  @IsOptional()
  namingConvention?: string;
}
