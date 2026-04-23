import { Sidebar } from '@/components/shared/sidebar'
import { OnboardingCheck } from '@/components/shared/onboarding-check'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SearchTrigger } from '@/components/search/search-trigger'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingCheck>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main id="main-content" className="lg:pl-64">
          <div className="flex justify-end items-center gap-3 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
            <SearchTrigger />
            <NotificationBell />
          </div>
          <div className="p-4 sm:p-6 lg:p-8 pt-2">
            {children}
          </div>
        </main>
      </div>
    </OnboardingCheck>
  )
}
