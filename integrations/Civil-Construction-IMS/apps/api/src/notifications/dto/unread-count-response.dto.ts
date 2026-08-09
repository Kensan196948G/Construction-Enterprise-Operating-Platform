import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
  @ApiProperty({ description: '未読通知件数' })
  unreadCount!: number;
}
