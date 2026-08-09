import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CdeStatus } from '@prisma/client';

export class UpdateCdeStatusDto {
  @ApiProperty({
    enum: CdeStatus,
    description: '遷移先 CDE ステータス',
    example: CdeStatus.SHARED,
  })
  @IsEnum(CdeStatus)
  @IsNotEmpty()
  cdeStatus!: CdeStatus;

  @ApiPropertyOptional({
    description: 'ステータス変更理由 / コメント',
    example: '設計者レビュー完了のため Shared へ移行',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
