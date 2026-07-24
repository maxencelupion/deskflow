import { useSites } from '@/hooks/useSites'
import { ManageSites } from '@/components/ManageSites'
import { AdminResources } from '@/components/AdminResources'
import { AdminBookings } from '@/components/AdminBookings'

export function AdminDashboardSection({ pageSize }) {
  const { sites, loading, refetch } = useSites()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ManageSites pageSize={pageSize} onSiteAdded={refetch} />
        <AdminResources pageSize={pageSize} sites={sites} sitesLoading={loading} />
      </div>
      <AdminBookings pageSize={pageSize} sites={sites} />
    </div>
  )
}
