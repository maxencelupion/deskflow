import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Auth from './pages/Auth'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Auth />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}
