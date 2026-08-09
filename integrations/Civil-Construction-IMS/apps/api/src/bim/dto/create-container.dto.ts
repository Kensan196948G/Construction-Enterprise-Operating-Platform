import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { CdeStatus } from '@prisma/client';

export class CreateContainerDto {
  @ApiPropertyOptional({ description: '関連 BEP UUID' })
  @IsUUID()
  @IsOptional()
  bepId?: string;

  @ApiProperty({
    description: '情報コンテナ コード (命名規則準拠)',
    example: 'PROJ001-STR-MOD-ZN01-L01',
  })
  @IsString()
  @IsNotEmpty()
  containerCode!: string;

  @ApiProperty({ description: 'タイトル', example: '橋梁上部工 構造モデル' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: '工種 / 専門領域',
    example: 'structure',
    enum: ['architecture', 'structure', 'mep', 'civil', 'geotechnical'],
  })
  @IsString()
  @IsOptional()
  discipline?: string;

  @ApiPropertyOptional({ enum: CdeStatus, default: CdeStatus.WORK_IN_PROGRESS })
  @IsEnum(CdeStatus)
  @IsOptional()
  cdeStatus?: CdeStatus;

  @ApiPropertyOptional({ description: '外部 CDE システム上の ID' })
  @IsString()
  @IsOptional()
  cdeExternalId?: string;

  @ApiPropertyOptional({ description: 'オブジェクトストレージ パス' })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiPropertyOptional({ description: 'ファイルバージョン', example: 'P01' })
  @IsString()
  @IsOptional()
  fileVersion?: string;
}
