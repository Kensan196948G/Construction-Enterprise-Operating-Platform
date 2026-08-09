import { PartialType } from '@nestjs/swagger';
import { CreateEirDto } from './create-eir.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class UpdateEirDto extends PartialType(CreateEirDto) {
  @ApiPropertyOptional({ enum: DocumentStatus, description: 'ドキュメントステータス' })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;
}
