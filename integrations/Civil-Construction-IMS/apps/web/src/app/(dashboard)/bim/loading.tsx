import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

/**
 * /bim ルートのスケルトンローディング。
 * Suspense / route loading 中に (dashboard) レイアウト内で描画される。
 */
export default function BimLoading() {
  return (
    <div
      className="space-y-6 p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">読み込み中</span>

      {/* ヘッダーのスケルトン */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      {/* 一覧カードのスケルトン */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* テーブルヘッダー行 */}
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          {/* テーブル本体行 */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 w-full animate-pulse rounded-md bg-muted/70"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
