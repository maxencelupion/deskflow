import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { MonthlyQuota } from '@/components/MonthlyQuota'
import { UpcomingBookings } from '@/components/UpcomingBookings'
import { ManageResources } from '@/components/ManageResources'
import { SiteBookings } from '@/components/SiteBookings'

export default function Dashboard() {
  const { profile } = useAuth()
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
      {profile?.role === 'member' && (
        <div className="grid grid-cols-2 gap-6">
          <MonthlyQuota refreshKey={quotaRefreshKey} />
          <UpcomingBookings pageSize={5} onBookingsChanged={() => setQuotaRefreshKey((k) => k + 1)} />
        </div>
      )}

      {profile?.role === 'manager' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ManageResources />
          <SiteBookings />
        </div>
      )}
    </div>
  )
}
