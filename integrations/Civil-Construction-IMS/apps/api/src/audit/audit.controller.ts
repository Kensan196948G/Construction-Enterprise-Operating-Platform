import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import {
  CreateAuditPlanDto,
  UpdateAuditPlanDto,
  CreateAuditFindingDto,
  UpdateAuditFindingDto,
  QueryAuditTrailDto,
} from './dto';

/** Authenticated user shape attached to request by JwtAuthGuard */
interface AuthUser {
  id: string;
  email: string;
}

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // ----------------------------------------------------------------
  // Audit Trail (read-only from REST; writes happen via AuditTrailService)
  // ----------------------------------------------------------------

  @Get('trails')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'AUDITOR_READONLY')
  @ApiOperation({
    summary: '監査証跡一覧取得',
    description:
      'entityType / entityId / actorId 等で絞り込み可能。全操作の who/when/before/after/reason を返す。',
  })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 8601 start datetime' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 8601 end datetime' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '監査証跡リスト' })
  @ApiResponse({ status: 403, description: '監査ログ閲覧権限が必要です' })
  async findTrails(@Query() query: QueryAuditTrailDto) {
    return this.auditService.findTrails(query);
  }

  @Get('trails/:id')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN', 'AUDITOR_READONLY')
  @ApiOperation({ summary: '監査証跡詳細取得' })
  @ApiParam({ name: 'id', description: 'AuditTrail UUID' })
  @ApiResponse({ status: 200, description: '監査証跡詳細' })
  @ApiResponse({ status: 403, description: '監査ログ閲覧権限が必要です' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOneTrail(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOneTrail(id);
  }

  // ----------------------------------------------------------------
  // Audit Plans
  // ----------------------------------------------------------------

  @Get('plans')
  @ApiOperation({
    summary: '内部監査計画一覧取得',
    description: 'ISO 規格 / プロジェクト / ステータスで絞り込み可能。',
  })
  @ApiQuery({ name: 'isoStandard', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '監査計画リスト' })
  async findPlans(
    @Query('isoStandard') isoStandard?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.auditService.findPlans({ isoStandard, projectId, status, page, limit });
  }

  @Get('plans/:id')
  @ApiOperation({ summary: '内部監査計画詳細取得（所見一覧含む）' })
  @ApiParam({ name: 'id', description: 'AuditPlan UUID' })
  @ApiResponse({ status: 200, description: '監査計画詳細' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOnePlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOnePlan(id);
  }

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '内部監査計画作成' })
  @ApiResponse({ status: 201, description: '作成された監査計画' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 403, description: '監査計画作成権限が必要です' })
  async createPlan(@Body() dto: CreateAuditPlanDto, @Req() req: Request & { user: AuthUser }) {
    return this.auditService.createPlan(dto, req.user.id, req);
  }

  @Patch('plans/:id')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '内部監査計画更新' })
  @ApiParam({ name: 'id', description: 'AuditPlan UUID' })
  @ApiResponse({ status: 200, description: '更新された監査計画' })
  @ApiResponse({ status: 403, description: '監査計画更新権限が必要です' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAuditPlanDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.auditService.updatePlan(id, dto, req.user.id, req);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '内部監査計画削除（論理削除）' })
  @ApiParam({ name: 'id', description: 'AuditPlan UUID' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '監査計画削除権限が必要です' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async removePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.auditService.removePlan(id, req.user.id, req);
  }

  // ----------------------------------------------------------------
  // Audit Findings
  // ----------------------------------------------------------------

  @Get('plans/:planId/findings')
  @ApiOperation({ summary: '監査所見一覧取得（計画別）' })
  @ApiParam({ name: 'planId', description: 'AuditPlan UUID' })
  @ApiResponse({ status: 200, description: '所見リスト' })
  async findFindings(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.auditService.findFindings(planId);
  }

  @Get('findings/:id')
  @ApiOperation({ summary: '監査所見詳細取得' })
  @ApiParam({ name: 'id', description: 'AuditFinding UUID' })
  @ApiResponse({ status: 200, description: '所見詳細' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOneFinding(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOneFinding(id);
  }

  @Post('plans/:planId/findings')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '監査所見登録' })
  @ApiParam({ name: 'planId', description: 'AuditPlan UUID' })
  @ApiResponse({ status: 201, description: '登録された所見' })
  @ApiResponse({ status: 403, description: '監査所見登録権限が必要です' })
  async createFinding(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateAuditFindingDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.auditService.createFinding(planId, dto, req.user.id, req);
  }

  @Patch('findings/:id')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '監査所見更新' })
  @ApiParam({ name: 'id', description: 'AuditFinding UUID' })
  @ApiResponse({ status: 200, description: '更新された所見' })
  @ApiResponse({ status: 403, description: '監査所見更新権限が必要です' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAuditFindingDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.auditService.updateFinding(id, dto, req.user.id, req);
  }

  @Delete('findings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '監査所見削除' })
  @ApiParam({ name: 'id', description: 'AuditFinding UUID' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 403, description: '監査所見削除権限が必要です' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async removeFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.auditService.removeFinding(id, req.user.id, req);
  }
}
