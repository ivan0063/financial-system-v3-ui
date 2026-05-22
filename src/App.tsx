import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FinancialProviders from './pages/FinancialProviders'
import DebtAccounts from './pages/DebtAccounts'
import Debts from './pages/Debts'
import FixedExpenses from './pages/FixedExpenses'
import Payments from './pages/Payments'
import AccountStatement from './pages/AccountStatement'

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="providers" element={<FinancialProviders />} />
            <Route path="accounts" element={<DebtAccounts />} />
            <Route path="debts" element={<Debts />} />
            <Route path="statement" element={<AccountStatement />} />
            <Route path="expenses" element={<FixedExpenses />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}
