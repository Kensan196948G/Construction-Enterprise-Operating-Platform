import { test as base, request } from '@playwright/test';

/**
 * 共通フィクスチャ
 * - `serviceUp(url)` — baseURL に到達できるかを判定し、失敗時はテストを skip する
 *   現状は dev server 未起動でも CI が落ちないようガードする目的
 */
export const test = base.extend<{
  serviceUp: (url: string) => Promise<boolean>;
}>({
  serviceUp: async ({}, use) => {
    use(async (url: string) => {
      try {
        const ctx = await request.newContext();
        const res = await ctx.get(url, { timeout: 3000 });
        await ctx.dispose();
        return res.ok();
      } catch {
        return false;
      }
    });
  },
});

export const expect = test.expect;
