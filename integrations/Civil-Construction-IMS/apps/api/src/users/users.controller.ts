import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '自分のプロフィール取得' })
  getMe(@CurrentUser() user: CurrentUserType) {
    return this.usersService.findById(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'ユーザー一覧取得' })
  findAll() {
    return this.usersService.findAll();
  }
}
