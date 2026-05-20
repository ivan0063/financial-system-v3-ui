import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { useUser } from '../context/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import {
  DollarSign,
  TrendingDown,
  CreditCard,
  Receipt,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6']

export default function Dashboard() {
  const { email } = useUser()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', email],
    queryFn: () => getDashboard(email!),
    enabled: !!email,
  })

  if (isLoading) return <LoadingSpinner />

  if (isError || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm">
            Could not load dashboard. Make sure the backend is running on port 666.
          </span>
        </div>
      </div>
    )
  }

  const available =
    (data.salary ?? 0) -
    (data.monthlyDebtPaymentAmount ?? 0) -
    (data.monthlyFixedExpensesAmount ?? 0)

  const pieData = [
    { name: 'Debt Payments', value: data.monthlyDebtPaymentAmount ?? 0 },
    { name: 'Fixed Expenses', value: data.monthlyFixedExpensesAmount ?? 0 },
    { name: 'Savings', value: data.savings ?? 0 },
    { name: 'Available', value: Math.max(available, 0) },
  ].filter((d) => d.value > 0)

  const accountChartData = (data.userDebtAccounts ?? []).map((a) => ({
    name: a.name,
    credit: a.credit,
  }))

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Financial overview for {email}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Salary"
          value={fmt(data.salary)}
          icon={<DollarSign size={20} />}
          color="blue"
        />
        <StatCard
          title="Savings"
          value={fmt(data.savings)}
          icon={<PiggyBank size={20} />}
          color="green"
        />
        <StatCard
          title="Monthly Debt Payments"
          value={fmt(data.monthlyDebtPaymentAmount)}
          icon={<TrendingDown size={20} />}
          color="red"
        />
        <StatCard
          title="Total Debt (Loan)"
          value={fmt(data.debtLoanAmount)}
          icon={<CreditCard size={20} />}
          color="purple"
        />
        <StatCard
          title="Fixed Expenses / mo"
          value={fmt(data.monthlyFixedExpensesAmount)}
          icon={<Receipt size={20} />}
          color="yellow"
        />
        <StatCard
          title="Available After Bills"
          value={fmt(available)}
          icon={<DollarSign size={20} />}
          color={available >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Debt Accounts"
          value={String(data.userDebtAccounts?.length ?? 0)}
          icon={<CreditCard size={20} />}
          color="blue"
        />
        <StatCard
          title="Life-Plan Debt Total"
          value={fmt(data.debtForLifePlanAmount)}
          icon={<TrendingDown size={20} />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Budget Split</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {accountChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Credit Limit by Account
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={accountChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="credit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Almost completed debts */}
      {(data.almostCompletedDebts?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-500" />
            Almost Paid Off
          </h2>
          <div className="space-y-3">
            {data.almostCompletedDebts.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.description}</p>
                  <p className="text-xs text-gray-500">{d.remainingInstallments} installments left</p>
                </div>
                <span className="text-sm font-semibold text-green-700">{fmt(d.monthlyPayment)}/mo</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed expenses summary */}
      {(data.userFixedExpenses?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Fixed Expenses</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Monthly Cost</th>
                  <th className="pb-2 font-medium">Pay Day</th>
                </tr>
              </thead>
              <tbody>
                {data.userFixedExpenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2">{e.name}</td>
                    <td className="py-2 text-gray-500">{e.fixedExpenseCatalog?.name ?? '-'}</td>
                    <td className="py-2 text-right font-semibold">{fmt(e.monthlyCost)}</td>
                    <td className="py-2 text-gray-500">Day {e.paymentDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
