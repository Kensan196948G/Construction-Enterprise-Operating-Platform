import { MOCK_MODE } from '@/lib/mock/flag';

/**
 * デモ(モック)環境であることを明示する細いバナー。
 * 経営層・監査法人・現場担当が「本番データではない」ことを一目で判別できるようにする。
 * モックモード以外では何も描画しない。
 */
export function MockBanner() {
  if (!MOCK_MODE) return null;
  return (
    <div className="w-full bg-amber-500 px-4 py-1 text-center text-xs font-medium text-amber-950">
      🎭 デモ環境 — 表示中のデータはすべてダミーです（実際の工事・監査記録ではありません）
    </div>
  );
}
