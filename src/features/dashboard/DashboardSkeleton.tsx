import { Skeleton } from '@/components/ui/Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Balance hero */}
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="mt-3 h-9 w-48 rounded" />
      </div>

      {/* Income / Expense cards */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="mt-2 h-6 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Recent transactions + category breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="mt-4 flex flex-col divide-y divide-line">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="mt-1.5 h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-3.5 w-14 shrink-0 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="mt-1.5 h-3 w-16 rounded" />
          <div className="mt-4 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20 rounded" />
                  <Skeleton className="h-3.5 w-14 rounded" />
                </div>
                <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="mt-4 h-56 w-full rounded" />
      </div>
    </div>
  )
}