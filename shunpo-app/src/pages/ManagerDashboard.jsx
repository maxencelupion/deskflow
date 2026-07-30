import { usePageSize } from '@/hooks/usePageSize'
import { formatGreetingDate } from '@/lib/dates'
import { ManagerResourcesTable } from '@/components/ManagerResourcesTable'
import { ManagerSiteBookings } from '@/components/ManagerSiteBookings'

export default function ManagerDashboard() {
  const pageSize = usePageSize()

  return (
    <div className="flex-1 bg-home-bg text-home-ink">
      <div className="mx-auto max-w-300 px-6 py-9 md:px-14">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold">{formatGreetingDate()}</h1>
          <p className="mt-1 text-sm text-home-muted">Manage your site's resources and bookings.</p>
        </div>

        <div className="mb-8 h-55 w-full overflow-hidden rounded-2xl shadow-[0_8px_24px_-8px_rgba(17,17,17,0.25)]">
          <img src="/manager_dashboard.png" alt="" className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col gap-6">
          <ManagerResourcesTable pageSize={pageSize} />
          <ManagerSiteBookings pageSize={pageSize} />
        </div>
      </div>
    </div>
  )
}
