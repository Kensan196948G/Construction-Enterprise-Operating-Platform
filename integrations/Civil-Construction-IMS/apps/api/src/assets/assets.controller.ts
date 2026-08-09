import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import {
  AssetsService,
  CreateAssetDto,
  UpdateAssetDto,
  CreateMaintenancePlanDto,
  UpdateMaintenancePlanDto,
  CreateAssetInspectionDto,
  UpdateAssetInspectionDto,
  ListAssetsFilter,
} from './assets.service';

@ApiTags('アセット管理 (ISO 55001)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'assets', version: '1' })
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // ----------------------------------------------------------------
  // Asset (資産台帳)
  // ----------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: '資産一覧取得 (ISO 55001)',
    description: '資産管理台帳の一覧を返します。',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'assetType', required: false })
  @ApiQuery({ name: 'criticality', required: false })
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('assetType') assetType?: string,
    @Query('criticality') criticality?: string,
  ) {
    const filter: ListAssetsFilter = { status, category, assetType, criticality };
    return this.assetsService.findAll(filter, user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: '資産詳細取得' })
  @ApiParam({ name: 'id', description: '資産 UUID' })
  findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.assetsService.findById(id, user.organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '資産登録', description: 'ISO 55001 — 新規資産を台帳に登録します。' })
  @ApiResponse({ status: 201, description: '登録した資産' })
  @ApiResponse({ status: 403, description: 'アセット管理者権限が必要です' })
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: CurrentUserType) {
    return this.assetsService.create(dto, user.id, user.organizationId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '資産更新' })
  @ApiParam({ name: 'id', description: '資産 UUID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.update(id, dto, user.id, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '資産削除' })
  @ApiParam({ name: 'id', description: '資産 UUID' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.assetsService.delete(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // AssetMaintenancePlan (保全計画)
  // ----------------------------------------------------------------

  @Get('maintenance-plans/list')
  @ApiOperation({ summary: '保全計画一覧取得' })
  @ApiQuery({ name: 'assetId', required: false })
  findAllMaintenancePlans(@Query('assetId') assetId?: string) {
    return this.assetsService.findAllMaintenancePlans(assetId);
  }

  @Get('maintenance-plans/:id')
  @ApiOperation({ summary: '保全計画詳細取得' })
  @ApiParam({ name: 'id', description: '保全計画 UUID' })
  findMaintenancePlanById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.findMaintenancePlanById(id, user.organizationId);
  }

  @Post('maintenance-plans')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '保全計画作成' })
  createMaintenancePlan(
    @Body() dto: CreateMaintenancePlanDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.createMaintenancePlan(dto, user.id, user.organizationId);
  }

  @Put('maintenance-plans/:id')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '保全計画更新' })
  @ApiParam({ name: 'id', description: '保全計画 UUID' })
  updateMaintenancePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenancePlanDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.updateMaintenancePlan(id, dto, user.id, user.organizationId);
  }

  @Delete('maintenance-plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '保全計画削除' })
  @ApiParam({ name: 'id', description: '保全計画 UUID' })
  deleteMaintenancePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.deleteMaintenancePlan(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // AssetInspection (点検記録)
  // ----------------------------------------------------------------

  @Get('inspections/list')
  @ApiOperation({ summary: '資産点検一覧取得' })
  @ApiQuery({ name: 'assetId', required: false })
  findAllInspections(@Query('assetId') assetId?: string) {
    return this.assetsService.findAllInspections(assetId);
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: '資産点検詳細取得' })
  @ApiParam({ name: 'id', description: '点検記録 UUID' })
  findInspectionById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.assetsService.findInspectionById(id, user.organizationId);
  }

  @Post('inspections')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '資産点検作成' })
  createInspection(@Body() dto: CreateAssetInspectionDto, @CurrentUser() user: CurrentUserType) {
    return this.assetsService.createInspection(dto, user.id, user.organizationId);
  }

  @Put('inspections/:id')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '資産点検更新' })
  @ApiParam({ name: 'id', description: '点検記録 UUID' })
  updateInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetInspectionDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.updateInspection(id, dto, user.id, user.organizationId);
  }

  @Delete('inspections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '資産点検削除' })
  @ApiParam({ name: 'id', description: '点検記録 UUID' })
  deleteInspection(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.assetsService.deleteInspection(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // AssetRiskAssessment (リスク評価 — ISO 55001 §4.2)
  // ----------------------------------------------------------------

  @Get(':assetId/risk-assessments')
  @ApiOperation({
    summary: 'リスク評価一覧取得',
    description: 'ISO 55001 §4.2 — 資産リスク評価履歴',
  })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  findRiskAssessments(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.findRiskAssessments(assetId, user.organizationId);
  }

  @Post(':assetId/risk-assessments')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'リスク評価登録',
    description: 'ISO 55001 §4.2 — 資産リスク評価を記録する',
  })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  createRiskAssessment(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.createRiskAssessment(assetId, dto, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // AssetDisposal (廃棄・除却 — ISO 55001 §6.2)
  // ----------------------------------------------------------------

  @Get(':assetId/disposals')
  @ApiOperation({ summary: '廃棄記録一覧取得', description: 'ISO 55001 — 資産廃棄・除却記録' })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  findDisposals(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.findDisposals(assetId, user.organizationId);
  }

  @Post(':assetId/disposals')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '廃棄記録登録',
    description: 'ISO 55001 §6.2 — 資産廃棄・除却を記録する',
  })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  createDisposal(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.createDisposal(assetId, dto, user.id, user.organizationId);
  }

  @Patch(':assetId/disposals/:disposalId/approve')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: '廃棄承認',
    description: '廃棄記録を承認し、資産を DISPOSED 状態に移行する。ISO_MANAGER 以上の権限が必要。',
  })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  @ApiParam({ name: 'disposalId', description: '廃棄記録 UUID' })
  approveDisposal(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Param('disposalId', ParseUUIDPipe) disposalId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.approveDisposal(assetId, disposalId, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // AssetHandover (引渡し管理 — ISO 55001)
  // ----------------------------------------------------------------

  @Get(':assetId/handovers')
  @ApiOperation({ summary: '引渡し一覧取得', description: 'ISO 55001 — 資産引渡し記録' })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  findHandovers(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.findHandovers(assetId, user.organizationId);
  }

  @Post(':assetId/handovers')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '引渡し記録登録', description: 'ISO 55001 — 資産引渡しを記録する' })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  createHandover(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.createHandover(assetId, dto, user.id, user.organizationId);
  }

  @Patch(':assetId/handovers/:handoverId/complete')
  @UseGuards(RolesGuard)
  @Roles('ASSET_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '引渡し完了', description: '資産引渡しを完了状態にする' })
  @ApiParam({ name: 'assetId', description: '資産 UUID' })
  @ApiParam({ name: 'handoverId', description: '引渡し UUID' })
  completeHandover(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Param('handoverId', ParseUUIDPipe) handoverId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.assetsService.completeHandover(assetId, handoverId, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Dashboard / KPI
  // ----------------------------------------------------------------

  @Get('summary/organization')
  @ApiOperation({
    summary: '組織 Asset KPI サマリー',
    description: 'ISO 55001 — アセット状態・点検・保全の組織単位集計',
  })
  getOrgAssetSummary(@CurrentUser() user: CurrentUserType) {
    return this.assetsService.getOrgAssetSummary(user.organizationId);
  }
}
