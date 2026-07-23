import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { usePageSize } from '@/hooks/usePageSize'
import { MonthlyQuota } from '@/components/MonthlyQuota'
import { UpcomingBookings } from '@/components/UpcomingBookings'
import { ManageResources } from '@/components/ManageResources'
import { SiteBookings } from '@/components/SiteBookings'
import { AdminDashboardSection } from '@/components/AdminDashboardSection'

export default function Dashboard() {
  const { profile } = useAuth()
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0)
  const pageSize = usePageSize()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
      {profile?.role === 'member' && (
        <div className="grid grid-cols-2 gap-6">
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
  )
}
