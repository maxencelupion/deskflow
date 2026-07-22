import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function GuestRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return children
}
