import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto], description: '通知一覧' })
  items!: NotificationResponseDto[];

  @ApiProperty({ description: '総件数' })
  total!: number;

  @ApiProperty({ description: '現在ページ' })
  page!: number;

  @ApiProperty({ description: '1ページあたり件数' })
  limit!: number;

  @ApiProperty({ description: '総ページ数' })
  totalPages!: number;
}
