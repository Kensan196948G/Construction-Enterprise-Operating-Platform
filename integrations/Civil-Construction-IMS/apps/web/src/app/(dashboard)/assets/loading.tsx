import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

/** 資産管理ページのスケルトンローディング表示 */
export default function AssetsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded-md bg-muted/70" />
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 w-full animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
