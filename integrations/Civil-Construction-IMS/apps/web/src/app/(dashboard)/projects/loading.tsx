import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

/**
 * 工事案件管理一覧のスケルトンローディング。
 * App Router が page.tsx の suspense フォールバックとして自動適用する。
 */
export default function ProjectsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="読み込み中">
      {/* ヘッダーのスケルトン */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      {/* 一覧カードのスケルトン */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
          </div>
        </CardHeader>
        <CardContent>
          {/* テーブル見出し行 */}
          <div className="mb-3 grid grid-cols-5 gap-4 border-b border-border pb-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-4 w-20 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>

          {/* テーブルデータ行 */}
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="h-5 w-full animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
