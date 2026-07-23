import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { usePageSize } from '@/hooks/usePageSize'
import { MonthlyQuota } from '@/components/MonthlyQuota'
import { UpcomingBookings } from '@/components/UpcomingBookings'
import { ManageResources } from '@/components/ManageResources'
import { SiteBookings } from '@/components/SiteBookings'
import { AdminDashboardSection } from '@/components/AdminDashboardSection'
import { Bubbles, Waves } from '@/components/BeachScene'

export default function Dashboard() {
  const { profile } = useAuth()
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0)
  const pageSize = usePageSize()

  return (
    <>
      {profile?.role === 'member' && (
        <div className="relative overflow-hidden bg-primary py-8 text-primary-foreground">
          <Bubbles />
          <Waves />
          <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-4 md:px-10">
            <div className="flex flex-col gap-1">
              <p className="text-xl font-semibold">Welcome back</p>
              <p className="text-sm text-primary-foreground/80">
                Here's what's coming up for you.
              </p>
            </div>
            <img src="/worker.svg" alt="" className="hidden h-28 w-28 shrink-0 sm:block" />
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
        {profile?.role === 'member' && (
          <div className="flex flex-col gap-6">
            <MonthlyQuota refreshKey={quotaRefreshKey} />
            <UpcomingBookings pageSize={pageSize} onBookingsChanged={() => setQuotaRefreshKey((k) => k + 1)} />
          </div>
        )}

        {profile?.role === 'manager' && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <ManageResources pageSize={pageSize} />
            <SiteBookings pageSize={pageSize} />
          </div>
        )}

        {profile?.role === 'admin' && <AdminDashboardSection pageSize={pageSize} />}
      </div>
    </>
  )
}
