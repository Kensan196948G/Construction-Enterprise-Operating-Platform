import { PartialType } from '@nestjs/swagger';
import { CreateContainerDto } from './create-container.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReviewStatus, HandoverStatus } from '@prisma/client';

export class UpdateContainerDto extends PartialType(CreateContainerDto) {
  @ApiPropertyOptional({ enum: ReviewStatus, description: 'レビューステータス' })
  @IsEnum(ReviewStatus)
  @IsOptional()
  reviewStatus?: ReviewStatus;

  @ApiPropertyOptional({ enum: HandoverStatus, description: '引き渡しステータス' })
  @IsEnum(HandoverStatus)
  @IsOptional()
  handoverStatus?: HandoverStatus;
}
