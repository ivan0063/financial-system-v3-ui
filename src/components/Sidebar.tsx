import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  FileUp,
  ListChecks,
  DollarSign,
  LogOut,
  X,
} from 'lucide-react'
import { useUser } from '../context/UserContext'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/providers', label: 'Financial Providers', icon: <Building2 size={18} /> },
  { to: '/accounts', label: 'Debt Accounts', icon: <CreditCard size={18} /> },
  { to: '/debts', label: 'Debts', icon: <Receipt size={18} /> },
  { to: '/statement', label: 'Statement Import', icon: <FileUp size={18} /> },
  { to: '/expenses', label: 'Fixed Expenses', icon: <ListChecks size={18} /> },
  { to: '/payments', label: 'Payments', icon: <DollarSign size={18} /> },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { email, logout } = useUser()

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0 h-full">
      <div className="px-5 py-6 border-b border-gray-700 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight">FinanceDebt</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{email}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 p-1 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={() => { onClose?.(); logout() }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
