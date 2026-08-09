import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { SafetyIncidentService } from './safety-incident.service';

@ApiTags('事故・インシデント報告 (ISO 45001)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'safety/incidents', version: '1' })
export class SafetyIncidentController {
  constructor(private readonly safetyIncidentService: SafetyIncidentService) {}

  // ----------------------------------------------------------------
  // GET /safety/incidents
  // ----------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: '事故・インシデント一覧取得',
    description: 'ISO 45001 §10.3 に基づく事故・インシデント一覧を返す',
  })
  @ApiQuery({ name: 'status', required: false, description: 'ステータスでフィルタ' })
  @ApiQuery({ name: 'incidentType', required: false, description: 'インシデント種別でフィルタ' })
  @ApiQuery({ name: 'projectId', required: false, description: 'プロジェクト ID でフィルタ' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '一覧取得成功' })
  async findAll(@Query() query: any, @CurrentUser() user: CurrentUserType) {
    return this.safetyIncidentService.findAll(query, user.organizationId);
  }

  // ----------------------------------------------------------------
  // GET /safety/incidents/:id
  // ----------------------------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: '事故・インシデント詳細取得' })
  @ApiParam({ name: 'id', description: 'インシデント ID (UUID)' })
  @ApiResponse({ status: 200, description: '取得成功' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.safetyIncidentService.findOne(id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // POST /safety/incidents
  // ----------------------------------------------------------------

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '事故・インシデントを登録',
    description: 'ISO 45001 §10.3 に基づく事故・インシデントレコードを作成する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  @ApiResponse({ status: 409, description: 'インシデント番号が重複しています' })
  async create(@Body() dto: any, @CurrentUser() user: CurrentUserType) {
    return this.safetyIncidentService.create(dto, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // PUT /safety/incidents/:id
  // ----------------------------------------------------------------

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '事故・インシデント情報を更新' })
  @ApiParam({ name: 'id', description: 'インシデント ID (UUID)' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyIncidentService.update(id, dto, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // PATCH /safety/incidents/:id/close
  // ----------------------------------------------------------------

  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '事故・インシデントをクローズ',
    description: '調査・是正措置完了後にクローズ状態にする',
  })
  @ApiParam({ name: 'id', description: 'インシデント ID (UUID)' })
  @ApiResponse({ status: 200, description: 'クローズ成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  async close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.safetyIncidentService.close(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // DELETE /safety/incidents/:id
  // ----------------------------------------------------------------

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '事故・インシデントを削除' })
  @ApiParam({ name: 'id', description: 'インシデント ID (UUID)' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    await this.safetyIncidentService.remove(id, user.id, user.organizationId);
  }
}
