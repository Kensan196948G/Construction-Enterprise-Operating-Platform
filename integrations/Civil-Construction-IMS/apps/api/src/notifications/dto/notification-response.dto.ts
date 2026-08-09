import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({ description: '通知 UUID' })
  id!: string;

  @ApiProperty({ description: '受信者ユーザー ID' })
  userId!: string;

  @ApiProperty({ enum: NotificationType, description: '通知種別' })
  type!: NotificationType;

  @ApiProperty({ description: '通知タイトル' })
  title!: string;

  @ApiProperty({ description: '通知本文' })
  body!: string;

  @ApiPropertyOptional({ description: '関連エンティティ種別 (例: Document)' })
  entityType?: string;

  @ApiPropertyOptional({ description: '関連エンティティ UUID' })
  entityId?: string;

  @ApiProperty({ description: '既読フラグ' })
  isRead!: boolean;

  @ApiProperty({ description: '送信日時 (ISO 8601)' })
  sentAt!: string;

  @ApiPropertyOptional({ description: '既読日時 (ISO 8601)' })
  readAt?: string;

  @ApiProperty({ enum: NotificationChannel, description: '通知チャネル' })
  channel!: NotificationChannel;
}
