import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  FileUp,
  ListChecks,
  DollarSign,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/providers', icon: <Building2 size={20} /> },
  { to: '/accounts', icon: <CreditCard size={20} /> },
  { to: '/debts', icon: <Receipt size={20} /> },
  { to: '/statement', icon: <FileUp size={20} /> },
  { to: '/expenses', icon: <ListChecks size={20} /> },
  { to: '/payments', icon: <DollarSign size={20} /> },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-30 md:hidden">
      <div className="flex items-center justify-around h-14">
        {NAV.map(({ to, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                isActive ? 'text-blue-400 bg-blue-900/40' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {icon}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
