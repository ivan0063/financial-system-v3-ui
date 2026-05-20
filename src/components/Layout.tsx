import { Outlet, Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Sidebar from './Sidebar'

export default function Layout() {
  const { email } = useUser()

  if (!email) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
