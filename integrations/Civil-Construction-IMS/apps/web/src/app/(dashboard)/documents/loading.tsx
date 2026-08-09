import { FileText } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

/**
 * 文書管理ページのスケルトンローディング表示。
 * Next.js App Router の Suspense フォールバックとして自動利用される。
 */
export default function DocumentsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-live="polite">
      {/* ヘッダースケルトン */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-2">
            <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>

      {/* テーブルスケルトン */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* ヘッダー行 */}
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/70" />
          {/* データ行 */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 w-full animate-pulse rounded-md bg-muted"
            />
          ))}
        </CardContent>
      </Card>

      <span className="sr-only">読み込み中…</span>
    </div>
  );
}
