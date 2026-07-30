import { usePageSize } from '@/hooks/usePageSize'
import { formatGreetingDate } from '@/lib/dates'
import { AdminUsersTable } from '@/components/AdminUsersTable'

export default function Users() {
  const pageSize = usePageSize()

  return (
    <div className="flex-1 bg-home-bg text-home-ink">
      <div className="mx-auto max-w-300 px-6 py-9 md:px-14">
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">{formatGreetingDate()}</h1>
          <p className="mt-2 text-sm text-home-muted">Manage member roles and access.</p>
        </div>

        <div className="flex flex-col gap-14">
          <AdminUsersTable pageSize={pageSize} />
        </div>
      </div>
    </div>
  )
}
