import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('分析・レポート (Analytics)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: '経営ダッシュボード',
    description: '全 ISO モジュールを横断した統合 KPI サマリーを返す',
  })
  @ApiResponse({ status: 200, description: '統合 KPI データ' })
  getDashboard(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getDashboard(user.organizationId);
  }

  @Get('iso-compliance')
  @ApiOperation({
    summary: 'ISO 適合スコア',
    description: 'ISO 9001/14001/45001/55001/19650 それぞれの適合状況スコアを返す',
  })
  getIsoComplianceStatus(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getIsoComplianceStatus(user.organizationId);
  }

  @Get('safety-kpi')
  @ApiOperation({
    summary: '安全衛生 KPI (ISO 45001)',
    description: 'ヒヤリハット・事故・教育の年間集計を返す',
  })
  getSafetyKpi(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getSafetyKpi(user.organizationId);
  }

  @Get('quality-kpi')
  @ApiOperation({
    summary: '品質管理 KPI (ISO 9001)',
    description: '不適合・文書・監査の状況を返す',
  })
  getQualityKpi(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getQualityKpi(user.organizationId);
  }

  @Get('asset-health')
  @ApiOperation({
    summary: 'アセット健全度 (ISO 55001)',
    description: '資産の状態分布・健全度スコアを返す',
  })
  getAssetHealth(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getAssetHealth(user.organizationId);
  }
}
