import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Spinner } from '@/components/Spinner'

export function ProtectedRoute({ children, allowedRoles, fallback }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return fallback ?? <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
