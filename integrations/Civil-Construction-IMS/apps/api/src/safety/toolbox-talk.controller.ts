import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { ToolboxTalkService } from './toolbox-talk.service';

@ApiTags('KY活動・危険予知 (ISO 45001)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'safety/toolbox-talks', version: '1' })
export class ToolboxTalkController {
  constructor(private readonly toolboxTalkService: ToolboxTalkService) {}

  // ----------------------------------------------------------------
  // ToolboxTalk CRUD
  // ----------------------------------------------------------------

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'SITE_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'KY活動（ツールボックストーク）を登録',
    description: 'ISO 45001 §8.2 に基づく危険予知活動（KYT）レコードを作成する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  @ApiResponse({ status: 409, description: 'talkNo が重複しています' })
  async create(@Body() dto: any, @CurrentUser() user: CurrentUserType) {
    return this.toolboxTalkService.create(dto, user.id, user.organizationId);
  }

  @Get()
  @ApiOperation({
    summary: 'KY活動一覧取得',
    description: '組織に紐づくKY活動（ツールボックストーク）の一覧を返す',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'プロジェクト ID でフィルタ' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() query: any, @CurrentUser() user: CurrentUserType) {
    return this.toolboxTalkService.findAll(query, user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'KY活動詳細取得' })
  @ApiParam({ name: 'id', description: 'ToolboxTalk ID (UUID)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.toolboxTalkService.findOne(id, user.organizationId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'SITE_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'KY活動情報を更新' })
  @ApiParam({ name: 'id', description: 'ToolboxTalk ID (UUID)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.toolboxTalkService.update(id, dto, user.id, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'SITE_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'KY活動を削除' })
  @ApiParam({ name: 'id', description: 'ToolboxTalk ID (UUID)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    await this.toolboxTalkService.remove(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Participant management
  // ----------------------------------------------------------------

  @Post(':id/participants')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'SITE_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'KY活動参加者を追加',
    description: '指定したKY活動に参加者を登録する（upsert）',
  })
  @ApiParam({ name: 'id', description: 'ToolboxTalk ID (UUID)' })
  @ApiResponse({ status: 201, description: '参加者を追加しました' })
  async addParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.toolboxTalkService.addParticipant(id, dto, user.id, user.organizationId);
  }

  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'SITE_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'KY活動参加者を削除' })
  @ApiParam({ name: 'id', description: 'ToolboxTalk ID (UUID)' })
  @ApiParam({ name: 'userId', description: '削除する参加者のユーザー ID (UUID)' })
  async removeParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.toolboxTalkService.removeParticipant(id, userId, user.id, user.organizationId);
  }
}
