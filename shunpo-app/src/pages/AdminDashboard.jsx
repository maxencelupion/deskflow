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
    <div className="flex-1 bg-home-bg text-home-ink">
      <div className="mx-auto max-w-300 px-6 py-9 md:px-14">
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">{formatGreetingDate()}</h1>
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
