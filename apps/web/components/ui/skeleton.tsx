import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

// Preset skeletons for common components
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      {/* Chart */}
      <div className="rounded-lg border p-6">
        <ChartSkeleton />
      </div>
      {/* Table */}
      <div className="rounded-lg border p-6">
        <TableSkeleton />
      </div>
    </div>
  )
}

export function ExpensesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="rounded-lg border p-6">
        <TableSkeleton rows={6} />
      </div>
    </div>
  )
}

export { Skeleton }
