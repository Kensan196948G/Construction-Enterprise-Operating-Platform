import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** スケルトン用の共通プレースホルダー */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  );
}

const SKELETON_ROW_COUNT = 6;

export default function AuditsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 border-b border-border pb-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center gap-4 py-2"
            >
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-5 flex-1" />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
