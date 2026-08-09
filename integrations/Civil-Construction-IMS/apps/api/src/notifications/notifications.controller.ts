import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationListResponseDto } from './dto/notification-list-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * List notifications for the authenticated user (paginated).
   */
  @Get()
  @ApiOperation({
    summary: '通知一覧取得',
    description: '認証ユーザーの通知一覧を取得します（ページネーション対応）。',
  })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: '未読のみ取得' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'ページ番号 (1始まり)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '1ページあたりの件数 (最大100)',
  })
  @ApiResponse({ status: 200, description: '通知一覧', type: NotificationListResponseDto })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<NotificationListResponseDto> {
    const userId = req.user.id;
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    const unreadOnlyBool = unreadOnly === 'true';

    return this.notificationsService.findAll(userId, {
      unreadOnly: unreadOnlyBool,
      page: pageNum,
      limit: limitNum,
    });
  }

  /**
   * GET /notifications/unread-count
   * Return count of unread notifications for the authenticated user.
   */
  @Get('unread-count')
  @ApiOperation({
    summary: '未読通知件数取得',
    description: '認証ユーザーの未読通知件数を返します。',
  })
  @ApiResponse({ status: 200, description: '未読件数', type: UnreadCountResponseDto })
  async getUnreadCount(@Request() req: AuthenticatedRequest): Promise<UnreadCountResponseDto> {
    const count = await this.notificationsService.countUnread(req.user.id);
    return { unreadCount: count };
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: '通知既読マーク',
    description: '指定した通知を既読にします。',
  })
  @ApiParam({ name: 'id', description: '通知 UUID' })
  @ApiResponse({ status: 200, description: '更新後の通知', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: '通知が見つかりません' })
  async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications of the authenticated user as read.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '全通知一括既読',
    description: '認証ユーザーの全通知を既読にします。',
  })
  @ApiResponse({ status: 204, description: '一括既読完了' })
  async markAllAsRead(@Request() req: AuthenticatedRequest): Promise<void> {
    await this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * DELETE /notifications/:id
   * Delete (soft-delete equivalent: logical remove) a notification.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '通知削除',
    description: '指定した通知を削除します（物理削除）。',
  })
  @ApiParam({ name: 'id', description: '通知 UUID' })
  @ApiResponse({ status: 204, description: '削除完了' })
  @ApiResponse({ status: 404, description: '通知が見つかりません' })
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.notificationsService.remove(req.user.id, id);
  }

  /**
   * DELETE /notifications
   * Delete all read notifications for the authenticated user.
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '既読通知一括削除',
    description: '認証ユーザーの既読済み通知を全て削除します。',
  })
  @ApiResponse({ status: 204, description: '一括削除完了' })
  async removeAllRead(@Request() req: AuthenticatedRequest): Promise<void> {
    await this.notificationsService.removeAllRead(req.user.id);
  }
}
