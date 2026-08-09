import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
import { SafetyService } from './safety.service';
import {
  CreateHazardIdentificationDto,
  UpdateHazardIdentificationDto,
  CreateNearMissDto,
  UpdateNearMissDto,
  CloseNearMissDto,
  CreateSafetyEducationDto,
  UpdateSafetyEducationDto,
  AddParticipantDto,
  HazardFilterDto,
  NearMissFilterDto,
  EducationFilterDto,
} from './dto';

@ApiTags('safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'safety', version: '1' })
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  // ----------------------------------------------------------------
  // Hazard Identification (ISO 45001 §6.1)
  // ----------------------------------------------------------------

  @Post('hazards')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({
    summary: '危険源の特定を登録',
    description: 'ISO 45001 §6.1.2 に基づく危険源特定レコードを作成する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 403, description: '安全衛生管理者権限が必要です' })
  async createHazard(
    @Body() dto: CreateHazardIdentificationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.createHazard(dto, user.id, user.organizationId);
  }

  @Get('hazards')
  @ApiOperation({
    summary: '危険源一覧取得',
    description: 'プロジェクトまたは組織に紐づく危険源一覧を返す',
  })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'riskLevel', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listHazards(@Query() filter: HazardFilterDto, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.listHazards(filter, user.organizationId);
  }

  @Get('hazards/:id')
  @ApiOperation({ summary: '危険源詳細取得' })
  @ApiParam({ name: 'id', description: '危険源 ID (UUID)' })
  async getHazard(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.getHazard(id, user.organizationId);
  }

  @Put('hazards/:id')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '危険源情報を更新' })
  @ApiParam({ name: 'id', description: '危険源 ID (UUID)' })
  async updateHazard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHazardIdentificationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.updateHazard(id, dto, user.id, user.organizationId);
  }

  @Delete('hazards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '危険源を論理削除' })
  @ApiParam({ name: 'id', description: '危険源 ID (UUID)' })
  async deleteHazard(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    await this.safetyService.deleteHazard(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Near Miss (ISO 45001 §6.1 / §10.2)
  // ----------------------------------------------------------------

  @Post('near-misses')
  @ApiOperation({
    summary: 'ヒヤリハット報告を登録',
    description: 'ISO 45001 §10.2 に基づくヒヤリハット報告を作成する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  async createNearMiss(@Body() dto: CreateNearMissDto, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.createNearMiss(dto, user.id, user.organizationId);
  }

  @Get('near-misses')
  @ApiOperation({ summary: 'ヒヤリハット一覧取得' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listNearMisses(@Query() filter: NearMissFilterDto, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.listNearMisses(filter, user.organizationId);
  }

  @Get('near-misses/:id')
  @ApiOperation({ summary: 'ヒヤリハット詳細取得' })
  @ApiParam({ name: 'id', description: 'ヒヤリハット ID (UUID)' })
  async getNearMiss(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.getNearMiss(id, user.organizationId);
  }

  @Put('near-misses/:id')
  @ApiOperation({ summary: 'ヒヤリハット情報を更新' })
  @ApiParam({ name: 'id', description: 'ヒヤリハット ID (UUID)' })
  async updateNearMiss(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNearMissDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.updateNearMiss(id, dto, user.id, user.organizationId);
  }

  @Patch('near-misses/:id/close')
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'ヒヤリハットをクローズ',
    description: '是正・予防措置を記録してクローズ状態にする',
  })
  @ApiParam({ name: 'id', description: 'ヒヤリハット ID (UUID)' })
  async closeNearMiss(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseNearMissDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.closeNearMiss(id, dto, user.id, user.organizationId);
  }

  @Delete('near-misses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'ヒヤリハットを論理削除' })
  @ApiParam({ name: 'id', description: 'ヒヤリハット ID (UUID)' })
  async deleteNearMiss(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.safetyService.deleteNearMiss(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Safety Education (ISO 45001 §7.2 / §7.3)
  // ----------------------------------------------------------------

  @Post('educations')
  @ApiOperation({
    summary: '安全教育を登録',
    description: 'ISO 45001 §7.2 に基づく安全教育セッションを作成する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  async createEducation(
    @Body() dto: CreateSafetyEducationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.createEducation(dto, user.id, user.organizationId);
  }

  @Get('educations')
  @ApiOperation({ summary: '安全教育一覧取得' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'educationType', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listEducations(@Query() filter: EducationFilterDto, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.listEducations(filter, user.organizationId);
  }

  @Get('educations/:id')
  @ApiOperation({ summary: '安全教育詳細取得' })
  @ApiParam({ name: 'id', description: '安全教育 ID (UUID)' })
  async getEducation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.safetyService.getEducation(id, user.organizationId);
  }

  @Put('educations/:id')
  @ApiOperation({ summary: '安全教育情報を更新' })
  @ApiParam({ name: 'id', description: '安全教育 ID (UUID)' })
  async updateEducation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSafetyEducationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.updateEducation(id, dto, user.id, user.organizationId);
  }

  @Post('educations/:id/participants')
  @ApiOperation({
    summary: '安全教育参加者を追加',
    description: '教育セッションに参加者を登録する',
  })
  @ApiParam({ name: 'id', description: '安全教育 ID (UUID)' })
  async addParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddParticipantDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.addParticipant(id, dto, user.id, user.organizationId);
  }

  @Delete('educations/:id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '安全教育参加者を削除' })
  @ApiParam({ name: 'id', description: '安全教育 ID (UUID)' })
  @ApiParam({ name: 'userId', description: '削除する参加者のユーザー ID (UUID)' })
  async removeParticipant(
    @Param('id', ParseUUIDPipe) educationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.safetyService.removeParticipant(educationId, userId, user.id, user.organizationId);
  }

  @Delete('educations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('SAFETY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '安全教育を論理削除' })
  @ApiParam({ name: 'id', description: '安全教育 ID (UUID)' })
  async deleteEducation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.safetyService.deleteEducation(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Dashboard / Summary
  // ----------------------------------------------------------------

  @Get('dashboard')
  @ApiOperation({
    summary: '安全衛生ダッシュボード',
    description: 'プロジェクト別の安全 KPI サマリーを返す',
  })
  @ApiQuery({ name: 'projectId', required: false })
  async getDashboard(
    @Query('projectId') projectId: string | undefined,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.safetyService.getDashboard(user.organizationId, projectId);
  }
}
