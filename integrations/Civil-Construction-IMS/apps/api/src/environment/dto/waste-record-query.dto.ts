import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';

export class WasteRecordQueryDto {
  @ApiPropertyOptional({ description: 'プロジェクトIDでフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: '廃棄物種類でフィルタ' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  wasteType?: string;
}
