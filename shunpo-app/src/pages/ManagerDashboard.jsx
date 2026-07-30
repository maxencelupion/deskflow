import { usePageSize } from '@/hooks/usePageSize'
import { ManageResources } from '@/components/ManageResources'
import { SiteBookings } from '@/components/SiteBookings'
import { PageBanner } from '@/components/PageBanner'

export default function ManagerDashboard() {
  const pageSize = usePageSize()

  return (
    <>
      <PageBanner
        title="Welcome back"
        subtitle="Here's what's coming up for you."
        image="/worker.svg"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <ManageResources pageSize={pageSize} />
          <SiteBookings pageSize={pageSize} />
        </div>
      </div>
    </>
  )
}
