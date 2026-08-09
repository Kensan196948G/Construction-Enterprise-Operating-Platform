import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToolboxParticipantDto {
  @ApiProperty({ description: '参加者 User UUID' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'サイン日時 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  signedAt?: string;
}
