import { DashboardSkeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6">
      <DashboardSkeleton />
    </div>
  )
}
