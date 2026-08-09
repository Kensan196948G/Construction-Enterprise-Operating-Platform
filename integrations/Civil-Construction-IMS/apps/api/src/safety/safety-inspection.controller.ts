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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { SafetyInspectionService } from './safety-inspection.service';
import {
  CreateSafetyInspectionDto,
  UpdateSafetyInspectionDto,
  QuerySafetyInspectionDto,
} from './dto';

@ApiTags('安全パトロール (ISO 45001)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'safety/inspections', version: '1' })
export class SafetyInspectionController {
  constructor(private readonly inspectionService: SafetyInspectionService) {}

  @Get()
  @ApiOperation({
    summary: '安全パトロール一覧取得',
    description: 'ISO 45001 §9.1 に基づく安全パトロール記録一覧を返す',
  })
  @ApiResponse({ status: 200, description: 'パトロール記録一覧' })
  findAll(@Query() query: QuerySafetyInspectionDto, @CurrentUser() user: CurrentUserType) {
    return this.inspectionService.findAll(query, user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: '安全パトロール詳細取得' })
  @ApiParam({ name: 'id', description: 'パトロール UUID' })
  @ApiResponse({ status: 200, description: 'パトロール詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.inspectionService.findOne(id, user.organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({
    summary: '安全パトロール記録登録',
    description: 'ISO 45001 §9.1 に基づく安全パトロール記録を作成する',
  })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  create(@Body() dto: CreateSafetyInspectionDto, @CurrentUser() user: CurrentUserType) {
    return this.inspectionService.create(dto, user.id, user.organizationId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '安全パトロール更新' })
  @ApiParam({ name: 'id', description: 'パトロール UUID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSafetyInspectionDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.inspectionService.update(id, dto, user.id, user.organizationId);
  }

  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '安全パトロールクローズ', description: 'パトロールを完了状態にする' })
  @ApiParam({ name: 'id', description: 'パトロール UUID' })
  @ApiResponse({ status: 200, description: 'クローズ成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.inspectionService.close(id, user.id, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '安全パトロール削除' })
  @ApiParam({ name: 'id', description: 'パトロール UUID' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.inspectionService.remove(id, user.id, user.organizationId);
  }
}
