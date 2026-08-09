import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentType, Severity, CorrectiveActionStatus } from '@prisma/client';

export class QuerySafetyIncidentDto {
  @ApiPropertyOptional({ description: 'プロジェクト UUID でフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'インシデント種別でフィルタ', enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  incidentType?: IncidentType;

  @ApiPropertyOptional({ description: 'ステータスでフィルタ', enum: CorrectiveActionStatus })
  @IsOptional()
  @IsEnum(CorrectiveActionStatus)
  status?: CorrectiveActionStatus;

  @ApiPropertyOptional({ description: '重大度でフィルタ', enum: Severity })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ description: 'ページ番号', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '1ページ件数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
