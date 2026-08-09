import { NextResponse } from 'next/server';

import { MOCK_MODE } from '@/lib/mock/flag';

/**
 * フロントエンド(Next.js)のヘルスチェック。
 * Docker / ロードバランサ / 監視からの死活監視に使用する。
 * - 認証不要・軽量
 * - モックモードかどうかも返す（デモ環境の識別用）
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'web',
    mock: MOCK_MODE,
  });
}
