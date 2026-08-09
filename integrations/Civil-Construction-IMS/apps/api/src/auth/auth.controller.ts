import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

class EntraExchangeDto {
  @IsString()
  idToken!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ログイン (JWT + refresh token 取得)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'アクセストークン更新 (refresh token ローテーション)' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ログアウト (refresh token 失効)' })
  async logout(
    @Request() req: Express.Request & { user: { id: string } },
    @Body() dto: RefreshTokenDto,
  ) {
    await this.authService.logout(req.user.id, dto.refreshToken);
  }

  @Post('entra-exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Entra ID id_token → IMS JWT 交換' })
  entraExchange(@Body() dto: EntraExchangeDto) {
    return this.authService.exchangeEntraToken(dto.idToken);
  }
}
