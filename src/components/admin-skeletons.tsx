import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page skeleton for an order detail screen (admin / shop-owner).
 * Mirrors the real layout so there's no visual jump when data lands.
 */
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <div className="mt-2 space-y-2 border-t border-border pt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

/**
 * Rows of skeletons for admin/shop-owner tables. Height matches the real
 * TableRow so header + pagination don't shift on hydration.
 */
export function TableRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

/**
 * Slim indeterminate progress bar shown at the top of a list while a
 * background refetch is in flight (isFetching && !isLoading). Purely
 * decorative; the underlying data stays interactive.
 */
export function InlineFetchingBar({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải dữ liệu"
      className="pointer-events-none relative h-0.5 overflow-hidden rounded-full bg-primary/10"
    >
      <div className="absolute inset-y-0 left-0 w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
    </div>
  );
}
