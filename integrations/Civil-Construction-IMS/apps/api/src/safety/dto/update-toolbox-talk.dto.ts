import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateToolboxTalkDto {
  @ApiPropertyOptional({ description: '実施日時 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  conductedAt?: string;

  @ApiPropertyOptional({ description: '実施場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'テーマ・議題' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic?: string;

  @ApiPropertyOptional({ description: '内容・詳細' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'リーダー名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  leaderName?: string;
}
