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
import { ProjectsService, CreateProjectDto, UpdateProjectDto } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ----------------------------------------------------------------
  // GET /projects
  // ----------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: '工事案件一覧取得',
    description: 'フィルタ条件に一致する工事案件の一覧を返します。',
  })
  @ApiQuery({ name: 'status', required: false, description: 'プロジェクトステータスでフィルタ' })
  @ApiQuery({ name: 'managerId', required: false, description: '管理者IDでフィルタ' })
  @ApiResponse({ status: 200, description: '工事案件一覧' })
  async findAll(@Query('status') status?: string, @Query('managerId') managerId?: string) {
    return this.projectsService.findAll({ status, managerId });
  }

  // ----------------------------------------------------------------
  // GET /projects/:id
  // ----------------------------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: '工事案件詳細取得', description: '指定IDの工事案件詳細を返します。' })
  @ApiParam({ name: 'id', description: '工事案件ID' })
  @ApiResponse({ status: 200, description: '工事案件詳細' })
  @ApiResponse({ status: 404, description: '案件が見つかりません' })
  async findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  // ----------------------------------------------------------------
  // POST /projects
  // ----------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: '工事案件作成', description: '新規工事案件を作成します。' })
  @ApiResponse({ status: 201, description: '作成した工事案件' })
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: CurrentUserType) {
    return this.projectsService.create(dto, user.id);
  }

  // ----------------------------------------------------------------
  // PUT /projects/:id
  // ----------------------------------------------------------------

  @Put(':id')
  @ApiOperation({ summary: '工事案件更新', description: '指定IDの工事案件情報を更新します。' })
  @ApiParam({ name: 'id', description: '工事案件ID' })
  @ApiResponse({ status: 200, description: '更新した工事案件' })
  @ApiResponse({ status: 404, description: '案件が見つかりません' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.projectsService.update(id, dto, user.id);
  }

  // ----------------------------------------------------------------
  // DELETE /projects/:id
  // ----------------------------------------------------------------

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '工事案件削除', description: '指定IDの工事案件を削除します。' })
  @ApiParam({ name: 'id', description: '工事案件ID' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 404, description: '案件が見つかりません' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    await this.projectsService.delete(id, user.id);
  }
}
