import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardView from './views/DashboardView'
import BulkView from './views/BulkView'
import ProfileView from './views/ProfileView'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/bulk" element={<BulkView />} />
        <Route path="/profile" element={<ProfileView />} />
      </Route>
    </Routes>
  )
}
