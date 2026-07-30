import { usePageSize } from '@/hooks/usePageSize'
import { useSites } from '@/hooks/useSites'
import { formatGreetingDate } from '@/lib/dates'
import { AdminSitesTable } from '@/components/AdminSitesTable'
import { AdminResourcesTable } from '@/components/AdminResourcesTable'
import { AdminSiteBookingsList } from '@/components/AdminSiteBookingsList'

export default function AdminDashboard() {
  const pageSize = usePageSize()
  const { sites, loading: sitesLoading, refetch: refetchSites } = useSites()

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="mb-12">
          <h1 className="home-h1">{formatGreetingDate()}</h1>
          <p className="mt-2 text-sm text-home-muted">Manage sites, resources and bookings across the company.</p>
        </div>

        <div className="flex flex-col gap-14">
          <AdminSitesTable pageSize={pageSize} onSiteAdded={refetchSites} />
          <AdminResourcesTable pageSize={pageSize} sites={sites} sitesLoading={sitesLoading} />
          <AdminSiteBookingsList pageSize={pageSize} sites={sites} />
        </div>
      </div>
    </div>
  )
}
