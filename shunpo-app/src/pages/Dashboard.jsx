import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MonthlyQuota } from '@/components/MonthlyQuota'
import { UpcomingBookings } from '@/components/UpcomingBookings'
import { ManageResources } from '@/components/ManageResources'
import { SiteBookings } from '@/components/SiteBookings'

export default function Dashboard() {
  const { profile } = useAuth()
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0)
  // Below Tailwind's `sm` breakpoint (640px)
  const isMobile = useMediaQuery('(max-width: 639px)')
  const pageSize = isMobile ? 3 : 5

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
    </div>
  )
}
