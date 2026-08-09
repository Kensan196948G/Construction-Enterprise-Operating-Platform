import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './jwt.strategy';

const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ----------------------------------------------------------------
  // Login — returns access token + opaque refresh token
  // ----------------------------------------------------------------
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null, isActive: true },
      include: { roles: { include: { role: true } } },
    });

    if (!user) throw new UnauthorizedException('認証情報が正しくありません');

    const isValid = await bcrypt.compare(password, user.passwordHash ?? '');
    if (!isValid) throw new UnauthorizedException('認証情報が正しくありません');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.roles.map((ur) => ur.role.code);
    const accessToken = this.signAccessToken({ sub: user.id, email: user.email, roles });
    const { raw: refreshToken } = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles,
        organizationId: user.organizationId,
      },
    };
  }

  // ----------------------------------------------------------------
  // Refresh — rotate refresh token, issue new access token
  // ----------------------------------------------------------------
  async refresh(rawRefreshToken: string) {
    // Find a non-expired, non-revoked token whose hash matches
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { roles: { include: { role: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let matched: (typeof tokens)[0] | undefined;
    for (const t of tokens) {
      if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
        matched = t;
        break;
      }
    }

    if (!matched || !matched.user.isActive || matched.user.deletedAt) {
      throw new UnauthorizedException('リフレッシュトークンが無効です');
    }

    // Revoke old token and issue a new one (rotation)
    const { raw: newRaw, id: newTokenId } = await this.createRefreshToken(matched.userId);

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date(), replacedById: newTokenId },
    });

    const roles = matched.user.roles.map((ur) => ur.role.code);
    const accessToken = this.signAccessToken({
      sub: matched.userId,
      email: matched.user.email,
      roles,
    });

    return { accessToken, refreshToken: newRaw };
  }

  // ----------------------------------------------------------------
  // Logout — revoke specific refresh token
  // ----------------------------------------------------------------
  async logout(userId: string, rawRefreshToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });
    for (const t of tokens) {
      if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
  }

  // ----------------------------------------------------------------
  // Entra Exchange — verify Entra ID id_token and return IMS JWT
  // ----------------------------------------------------------------
  async exchangeEntraToken(idToken: string) {
    const tenantId = this.config.get<string>('AZURE_AD_TENANT_ID');
    if (!tenantId) throw new UnauthorizedException('AZURE_AD_TENANT_ID not configured');

    const clientId = this.config.get<string>('AZURE_AD_CLIENT_ID');
    if (!clientId) throw new UnauthorizedException('AZURE_AD_CLIENT_ID not configured');

    const jwksUrl = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
    const JWKS = createRemoteJWKSet(jwksUrl);

    let claims: Record<string, unknown>;
    try {
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: [
          `https://login.microsoftonline.com/${tenantId}/v2.0`,
          `https://sts.windows.net/${tenantId}/`,
        ],
        audience: clientId,
      });
      claims = payload as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Entra ID id_token の検証に失敗しました');
    }

    const entraOid = claims['oid'] as string | undefined;
    if (!entraOid) throw new UnauthorizedException('id_token に oid クレームがありません');

    const user = await this.prisma.user.findFirst({
      where: { externalId: entraOid, deletedAt: null, isActive: true },
      include: { roles: { include: { role: true } } },
    });

    if (!user) throw new UnauthorizedException('このアカウントは登録されていません');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.roles.map((ur) => ur.role.code);
    const accessToken = this.signAccessToken({ sub: user.id, email: user.email, roles });

    return {
      accessToken,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      roles,
      organizationId: user.organizationId,
    };
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------
  private signAccessToken(payload: JwtPayload): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET must be set');
    return this.jwt.sign(payload, { secret, expiresIn: '8h' });
  }

  private async createRefreshToken(userId: string): Promise<{ raw: string; id: string }> {
    const raw = randomBytes(48).toString('hex'); // 384-bit opaque token
    const hash = await bcrypt.hash(raw, 10);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400_000);

    const record = await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hash, expiresAt },
    });

    return { raw, id: record.id };
  }
}
