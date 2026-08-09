import { IsString, IsUUID, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateToolboxTalkDto {
  @ApiProperty({ description: 'KY活動番号 (一意)', example: 'TBT-2026-001' })
  @IsString()
  @MaxLength(50)
  talkNo!: string;

  @ApiPropertyOptional({ description: '関連プロジェクト UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: '実施日時 (ISO 8601)' })
  @IsDateString()
  conductedAt!: string;

  @ApiPropertyOptional({ description: '実施場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ description: 'テーマ・議題', example: '高所作業の安全確認' })
  @IsString()
  @MaxLength(255)
  topic!: string;

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
