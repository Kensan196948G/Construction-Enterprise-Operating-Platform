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
import { QualityService } from './quality.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateQualityPlanDto,
  UpdateQualityPlanDto,
  CreateQualityInspectionDto,
  UpdateQualityInspectionDto,
  CreateNonconformityDto,
  UpdateNonconformityDto,
  RecordInspectionResultDto,
} from './dto';

/** Authenticated request with user info injected by JwtAuthGuard */
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@ApiTags('quality')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  // ----------------------------------------------------------------
  // Quality Plans
  // ----------------------------------------------------------------

  @Get('plans')
  @ApiOperation({ summary: 'List quality plans (ISO 9001)' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by document status' })
  @ApiResponse({ status: 200, description: 'List of quality plans' })
  listPlans(@Query('projectId') projectId?: string, @Query('status') status?: string) {
    return this.qualityService.listPlans({ projectId, status });
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get quality plan by ID' })
  @ApiParam({ name: 'id', description: 'Quality plan UUID' })
  @ApiResponse({ status: 200, description: 'Quality plan detail' })
  @ApiResponse({ status: 404, description: 'Quality plan not found' })
  getPlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.qualityService.getPlan(id);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new quality plan' })
  @ApiResponse({ status: 201, description: 'Quality plan created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  createPlan(@Body() dto: CreateQualityPlanDto, @Request() req: AuthenticatedRequest) {
    return this.qualityService.createPlan(dto, req.user.id);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update a quality plan' })
  @ApiParam({ name: 'id', description: 'Quality plan UUID' })
  @ApiResponse({ status: 200, description: 'Quality plan updated' })
  @ApiResponse({ status: 404, description: 'Quality plan not found' })
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQualityPlanDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.qualityService.updatePlan(id, dto, req.user.id);
  }

  @Patch('plans/:id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '品質計画書を承認する [承認権限必須]' })
  @ApiParam({ name: 'id', description: 'Quality plan UUID' })
  @ApiResponse({ status: 200, description: 'Quality plan approved' })
  @ApiResponse({ status: 403, description: '承認権限が必要です' })
  approvePlan(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.qualityService.approvePlan(id, req.user.id);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Delete (soft) a quality plan' })
  @ApiParam({ name: 'id', description: 'Quality plan UUID' })
  @ApiResponse({ status: 204, description: 'Quality plan deleted' })
  @ApiResponse({ status: 403, description: '品質管理責任者権限が必要です' })
  deletePlan(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.qualityService.deletePlan(id, req.user.id);
  }

  // ----------------------------------------------------------------
  // Quality Inspections
  // ----------------------------------------------------------------

  @Get('inspections')
  @ApiOperation({ summary: 'List quality inspections' })
  @ApiQuery({ name: 'qualityPlanId', required: false, description: 'Filter by quality plan' })
  @ApiQuery({ name: 'result', required: false, description: 'Filter by inspection result' })
  @ApiResponse({ status: 200, description: 'List of quality inspections' })
  listInspections(
    @Query('qualityPlanId') qualityPlanId?: string,
    @Query('result') result?: string,
  ) {
    return this.qualityService.listInspections({ qualityPlanId, result });
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Get quality inspection by ID' })
  @ApiParam({ name: 'id', description: 'Inspection UUID' })
  @ApiResponse({ status: 200, description: 'Quality inspection detail' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  getInspection(@Param('id', ParseUUIDPipe) id: string) {
    return this.qualityService.getInspection(id);
  }

  @Post('inspections')
  @ApiOperation({ summary: 'Create a new quality inspection' })
  @ApiResponse({ status: 201, description: 'Quality inspection created' })
  createInspection(@Body() dto: CreateQualityInspectionDto, @Request() req: AuthenticatedRequest) {
    return this.qualityService.createInspection(dto, req.user.id);
  }

  @Put('inspections/:id')
  @ApiOperation({ summary: 'Update a quality inspection' })
  @ApiParam({ name: 'id', description: 'Inspection UUID' })
  @ApiResponse({ status: 200, description: 'Quality inspection updated' })
  updateInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQualityInspectionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.qualityService.updateInspection(id, dto, req.user.id);
  }

  @Patch('inspections/:id/result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record inspection result (PASS/FAIL/CONDITIONAL_PASS)' })
  @ApiParam({ name: 'id', description: 'Inspection UUID' })
  @ApiResponse({ status: 200, description: 'Inspection result recorded' })
  recordInspectionResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordInspectionResultDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.qualityService.recordInspectionResult(id, dto, req.user.id);
  }

  @Delete('inspections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Delete a quality inspection' })
  @ApiParam({ name: 'id', description: 'Inspection UUID' })
  @ApiResponse({ status: 204, description: 'Quality inspection deleted' })
  @ApiResponse({ status: 403, description: '品質管理責任者権限が必要です' })
  deleteInspection(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.qualityService.deleteInspection(id, req.user.id);
  }

  // ----------------------------------------------------------------
  // Nonconformities
  // ----------------------------------------------------------------

  @Get('nonconformities')
  @ApiOperation({ summary: 'List nonconformities' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project' })
  @ApiQuery({ name: 'qualityPlanId', required: false, description: 'Filter by quality plan' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiResponse({ status: 200, description: 'List of nonconformities' })
  listNonconformities(
    @Query('projectId') projectId?: string,
    @Query('qualityPlanId') qualityPlanId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.qualityService.listNonconformities({ projectId, qualityPlanId, status, severity });
  }

  @Get('nonconformities/:id')
  @ApiOperation({ summary: 'Get nonconformity by ID' })
  @ApiParam({ name: 'id', description: 'Nonconformity UUID' })
  @ApiResponse({ status: 200, description: 'Nonconformity detail' })
  @ApiResponse({ status: 404, description: 'Nonconformity not found' })
  getNonconformity(@Param('id', ParseUUIDPipe) id: string) {
    return this.qualityService.getNonconformity(id);
  }

  @Post('nonconformities')
  @ApiOperation({ summary: 'Create a new nonconformity record' })
  @ApiResponse({ status: 201, description: 'Nonconformity created' })
  createNonconformity(@Body() dto: CreateNonconformityDto, @Request() req: AuthenticatedRequest) {
    return this.qualityService.createNonconformity(dto, req.user.id);
  }

  @Put('nonconformities/:id')
  @ApiOperation({ summary: 'Update a nonconformity record' })
  @ApiParam({ name: 'id', description: 'Nonconformity UUID' })
  @ApiResponse({ status: 200, description: 'Nonconformity updated' })
  updateNonconformity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNonconformityDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.qualityService.updateNonconformity(id, dto, req.user.id);
  }

  @Patch('nonconformities/:id/close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Close a nonconformity' })
  @ApiParam({ name: 'id', description: 'Nonconformity UUID' })
  @ApiResponse({ status: 200, description: 'Nonconformity closed' })
  @ApiResponse({ status: 403, description: '品質管理責任者権限が必要です' })
  closeNonconformity(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.qualityService.closeNonconformity(id, req.user.id);
  }

  @Delete('nonconformities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Delete a nonconformity record' })
  @ApiParam({ name: 'id', description: 'Nonconformity UUID' })
  @ApiResponse({ status: 204, description: 'Nonconformity deleted' })
  @ApiResponse({ status: 403, description: '品質管理責任者権限が必要です' })
  deleteNonconformity(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.qualityService.deleteNonconformity(id, req.user.id);
  }
}
