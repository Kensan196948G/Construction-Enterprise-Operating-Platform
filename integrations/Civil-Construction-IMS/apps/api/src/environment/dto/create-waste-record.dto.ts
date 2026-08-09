import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsDecimal, MaxLength } from 'class-validator';

export class CreateWasteRecordDto {
  @ApiPropertyOptional({ description: 'プロジェクトID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: '廃棄物種類（例: 産業廃棄物, 建設廃棄物, 有害廃棄物）' })
  @IsString()
  @MaxLength(100)
  wasteType!: string;

  @ApiProperty({ description: '数量（小数可）' })
  @IsDecimal()
  quantity!: string;

  @ApiProperty({ description: '単位（例: kg, m3, 本）' })
  @IsString()
  @MaxLength(20)
  unit!: string;

  @ApiPropertyOptional({ description: '処理方法' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  disposalMethod?: string;

  @ApiPropertyOptional({ description: '処理日 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  disposalDate?: string;

  @ApiPropertyOptional({ description: '処理業者名' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contractor?: string;

  @ApiPropertyOptional({ description: 'マニフェスト番号' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manifestNo?: string;
}
