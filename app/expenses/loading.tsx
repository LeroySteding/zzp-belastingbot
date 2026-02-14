import { ExpensesListSkeleton } from '@/components/ui/skeleton'

export default function ExpensesLoading() {
  return (
    <div className="container mx-auto p-6">
      <ExpensesListSkeleton />
    </div>
  )
}
