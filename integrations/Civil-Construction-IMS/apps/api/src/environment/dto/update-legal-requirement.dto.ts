import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateLegalRequirementDto } from './create-legal-requirement.dto';

export class UpdateLegalRequirementDto extends PartialType(CreateLegalRequirementDto) {
  @ApiPropertyOptional({ description: '変更理由（監査証跡に記録）' })
  @IsOptional()
  @IsString()
  reason?: string;
}
