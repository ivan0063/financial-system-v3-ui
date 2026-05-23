import { Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { useRequestLog } from '../context/RequestLogContext'
import { useToast } from '../context/ToastContext'
import { registerLogHandler, registerToastHandler } from '../api/client'
import Sidebar from './Sidebar'
import ToastContainer from './ToastContainer'
import RequestLogPanel from './RequestLogPanel'

export default function Layout() {
  const { email } = useUser()
  const { addEntry } = useRequestLog()
  const { showToast } = useToast()

  useEffect(() => {
    registerLogHandler(addEntry)
    registerToastHandler((msg) => showToast(msg, 'error'))
  }, [addEntry, showToast])

  if (!email) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-10">
          <Outlet />
        </main>
      </div>
      <RequestLogPanel />
      <ToastContainer />
    </div>
  )
}
