import { usePageSize } from '@/hooks/usePageSize'
import { AdminDashboardSection } from '@/components/AdminDashboardSection'
import { PageBanner } from '@/components/PageBanner'

export default function AdminDashboard() {
  const pageSize = usePageSize()

  return (
    <>
      <PageBanner
        title="Welcome back"
        subtitle="Here's what's coming up for you."
        image="/worker.svg"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
        <AdminDashboardSection pageSize={pageSize} />
      </div>
    </>
  )
}
