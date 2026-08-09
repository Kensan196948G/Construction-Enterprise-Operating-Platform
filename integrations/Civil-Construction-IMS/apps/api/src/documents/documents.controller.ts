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
  UseGuards,
  Request,
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
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CreateDocumentVersionDto,
  DocumentQueryDto,
} from './dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ----------------------------------------------------------------
  // Document CRUD
  // ----------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: '文書を新規作成する' })
  @ApiResponse({ status: 201, description: '文書が作成されました' })
  @ApiResponse({ status: 400, description: '入力値が不正です' })
  @ApiResponse({ status: 401, description: '認証が必要です' })
  create(
    @Body() dto: CreateDocumentDto,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '文書一覧を取得する' })
  @ApiQuery({ name: 'projectId', required: false, description: 'プロジェクト ID でフィルタ' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'カテゴリ ID でフィルタ' })
  @ApiQuery({ name: 'status', required: false, description: 'ステータスでフィルタ' })
  @ApiQuery({ name: 'page', required: false, description: 'ページ番号 (1始まり)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '1ページの件数', example: 20 })
  @ApiResponse({ status: 200, description: '文書一覧' })
  findAll(@Query() query: DocumentQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '文書をID指定で取得する' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: '文書詳細' })
  @ApiResponse({ status: 404, description: '文書が見つかりません' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '文書のメタ情報を更新する' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: '文書が更新されました' })
  @ApiResponse({ status: 404, description: '文書が見つかりません' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '文書を論理削除する' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 204, description: '文書が削除されました' })
  @ApiResponse({ status: 404, description: '文書が見つかりません' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.remove(id, req.user.id);
  }

  // ----------------------------------------------------------------
  // Document Version management
  // ----------------------------------------------------------------

  @Post(':id/versions')
  @ApiOperation({ summary: '文書の新規バージョンを追加する' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 201, description: 'バージョンが追加されました' })
  addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentVersionDto,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.addVersion(id, dto, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '文書のバージョン一覧を取得する' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: 'バージョン一覧' })
  getVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.getVersions(id);
  }

  @Get(':id/versions/:versionNo')
  @ApiOperation({ summary: '特定バージョンの詳細を取得する' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiParam({ name: 'versionNo', description: 'バージョン番号' })
  @ApiResponse({ status: 200, description: 'バージョン詳細' })
  @ApiResponse({ status: 404, description: 'バージョンが見つかりません' })
  getVersion(@Param('id', ParseUUIDPipe) id: string, @Param('versionNo') versionNo: string) {
    return this.documentsService.getVersion(id, parseInt(versionNo, 10));
  }

  // ----------------------------------------------------------------
  // Document status transitions
  // ----------------------------------------------------------------

  @Patch(':id/submit-review')
  @ApiOperation({ summary: '文書をレビュー申請する (DRAFT → UNDER_REVIEW)' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: 'レビュー申請されました' })
  submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.submitForReview(id, req.user.id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '文書を承認する (UNDER_REVIEW → APPROVED) [承認権限必須]' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: '承認されました' })
  @ApiResponse({ status: 403, description: '承認権限が必要です' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.approve(id, req.user.id);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '文書を発行する (APPROVED → PUBLISHED) [承認権限必須]' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: '発行されました' })
  @ApiResponse({ status: 403, description: '承認権限が必要です' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.publish(id, req.user.id);
  }

  @Patch(':id/withdraw')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'ISO_MANAGER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: '文書を廃止する (PUBLISHED → WITHDRAWN) [承認権限必須]' })
  @ApiParam({ name: 'id', description: '文書 UUID' })
  @ApiResponse({ status: 200, description: '廃止されました' })
  @ApiResponse({ status: 403, description: '承認権限が必要です' })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string } },
  ) {
    return this.documentsService.withdraw(id, req.user.id);
  }

  // ----------------------------------------------------------------
  // Document categories
  // ----------------------------------------------------------------

  @Get('categories/all')
  @ApiOperation({ summary: '文書カテゴリ一覧を取得する' })
  @ApiResponse({ status: 200, description: 'カテゴリ一覧' })
  getCategories() {
    return this.documentsService.getCategories();
  }
}
