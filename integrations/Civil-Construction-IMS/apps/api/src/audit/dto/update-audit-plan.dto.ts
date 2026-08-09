import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAuditPlanDto } from './create-audit-plan.dto';

export class UpdateAuditPlanDto extends PartialType(
  OmitType(CreateAuditPlanDto, ['planNo', 'reason'] as const),
) {
  /** Not persisted directly; used only for audit trail reason field */
  @ApiPropertyOptional({ description: '操作理由（監査証跡用）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
