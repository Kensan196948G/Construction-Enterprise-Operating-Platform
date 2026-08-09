import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListWorkflowRequestsDto {
  @ApiPropertyOptional({ description: 'ステータスでフィルタ' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({ description: 'ターゲット種別でフィルタ' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetType?: string;

  @ApiPropertyOptional({ description: '申請者 UUID でフィルタ' })
  @IsOptional()
  @IsUUID()
  requesterId?: string;
}
