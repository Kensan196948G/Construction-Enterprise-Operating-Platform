function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

const gridColsClass = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-4",
} as const;

type CardCount = keyof typeof gridColsClass;

function SkeletonSection({ cards = 3 }: { cards?: CardCount }) {
  return (
    <section className="mb-8">
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-3 animate-pulse" />
      <div className={`grid ${gridColsClass[cards]} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-56 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-700" />
        </div>
        <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-700" />
      </div>

      <SkeletonSection cards={4} />
      <SkeletonSection cards={3} />

      {/* Architecture skeleton */}
      <section className="mb-8 animate-pulse">
        <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
        <div className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </section>

      <SkeletonSection cards={3} />
    </div>
  );
}
