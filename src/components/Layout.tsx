import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useRequestLog } from '../context/RequestLogContext'
import { useToast } from '../context/ToastContext'
import { registerLogHandler, registerToastHandler } from '../api/client'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import ToastContainer from './ToastContainer'
import RequestLogPanel from './RequestLogPanel'

export default function Layout() {
  const { email } = useUser()
  const { addEntry } = useRequestLog()
  const { showToast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    registerLogHandler(addEntry)
    registerToastHandler((msg) => showToast(msg, 'error'))
  }, [addEntry, showToast])

  if (!email) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile topbar */}
      <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 text-white shrink-0 border-b border-gray-700">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1 text-gray-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold tracking-tight">FinanceDebt</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-16 md:pb-10">
          <Outlet />
        </main>
      </div>

      <div className="hidden md:block">
        <RequestLogPanel />
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
