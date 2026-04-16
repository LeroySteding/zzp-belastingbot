import { Sidebar } from '@/components/shared/sidebar'
import { OnboardingCheck } from '@/components/shared/onboarding-check'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingCheck>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </OnboardingCheck>
  )
}
