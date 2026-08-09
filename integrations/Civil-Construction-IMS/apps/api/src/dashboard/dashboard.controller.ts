import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('ダッシュボード')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpi')
  @ApiOperation({
    summary: 'ダッシュボード KPI 取得',
    description: 'ISO 統合マネジメントシステムの主要 KPI を一括取得します。',
  })
  @ApiResponse({ status: 200, description: 'KPI データ' })
  getKpi(@CurrentUser() user: CurrentUserType) {
    return this.dashboardService.getKpi(user.organizationId);
  }
}
