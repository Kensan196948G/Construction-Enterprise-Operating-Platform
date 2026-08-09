/**
 * NextAuth.js v5 — Civil Construction IMS Auth Configuration
 *
 * Strategy: JWT (no DB sessions)
 * Provider: Microsoft Entra ID (OIDC)
 * Fallback: Credentials (local dev only — disabled in production)
 *
 * After Entra ID login, the jwt callback exchanges the OIDC id_token
 * for an IMS access token by calling the API's /auth/entra-exchange.
 * The IMS token is then embedded in the encrypted session cookie.
 */

import NextAuth, { type NextAuthResult } from 'next-auth';
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session, User as NextAuthUser } from 'next-auth';
import { MOCK_MODE } from '@/lib/mock/flag';
import { mockLogin } from '@/lib/mock/server';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';
const IS_PRODUCTION = process.env.APP_ENV === 'production';

// ----------------------------------------------------------------
// Token exchange: Entra ID id_token → IMS JWT
// ----------------------------------------------------------------
async function exchangeEntraToken(
  idToken: string,
): Promise<{ accessToken: string; userId: string; email: string; displayName: string; roles: string[]; organizationId: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/entra-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      accessToken: string;
      userId: string;
      email: string;
      displayName: string;
      roles: string[];
      organizationId: string;
    };
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------
// Credentials login (local dev only): email + password → IMS JWT
// ----------------------------------------------------------------
async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string; displayName: string; roles: string[]; organizationId: string } } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------
// NextAuth configuration
// ----------------------------------------------------------------
const nextAuthResult: NextAuthResult = NextAuth({
  providers: [
    MicrosoftEntraId({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID ?? 'common'}/v2.0/`,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    // Local dev only — hidden in production login UI
    Credentials({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // モックモード: バックエンド不要。任意の入力でデモユーザーとしてログインする。
        // 多層防御: 本番(APP_ENV=production)では NEXT_PUBLIC_MOCK_MODE が混入しても
        // 認証バイパスを発生させない (IS_PRODUCTION を優先)。
        if (MOCK_MODE && !IS_PRODUCTION) {
          const result = mockLogin();
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.displayName,
            imsToken: result.accessToken,
            imsRefreshToken: result.refreshToken,
            roles: result.user.roles,
            organizationId: result.user.organizationId,
          } as NextAuthUser & { imsToken: string; imsRefreshToken: string; roles: string[]; organizationId: string };
        }
        if (IS_PRODUCTION) return null;
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const result = await loginWithCredentials(email, password);
        if (!result) return null;
        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.displayName,
          imsToken: result.accessToken,
          imsRefreshToken: result.refreshToken,
          roles: result.user.roles,
          organizationId: result.user.organizationId,
        } as NextAuthUser & { imsToken: string; imsRefreshToken: string; roles: string[]; organizationId: string };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Initial sign-in via Entra ID
      if (account?.provider === 'microsoft-entra-id' && account.id_token) {
        const exchanged = await exchangeEntraToken(account.id_token);
        if (exchanged) {
          token.imsToken = exchanged.accessToken;
          token.userId = exchanged.userId;
          token.roles = exchanged.roles;
          token.organizationId = exchanged.organizationId;
          token.displayName = exchanged.displayName;
          token.entraId = (profile as { oid?: string })?.oid ?? token.sub;
        }
      }

      // Initial sign-in via Credentials (dev)
      if (account?.provider === 'credentials' && user) {
        const u = user as NextAuthUser & { imsToken?: string; imsRefreshToken?: string; roles?: string[]; organizationId?: string };
        token.imsToken = u.imsToken;
        token.userId = u.id;
        token.roles = u.roles ?? [];
        token.organizationId = u.organizationId;
        token.displayName = u.name ?? u.email ?? '';
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      return {
        ...session,
        imsToken: token.imsToken as string | undefined,
        user: {
          ...session.user,
          id: token.userId as string | undefined,
          roles: (token.roles as string[]) ?? [],
          organizationId: token.organizationId as string | undefined,
          displayName: token.displayName as string | undefined,
        },
      };
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export const handlers: NextAuthResult['handlers'] = nextAuthResult.handlers;
export const auth: NextAuthResult['auth'] = nextAuthResult.auth;
export const signIn: NextAuthResult['signIn'] = nextAuthResult.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuthResult.signOut;
