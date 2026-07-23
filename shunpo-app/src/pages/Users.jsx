import { usePageSize } from '@/hooks/usePageSize'
import { ManageUsers } from '@/components/ManageUsers'
import { PageBanner } from '@/components/PageBanner'

export default function Users() {
  const pageSize = usePageSize()

  return (
    <>
      <PageBanner
        title="User management"
        subtitle="Manage member roles and access."
        image="/user_management.svg"
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
        <ManageUsers pageSize={pageSize} />
      </div>
    </>
  )
}
