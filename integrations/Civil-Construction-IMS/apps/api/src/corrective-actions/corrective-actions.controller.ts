import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { CorrectiveActionsService } from './corrective-actions.service';
import {
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  QueryCorrectiveActionDto,
} from './dto';

@ApiTags('是正処置 (ISO 9001/14001)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'corrective-actions', version: '1' })
export class CorrectiveActionsController {
  constructor(private readonly caService: CorrectiveActionsService) {}

  @Get()
  @ApiOperation({
    summary: '是正処置一覧取得',
    description: 'ISO 9001/14001 是正処置・予防処置の一覧を取得します。',
  })
  @ApiResponse({ status: 200, description: '是正処置一覧' })
  findAll(@Query() query: QueryCorrectiveActionDto, @CurrentUser() user: CurrentUserType) {
    return this.caService.findAll(query, user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: '是正処置詳細取得' })
  @ApiParam({ name: 'id', description: '是正処置 UUID' })
  @ApiResponse({ status: 200, description: '是正処置詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.caService.findOne(id, user.organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '是正処置登録',
    description: '不適合・監査所見・クレーム等を起点とした是正処置を登録します。',
  })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 403, description: '是正処置登録権限が必要です' })
  @ApiResponse({ status: 409, description: 'CA番号が重複しています' })
  create(@Body() dto: CreateCorrectiveActionDto, @CurrentUser() user: CurrentUserType) {
    return this.caService.create(dto, user.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '是正処置更新' })
  @ApiParam({ name: 'id', description: '是正処置 UUID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '是正処置更新権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCorrectiveActionDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.caService.update(id, dto, user.id, user.organizationId);
  }

  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '是正処置クローズ',
    description: '是正処置を完了・クローズします。',
  })
  @ApiParam({ name: 'id', description: '是正処置 UUID' })
  @ApiResponse({ status: 200, description: 'クローズ成功' })
  @ApiResponse({ status: 403, description: '是正処置クローズ権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.caService.close(id, user.id, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '是正処置削除' })
  @ApiParam({ name: 'id', description: '是正処置 UUID' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '是正処置削除権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.caService.remove(id, user.id, user.organizationId);
  }
}
