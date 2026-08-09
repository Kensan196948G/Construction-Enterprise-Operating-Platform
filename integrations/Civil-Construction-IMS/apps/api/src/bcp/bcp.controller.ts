import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
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
import {
  BcpService,
  FindAllPlansQuery,
  CreatePlanDto,
  UpdatePlanDto,
  CreateScenarioDto,
  UpdateScenarioDto,
  CreateDrillRecordDto,
} from './bcp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/** Authenticated request injected by JwtAuthGuard (includes organizationId from JWT strategy). */
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; roles: string[]; organizationId: string };
}

@ApiTags('bcp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/bcp')
export class BcpController {
  constructor(private readonly bcpService: BcpService) {}

  // ----------------------------------------------------------------
  // BCP Summary
  // ----------------------------------------------------------------

  @Get('summary')
  @ApiOperation({ summary: 'BCP サマリー（計画数・シナリオ数・訓練数・直近訓練）' })
  @ApiResponse({ status: 200, description: 'BCP サマリーを返す' })
  getSummary(@Request() req: AuthenticatedRequest) {
    return this.bcpService.getBcpSummary(req.user.organizationId);
  }

  // ----------------------------------------------------------------
  // BcpPlan — read
  // ----------------------------------------------------------------

  @Get('plans')
  @ApiOperation({ summary: 'BCP 計画一覧' })
  @ApiQuery({ name: 'status', required: false, description: 'ステータスでフィルタ' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'BCP 計画一覧' })
  findAllPlans(@Query() query: FindAllPlansQuery, @Request() req: AuthenticatedRequest) {
    return this.bcpService.findAllPlans(query, req.user.organizationId);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'BCP 計画詳細（シナリオ・訓練記録を含む）' })
  @ApiParam({ name: 'id', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 200, description: 'BCP 計画詳細' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  findPlanById(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.bcpService.findPlanById(id, req.user.organizationId);
  }

  // ----------------------------------------------------------------
  // BcpPlan — write (ISO_MANAGER / SYSTEM_ADMIN)
  // ----------------------------------------------------------------

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BCP 計画を新規作成 [ISO_MANAGER / SYSTEM_ADMIN 必須]' })
  @ApiResponse({ status: 201, description: 'BCP 計画が作成されました' })
  @ApiResponse({ status: 400, description: '入力値が不正です' })
  @ApiResponse({ status: 403, description: '権限が不足しています' })
  @ApiResponse({ status: 409, description: '計画番号が重複しています' })
  createPlan(@Body() dto: CreatePlanDto, @Request() req: AuthenticatedRequest) {
    return this.bcpService.createPlan(dto, req.user.id, req.user.organizationId);
  }

  @Put('plans/:id')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BCP 計画を更新 [ISO_MANAGER / SYSTEM_ADMIN 必須]' })
  @ApiParam({ name: 'id', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 200, description: 'BCP 計画が更新されました' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bcpService.updatePlan(id, dto, req.user.id, req.user.organizationId);
  }

  @Patch('plans/:id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BCP 計画を承認する [ISO_MANAGER / SYSTEM_ADMIN 必須]' })
  @ApiParam({ name: 'id', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 200, description: 'BCP 計画が承認されました' })
  @ApiResponse({ status: 403, description: '承認権限が必要です' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  approvePlan(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.bcpService.approvePlan(id, req.user.id, req.user.organizationId);
  }

  // ----------------------------------------------------------------
  // BcpRiskScenario — read
  // ----------------------------------------------------------------

  @Get('plans/:planId/scenarios')
  @ApiOperation({ summary: 'BCP リスクシナリオ一覧' })
  @ApiParam({ name: 'planId', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 200, description: 'リスクシナリオ一覧（riskScore 降順）' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  findScenariosByPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bcpService.findScenariosByPlan(planId, req.user.organizationId);
  }

  // ----------------------------------------------------------------
  // BcpRiskScenario — write
  // ----------------------------------------------------------------

  @Post('plans/:planId/scenarios')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BCP リスクシナリオを追加 [ISO_MANAGER / SYSTEM_ADMIN 必須]' })
  @ApiParam({ name: 'planId', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 201, description: 'リスクシナリオが作成されました（riskScore 自動算出）' })
  @ApiResponse({ status: 400, description: '入力値が不正です（probability/impact は 1〜5）' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  createScenario(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateScenarioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bcpService.createScenario(planId, dto, req.user.id, req.user.organizationId);
  }

  @Put('plans/:planId/scenarios/:scenarioId')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BCP リスクシナリオを更新 [ISO_MANAGER / SYSTEM_ADMIN 必須]' })
  @ApiParam({ name: 'planId', description: 'BcpPlan UUID' })
  @ApiParam({ name: 'scenarioId', description: 'BcpRiskScenario UUID' })
  @ApiResponse({ status: 200, description: 'リスクシナリオが更新されました' })
  @ApiResponse({ status: 404, description: 'シナリオまたは計画が見つかりません' })
  updateScenario(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Body() dto: UpdateScenarioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bcpService.updateScenario(
      scenarioId,
      planId,
      dto,
      req.user.id,
      req.user.organizationId,
    );
  }

  // ----------------------------------------------------------------
  // BcpDrillRecord — read
  // ----------------------------------------------------------------

  @Get('plans/:planId/drills')
  @ApiOperation({ summary: 'BCP 訓練記録一覧' })
  @ApiParam({ name: 'planId', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 200, description: '訓練記録一覧（実施日降順）' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  findDrillsByPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bcpService.findDrillsByPlan(planId, req.user.organizationId);
  }

  // ----------------------------------------------------------------
  // BcpDrillRecord — write
  // ----------------------------------------------------------------

  @Post('plans/:planId/drills')
  @UseGuards(RolesGuard)
  @Roles('ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'BCP 訓練記録を登録 [ISO_MANAGER / SYSTEM_ADMIN 必須]' })
  @ApiParam({ name: 'planId', description: 'BcpPlan UUID' })
  @ApiResponse({ status: 201, description: '訓練記録が作成されました' })
  @ApiResponse({ status: 404, description: 'BCP 計画が見つかりません' })
  @ApiResponse({ status: 409, description: '訓練番号が重複しています' })
  createDrillRecord(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateDrillRecordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bcpService.createDrillRecord(planId, dto, req.user.id, req.user.organizationId);
  }
}
