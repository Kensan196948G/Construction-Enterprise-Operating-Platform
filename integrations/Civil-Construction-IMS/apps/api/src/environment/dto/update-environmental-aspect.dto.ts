import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEnvironmentalAspectDto } from './create-environmental-aspect.dto';

export class UpdateEnvironmentalAspectDto extends PartialType(CreateEnvironmentalAspectDto) {
  @ApiPropertyOptional({ description: '変更理由（監査証跡に記録）' })
  @IsOptional()
  @IsString()
  reason?: string;
}
