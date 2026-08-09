import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ComplianceStatus } from '@prisma/client';

export class LegalRequirementQueryDto {
  @ApiPropertyOptional({ enum: ComplianceStatus, description: '遵守状況でフィルタ' })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  complianceStatus?: ComplianceStatus;
}
