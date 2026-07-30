import { useAuth } from '@/context/useAuth'
import { USER_ROLE } from '@/lib/enums'
import AdminDashboard from '@/pages/AdminDashboard'
import ManagerDashboard from '@/pages/ManagerDashboard'
import UserDashboard from '@/pages/UserDashboard'

export default function DashboardRouter() {
  const { profile } = useAuth()

  if (profile?.role === USER_ROLE.ADMIN) {
    return <AdminDashboard />
  }

  if (profile?.role === USER_ROLE.MANAGER) {
    return <ManagerDashboard />
  }

  if (profile?.role === USER_ROLE.MEMBER) {
    return <UserDashboard />
  }

  return null
}
