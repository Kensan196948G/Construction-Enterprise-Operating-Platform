import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EnvironmentService } from './environment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import {
  CreateEnvironmentalAspectDto,
  UpdateEnvironmentalAspectDto,
  CreateLegalRequirementDto,
  UpdateLegalRequirementDto,
  CreateWasteRecordDto,
  UpdateWasteRecordDto,
  EnvironmentalAspectQueryDto,
  LegalRequirementQueryDto,
  WasteRecordQueryDto,
} from './dto';

@ApiTags('環境管理 (ISO 14001)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'environment', version: '1' })
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  // ──────────────────────────────────────────────────────────
  // Environmental Aspects (環境側面)
  // ──────────────────────────────────────────────────────────

  @Get('aspects')
  @ApiOperation({
    summary: '環境側面一覧取得',
    description: 'ISO 14001 環境側面・環境影響の一覧を取得します。',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'プロジェクトIDでフィルタ' })
  @ApiQuery({ name: 'significance', required: false, description: '重要度でフィルタ' })
  @ApiResponse({ status: 200, description: '環境側面一覧' })
  findAllAspects(
    @Query() query: EnvironmentalAspectQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.findAllAspects(query, user.organizationId);
  }

  @Get('aspects/:id')
  @ApiOperation({ summary: '環境側面詳細取得' })
  @ApiParam({ name: 'id', description: '環境側面ID (UUID)' })
  @ApiResponse({ status: 200, description: '環境側面詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  findOneAspect(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.findOneAspect(id, user.organizationId);
  }

  @Post('aspects')
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '環境側面登録',
    description: '新規環境側面・環境影響を登録します。',
  })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  createAspect(@Body() dto: CreateEnvironmentalAspectDto, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.createAspect(dto, user.id, user.organizationId);
  }

  @Put('aspects/:id')
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '環境側面更新' })
  @ApiParam({ name: 'id', description: '環境側面ID (UUID)' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  updateAspect(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnvironmentalAspectDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.updateAspect(id, dto, user.id, user.organizationId);
  }

  @Delete('aspects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '環境側面削除' })
  @ApiParam({ name: 'id', description: '環境側面ID (UUID)' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  removeAspect(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.removeAspect(id, user.id, user.organizationId);
  }

  // ──────────────────────────────────────────────────────────
  // Legal Requirements (法規制要求事項)
  // ──────────────────────────────────────────────────────────

  @Get('legal-requirements')
  @ApiOperation({
    summary: '法規制要求事項一覧取得',
    description: '適用法令・法規制要求事項の一覧を取得します。',
  })
  @ApiQuery({ name: 'complianceStatus', required: false, description: '遵守状況でフィルタ' })
  @ApiResponse({ status: 200, description: '法規制要求事項一覧' })
  findAllLegalRequirements(
    @Query() query: LegalRequirementQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.findAllLegalRequirements(query, user.organizationId);
  }

  @Get('legal-requirements/:id')
  @ApiOperation({ summary: '法規制要求事項詳細取得' })
  @ApiParam({ name: 'id', description: '法規制要求事項ID (UUID)' })
  @ApiResponse({ status: 200, description: '法規制要求事項詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  findOneLegalRequirement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.findOneLegalRequirement(id, user.organizationId);
  }

  @Post('legal-requirements')
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '法規制要求事項登録',
    description: '新規適用法令・法規制要求事項を登録します。',
  })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  createLegalRequirement(
    @Body() dto: CreateLegalRequirementDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.createLegalRequirement(dto, user.id, user.organizationId);
  }

  @Put('legal-requirements/:id')
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '法規制要求事項更新' })
  @ApiParam({ name: 'id', description: '法規制要求事項ID (UUID)' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  updateLegalRequirement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegalRequirementDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.updateLegalRequirement(id, dto, user.id, user.organizationId);
  }

  @Delete('legal-requirements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '法規制要求事項削除' })
  @ApiParam({ name: 'id', description: '法規制要求事項ID (UUID)' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  removeLegalRequirement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.removeLegalRequirement(id, user.id, user.organizationId);
  }

  // ──────────────────────────────────────────────────────────
  // Waste Records (廃棄物管理記録)
  // ──────────────────────────────────────────────────────────

  @Get('waste-records')
  @ApiOperation({
    summary: '廃棄物記録一覧取得',
    description: '建設廃棄物・産業廃棄物の処理記録一覧を取得します。',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'プロジェクトIDでフィルタ' })
  @ApiQuery({ name: 'wasteType', required: false, description: '廃棄物種類でフィルタ' })
  @ApiResponse({ status: 200, description: '廃棄物記録一覧' })
  findAllWasteRecords(@Query() query: WasteRecordQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.findAllWasteRecords(query, user.organizationId);
  }

  @Get('waste-records/:id')
  @ApiOperation({ summary: '廃棄物記録詳細取得' })
  @ApiParam({ name: 'id', description: '廃棄物記録ID (UUID)' })
  @ApiResponse({ status: 200, description: '廃棄物記録詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  findOneWasteRecord(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.findOneWasteRecord(id, user.organizationId);
  }

  @Post('waste-records')
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({
    summary: '廃棄物記録登録',
    description: '建設廃棄物・産業廃棄物の処理記録を登録します。',
  })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 403, description: '廃棄物記録登録権限が必要です' })
  createWasteRecord(@Body() dto: CreateWasteRecordDto, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.createWasteRecord(dto, user.id, user.organizationId);
  }

  @Put('waste-records/:id')
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '廃棄物記録更新' })
  @ApiParam({ name: 'id', description: '廃棄物記録ID (UUID)' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '廃棄物記録更新権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  updateWasteRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWasteRecordDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.environmentService.updateWasteRecord(id, dto, user.id, user.organizationId);
  }

  @Delete('waste-records/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ENV_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '廃棄物記録削除' })
  @ApiParam({ name: 'id', description: '廃棄物記録ID (UUID)' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '環境管理責任者権限が必要です' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  removeWasteRecord(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.environmentService.removeWasteRecord(id, user.id, user.organizationId);
  }
}
