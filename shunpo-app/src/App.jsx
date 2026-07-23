import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          // GuestRoute prevents authenticated users from accessing the login page.
          // Outside <Layout> on purpose: a full-bleed auth screen, no navbar/footer.
          <GuestRoute>
            <Auth />
          </GuestRoute>
        }
      />
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
