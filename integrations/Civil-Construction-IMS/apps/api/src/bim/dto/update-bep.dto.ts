import { PartialType } from '@nestjs/swagger';
import { CreateBepDto } from './create-bep.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString, IsUUID } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class UpdateBepDto extends PartialType(CreateBepDto) {
  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: '承認日時 (ISO 8601)', example: '2026-06-01T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  approvedAt?: string;

  @ApiPropertyOptional({ description: '承認者 UUID' })
  @IsUUID()
  @IsOptional()
  approvedBy?: string;
}
