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
import { BimService } from './bim.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import {
  CreateEirDto,
  UpdateEirDto,
  CreateBepDto,
  UpdateBepDto,
  CreateContainerDto,
  UpdateContainerDto,
  UpdateCdeStatusDto,
  BimQueryDto,
} from './dto';

/** ISO 19650 BIM/CIM 情報管理 API */
@ApiTags('BIM / ISO 19650')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'bim', version: '1' })
export class BimController {
  constructor(private readonly bimService: BimService) {}

  // ----------------------------------------------------------------
  // EIR (Exchange Information Requirements / 発注者情報要件)
  // ----------------------------------------------------------------

  @Post('eirs')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'EIR 作成',
    description: 'ISO 19650 発注者情報要件 (EIR) を新規作成する',
  })
  @ApiResponse({ status: 201, description: 'EIR を作成しました' })
  @ApiResponse({ status: 403, description: 'BIM 管理者権限が必要です' })
  createEir(@Body() dto: CreateEirDto, @CurrentUser() user: CurrentUserType) {
    return this.bimService.createEir(dto, user.id, user.organizationId);
  }

  @Get('eirs')
  @ApiOperation({ summary: 'EIR 一覧取得', description: 'EIR の一覧をページング付きで取得する' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllEirs(@Query() query: BimQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findAllEirs(query, user.organizationId);
  }

  @Get('eirs/:id')
  @ApiOperation({ summary: 'EIR 詳細取得' })
  @ApiParam({ name: 'id', description: 'EIR UUID' })
  @ApiResponse({ status: 404, description: 'EIR が見つかりません' })
  findEirById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findEirById(id, user.organizationId);
  }

  @Put('eirs/:id')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'EIR 更新' })
  @ApiParam({ name: 'id', description: 'EIR UUID' })
  updateEir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEirDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.updateEir(id, dto, user.id, user.organizationId);
  }

  @Delete('eirs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'EIR 削除' })
  @ApiParam({ name: 'id', description: 'EIR UUID' })
  deleteEir(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.bimService.deleteEir(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // BEP (BIM Execution Plan / BIM 実行計画)
  // ----------------------------------------------------------------

  @Post('beps')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BEP 作成', description: 'ISO 19650 BIM 実行計画 (BEP) を新規作成する' })
  @ApiResponse({ status: 201, description: 'BEP を作成しました' })
  createBep(@Body() dto: CreateBepDto, @CurrentUser() user: CurrentUserType) {
    return this.bimService.createBep(dto, user.id, user.organizationId);
  }

  @Get('beps')
  @ApiOperation({ summary: 'BEP 一覧取得' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllBeps(@Query() query: BimQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findAllBeps(query, user.organizationId);
  }

  @Get('beps/:id')
  @ApiOperation({ summary: 'BEP 詳細取得（情報コンテナ一覧を含む）' })
  @ApiParam({ name: 'id', description: 'BEP UUID' })
  findBepById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findBepById(id, user.organizationId);
  }

  @Put('beps/:id')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BEP 更新' })
  @ApiParam({ name: 'id', description: 'BEP UUID' })
  updateBep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBepDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.updateBep(id, dto, user.id, user.organizationId);
  }

  @Delete('beps/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BEP 削除' })
  deleteBep(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.bimService.deleteBep(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Information Containers (CDE コンテナ管理)
  // ----------------------------------------------------------------

  @Post('containers')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '情報コンテナ 作成', description: 'ISO 19650 情報コンテナを登録する' })
  @ApiResponse({ status: 201, description: '情報コンテナを作成しました' })
  createContainer(@Body() dto: CreateContainerDto, @CurrentUser() user: CurrentUserType) {
    return this.bimService.createContainer(dto, user.id, user.organizationId);
  }

  @Get('containers')
  @ApiOperation({
    summary: '情報コンテナ 一覧取得',
    description: 'CDE ステータス・工種・BEP でフィルタ可能',
  })
  @ApiQuery({ name: 'bepId', required: false })
  @ApiQuery({ name: 'cdeStatus', required: false })
  @ApiQuery({ name: 'discipline', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllContainers(@Query() query: BimQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findAllContainers(query, user.organizationId);
  }

  @Get('containers/:id')
  @ApiOperation({ summary: '情報コンテナ 詳細取得' })
  @ApiParam({ name: 'id', description: '情報コンテナ UUID' })
  findContainerById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findContainerById(id, user.organizationId);
  }

  @Put('containers/:id')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '情報コンテナ 更新' })
  @ApiParam({ name: 'id', description: '情報コンテナ UUID' })
  updateContainer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContainerDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.updateContainer(id, dto, user.id, user.organizationId);
  }

  @Patch('containers/:id/cde-status')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'CDE ステータス遷移 (ISO 19650)',
    description: 'WIP → Shared → Published → Archived。ISO 19650 Table 1 に従う。',
  })
  @ApiParam({ name: 'id', description: '情報コンテナ UUID' })
  updateCdeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCdeStatusDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.updateCdeStatus(id, dto, user.id, user.organizationId);
  }

  @Delete('containers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '情報コンテナ 削除' })
  deleteContainer(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.bimService.deleteContainer(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Coordination Issues (ISO 19650 §5.7 — 干渉チェック・調整課題)
  // ----------------------------------------------------------------

  @Post('coordination-issues')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({
    summary: '調整課題 登録',
    description: 'ISO 19650 §5.7 — BIM モデル干渉チェック・調整課題を登録する',
  })
  @ApiResponse({ status: 201, description: '登録成功' })
  createCoordinationIssue(@Body() dto: any, @CurrentUser() user: CurrentUserType) {
    return this.bimService.createCoordinationIssue(dto, user.id, user.organizationId);
  }

  @Get('coordination-issues')
  @ApiOperation({ summary: '調整課題 一覧取得' })
  @ApiQuery({ name: 'bepId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'issueType', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllCoordinationIssues(@Query() query: any, @CurrentUser() user: CurrentUserType) {
    return this.bimService.findAllCoordinationIssues(query, user.organizationId);
  }

  @Get('coordination-issues/:id')
  @ApiOperation({ summary: '調整課題 詳細取得' })
  @ApiParam({ name: 'id', description: '調整課題 UUID' })
  findCoordinationIssueById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.findCoordinationIssueById(id, user.organizationId);
  }

  @Put('coordination-issues/:id')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'SITE_MANAGER')
  @ApiOperation({ summary: '調整課題 更新' })
  @ApiParam({ name: 'id', description: '調整課題 UUID' })
  updateCoordinationIssue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.updateCoordinationIssue(id, dto, user.id, user.organizationId);
  }

  @Patch('coordination-issues/:id/close')
  @UseGuards(RolesGuard)
  @Roles('BIM_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '調整課題 クローズ' })
  @ApiParam({ name: 'id', description: '調整課題 UUID' })
  closeCoordinationIssue(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.closeCoordinationIssue(id, user.id, user.organizationId);
  }

  // ----------------------------------------------------------------
  // Reports / Summary
  // ----------------------------------------------------------------

  @Get('projects/:projectId/summary')
  @ApiOperation({
    summary: 'プロジェクト BIM サマリー取得',
    description: 'BEP・EIR・情報コンテナの集計',
  })
  @ApiParam({ name: 'projectId', description: 'プロジェクト UUID' })
  getProjectBimSummary(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.bimService.getProjectBimSummary(projectId, user.organizationId);
  }
}
