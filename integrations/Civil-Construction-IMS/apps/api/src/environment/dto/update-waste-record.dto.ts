import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateWasteRecordDto } from './create-waste-record.dto';

export class UpdateWasteRecordDto extends PartialType(CreateWasteRecordDto) {
  @ApiPropertyOptional({ description: '変更理由（監査証跡に記録）' })
  @IsOptional()
  @IsString()
  reason?: string;
}
