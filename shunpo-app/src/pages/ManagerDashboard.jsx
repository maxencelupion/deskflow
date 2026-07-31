import { useState } from 'react'
import { usePageSize } from '@/hooks/usePageSize'
import { formatGreetingDate } from '@/lib/dates'
import { ManagerResourcesTable } from '@/components/ManagerResourcesTable'
import { ManagerSiteBookings } from '@/components/ManagerSiteBookings'

export default function ManagerDashboard() {
  const pageSize = usePageSize()
  const [resourcesReloadKey, setResourcesReloadKey] = useState(0)

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="mb-8">
          <h1 className="home-h1-sm">{formatGreetingDate()}</h1>
          <p className="mt-1 text-sm text-home-muted">Manage your site's resources and bookings.</p>
        </div>

        <div className="mb-8 h-55 w-full overflow-hidden rounded-2xl shadow-[0_8px_24px_-8px_rgba(17,17,17,0.25)]">
          <img src="/manager_dashboard.png" alt="" className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col gap-6">
          <ManagerResourcesTable
            pageSize={pageSize}
            onResourceChanged={() => setResourcesReloadKey((k) => k + 1)}
          />
          <ManagerSiteBookings pageSize={pageSize} reloadKey={resourcesReloadKey} />
        </div>
      </div>
    </div>
  )
}
