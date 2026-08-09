import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

/**
 * 環境管理 (ISO 14001) ページのスケルトンローディング表示。
 * App Router の loading.tsx として route セグメントの Suspense fallback に使用される。
 */
export default function EnvironmentLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-live="polite">
      {/* ヘッダースケルトン */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>

      {/* テーブルカードスケルトン */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* テーブルヘッダー行 */}
            <div className="h-9 w-full animate-pulse rounded-md bg-muted/70" />
            {/* テーブルデータ行 */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-full animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <span className="sr-only">環境管理データを読み込んでいます</span>
    </div>
  );
}
