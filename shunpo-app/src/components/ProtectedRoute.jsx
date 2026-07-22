import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
