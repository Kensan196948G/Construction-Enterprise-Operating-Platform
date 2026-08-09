import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
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
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { WorkflowService } from './workflow.service';
import {
  CreateWorkflowRequestDto,
  UpdateWorkflowRequestDto,
  CreateWorkflowActionDto,
  ListWorkflowRequestsDto,
} from './dto';

@ApiTags('workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // ----------------------------------------------------------------
  // GET /workflow/requests
  // ----------------------------------------------------------------

  @Get('requests')
  @ApiOperation({
    summary: 'ワークフローリクエスト一覧取得',
    description: '承認フロー一覧を返します。',
  })
  @ApiQuery({ name: 'status', required: false, description: 'ステータスでフィルタ' })
  @ApiQuery({ name: 'targetType', required: false, description: 'ターゲット種別でフィルタ' })
  @ApiQuery({ name: 'requesterId', required: false, description: '申請者IDでフィルタ' })
  @ApiResponse({ status: 200, description: 'ワークフローリクエスト一覧' })
  async findAll(
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('requesterId') requesterId?: string,
  ) {
    const filter: ListWorkflowRequestsDto = { status, targetType, requesterId };
    return this.workflowService.findAll(filter);
  }

  // ----------------------------------------------------------------
  // GET /workflow/requests/:id
  // ----------------------------------------------------------------

  @Get('requests/:id')
  @ApiOperation({
    summary: 'ワークフローリクエスト詳細取得',
    description: '指定IDのワークフローリクエスト詳細を返します。',
  })
  @ApiParam({ name: 'id', description: 'ワークフローリクエストID' })
  @ApiResponse({ status: 200, description: 'ワークフローリクエスト詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  async findById(@Param('id') id: string) {
    return this.workflowService.findById(id);
  }

  // ----------------------------------------------------------------
  // POST /workflow/requests
  // ----------------------------------------------------------------

  @Post('requests')
  @ApiOperation({
    summary: 'ワークフローリクエスト作成',
    description: '新規承認フローを起票します。',
  })
  @ApiResponse({ status: 201, description: '作成したワークフローリクエスト' })
  async create(@Body() dto: CreateWorkflowRequestDto, @CurrentUser() user: CurrentUserType) {
    return this.workflowService.create(dto, user.id);
  }

  // ----------------------------------------------------------------
  // PUT /workflow/requests/:id
  // ----------------------------------------------------------------

  @Put('requests/:id')
  @ApiOperation({
    summary: 'ワークフローリクエスト更新',
    description: '指定IDのワークフローリクエストを更新します。',
  })
  @ApiParam({ name: 'id', description: 'ワークフローリクエストID' })
  @ApiResponse({ status: 200, description: '更新したワークフローリクエスト' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowRequestDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.workflowService.update(id, dto, user.id);
  }

  // ----------------------------------------------------------------
  // DELETE /workflow/requests/:id
  // ----------------------------------------------------------------

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'ワークフローリクエスト削除',
    description: '指定IDのワークフローリクエストを削除します。',
  })
  @ApiParam({ name: 'id', description: 'ワークフローリクエストID' })
  @ApiResponse({ status: 204, description: '削除成功' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    await this.workflowService.delete(id, user.id);
  }

  // ----------------------------------------------------------------
  // GET /workflow/requests/:id/actions
  // ----------------------------------------------------------------

  @Get('requests/:id/actions')
  @ApiOperation({
    summary: 'ワークフローアクション一覧取得',
    description: '指定リクエストの承認アクション履歴を返します。',
  })
  @ApiParam({ name: 'id', description: 'ワークフローリクエストID' })
  @ApiResponse({ status: 200, description: 'ワークフローアクション一覧' })
  async findActions(@Param('id') id: string) {
    return this.workflowService.findActionsByRequest(id);
  }

  // ----------------------------------------------------------------
  // POST /workflow/actions
  // ----------------------------------------------------------------

  @Post('actions')
  @ApiOperation({
    summary: 'ワークフローアクション実行',
    description: '承認・却下・差し戻し等のアクションを実行します。',
  })
  @ApiResponse({ status: 201, description: '作成したワークフローアクション' })
  async createAction(@Body() dto: CreateWorkflowActionDto, @CurrentUser() user: CurrentUserType) {
    return this.workflowService.createAction(dto, user.id);
  }
}
