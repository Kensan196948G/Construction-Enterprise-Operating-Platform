import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

/**
 * 品質管理 (ISO 9001) 一覧ページのスケルトンローディング。
 * App Router の loading.tsx として、データ取得中に自動表示される。
 */
export default function QualityLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-live="polite">
      {/* ヘッダーのスケルトン */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>

      {/* カード + テーブルのスケルトン */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* テーブルヘッダー行 */}
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/70" />
          {/* テーブルデータ行 */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 w-full animate-pulse rounded-md bg-muted"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
