import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Home from './pages/Home'
import DashboardRouter from './pages/DashboardRouter'
import Users from './pages/Users'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          // Guests see the public landing page
          // Signed-in users get the dashboard inside the regular app <Layout>
          <ProtectedRoute fallback={<Home />}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRouter />} />
      </Route>
      <Route element={<Layout />}>
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
