import { useAuth } from '@/context/useAuth'
import AdminDashboard from '@/pages/AdminDashboard'
import ManagerDashboard from '@/pages/ManagerDashboard'
import UserDashboard from '@/pages/UserDashboard'

export default function DashboardRouter() {
  const { profile } = useAuth()

  if (profile?.role === 'admin') {
    return <AdminDashboard />
  }

  if (profile?.role === 'manager') {
    return <ManagerDashboard />
  }

  if (profile?.role === 'member') {
    return <UserDashboard />
  }

  return null
}
