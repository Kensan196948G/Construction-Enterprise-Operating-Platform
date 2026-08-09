import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAuditFindingDto } from './create-audit-finding.dto';

export class UpdateAuditFindingDto extends PartialType(
  OmitType(CreateAuditFindingDto, ['reason'] as const),
) {
  /** Not persisted directly; used only for audit trail reason field */
  @ApiPropertyOptional({ description: '操作理由（監査証跡用）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
