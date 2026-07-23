import { usePageSize } from '@/hooks/usePageSize'
import { ManageUsers } from '@/components/ManageUsers'

export default function Users() {
  const pageSize = usePageSize()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
      <h1 className="text-2xl font-semibold">Users</h1>
      <ManageUsers pageSize={pageSize} />
    </div>
  )
}
