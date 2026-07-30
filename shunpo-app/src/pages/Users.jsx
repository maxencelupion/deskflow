import { usePageSize } from '@/hooks/usePageSize'
import { formatGreetingDate } from '@/lib/dates'
import { AdminUsersTable } from '@/components/AdminUsersTable'

export default function Users() {
  const pageSize = usePageSize()

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="mb-12">
          <h1 className="home-h1">{formatGreetingDate()}</h1>
          <p className="mt-2 text-sm text-home-muted">Manage member roles and access.</p>
        </div>

        <div className="flex flex-col gap-14">
          <AdminUsersTable pageSize={pageSize} />
        </div>
      </div>
    </div>
  )
}
