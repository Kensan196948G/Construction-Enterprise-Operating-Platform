import {
  Controller,
  Get,
  Post,
  Put,
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
import {
  IsmsService,
  AssetQuery,
  CreateAssetDto,
  UpdateAssetDto,
  CreateThreatDto,
  RiskAssessmentQuery,
  CreateRiskAssessmentDto,
  IncidentQuery,
  CreateIncidentDto,
} from './isms.service';

@ApiTags('isms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'isms', version: '1' })
export class IsmsController {
  constructor(private readonly ismsService: IsmsService) {}

  // ---------------------------------------------------------------
  // IsmsAsset endpoints
  // ---------------------------------------------------------------

  @Get('assets')
  @ApiOperation({
    summary: 'ISMS資産一覧取得',
    description: 'ISO/IEC 27001 A.8 に基づく情報資産一覧を返す（組織スコープ）',
  })
  @ApiQuery({ name: 'assetType', required: false })
  @ApiQuery({ name: 'classification', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '資産一覧' })
  async findAllAssets(@Query() query: AssetQuery, @CurrentUser() user: CurrentUserType) {
    return this.ismsService.findAllAssets(query, user.organizationId);
  }

  @Get('assets/:id')
  @ApiOperation({ summary: 'ISMS資産詳細取得' })
  @ApiParam({ name: 'id', description: '資産ID (UUID)' })
  @ApiResponse({ status: 200, description: '資産詳細' })
  @ApiResponse({ status: 404, description: '資産が見つかりません' })
  async findAssetById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.findAssetById(id, user.organizationId);
  }

  @Post('assets')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'ISMS資産の登録',
    description: 'ISO/IEC 27001 A.8.1 に基づく情報資産を新規登録する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 409, description: '資産番号が重複しています' })
  async createAsset(@Body() dto: CreateAssetDto, @CurrentUser() user: CurrentUserType) {
    return this.ismsService.createAsset(dto, user.id, user.organizationId);
  }

  @Put('assets/:id')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'ISMS資産の更新' })
  @ApiParam({ name: 'id', description: '資産ID (UUID)' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '資産が見つかりません' })
  async updateAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.updateAsset(id, dto, user.id, user.organizationId);
  }

  // ---------------------------------------------------------------
  // IsmsThreat endpoints
  // ---------------------------------------------------------------

  @Get('assets/:assetId/threats')
  @ApiOperation({
    summary: '資産に紐づく脅威一覧取得',
    description: '指定資産に対する脅威シナリオ一覧を返す',
  })
  @ApiParam({ name: 'assetId', description: '資産ID (UUID)' })
  @ApiResponse({ status: 200, description: '脅威一覧' })
  async findThreatsByAsset(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.findThreatsByAsset(assetId, user.organizationId);
  }

  @Post('assets/:assetId/threats')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '脅威シナリオの登録',
    description: 'ISO/IEC 27001 §6.1.2 に基づくリスクアセスメント用脅威を登録する',
  })
  @ApiParam({ name: 'assetId', description: '資産ID (UUID)' })
  @ApiResponse({ status: 201, description: '作成成功（riskScore = likelihood × impact）' })
  async createThreat(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: CreateThreatDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.createThreat(assetId, dto, user.id, user.organizationId);
  }

  @Patch('assets/:assetId/threats/:threatId/close')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '脅威のクローズ' })
  @ApiParam({ name: 'assetId', description: '資産ID (UUID)' })
  @ApiParam({ name: 'threatId', description: '脅威ID (UUID)' })
  @ApiResponse({ status: 200, description: 'クローズ成功' })
  async closeThreat(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Param('threatId', ParseUUIDPipe) threatId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.closeThreat(threatId, assetId, user.id, user.organizationId);
  }

  // ---------------------------------------------------------------
  // IsmsRiskAssessment endpoints
  // ---------------------------------------------------------------

  @Get('risk-assessments')
  @ApiOperation({
    summary: 'リスクアセスメント一覧取得',
    description: 'ISO/IEC 27001 §6.1 に基づくリスクアセスメント一覧を返す',
  })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiQuery({ name: 'overallRiskLevel', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'リスクアセスメント一覧' })
  async findAllRiskAssessments(
    @Query() query: RiskAssessmentQuery,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.findAllRiskAssessments(query, user.organizationId);
  }

  @Post('risk-assessments')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'リスクアセスメントの登録',
    description: 'ISO/IEC 27001 §6.1.2 に基づくリスクアセスメントを新規登録する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 409, description: 'アセスメント番号が重複しています' })
  async createRiskAssessment(
    @Body() dto: CreateRiskAssessmentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.createRiskAssessment(dto, user.id, user.organizationId);
  }

  // ---------------------------------------------------------------
  // IsmsIncident endpoints
  // ---------------------------------------------------------------

  @Get('incidents')
  @ApiOperation({
    summary: 'セキュリティインシデント一覧取得',
    description: 'ISO/IEC 27001 A.16 に基づくインシデント管理一覧を返す',
  })
  @ApiQuery({ name: 'incidentType', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'インシデント一覧' })
  async findAllIncidents(@Query() query: IncidentQuery, @CurrentUser() user: CurrentUserType) {
    return this.ismsService.findAllIncidents(query, user.organizationId);
  }

  @Post('incidents')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'セキュリティインシデントの登録',
    description: 'ISO/IEC 27001 A.16.1 に基づくインシデントを新規登録する',
  })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 409, description: 'インシデント番号が重複しています' })
  async createIncident(@Body() dto: CreateIncidentDto, @CurrentUser() user: CurrentUserType) {
    return this.ismsService.createIncident(dto, user.id, user.organizationId);
  }

  @Patch('incidents/:id/close')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'セキュリティインシデントのクローズ',
    description: 'インシデントを CLOSED 状態にする（closedAt・closedBy を自動設定）',
  })
  @ApiParam({ name: 'id', description: 'インシデントID (UUID)' })
  @ApiResponse({ status: 200, description: 'クローズ成功' })
  @ApiResponse({ status: 404, description: 'インシデントが見つかりません' })
  async closeIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ismsService.closeIncident(id, user.id, user.organizationId);
  }
}
