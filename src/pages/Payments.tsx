import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import { getProvidersByUser } from '../api/financialProviders'
import { getDebtAccountsByProvider } from '../api/debtAccounts'
import { getPayments, doPayment } from '../api/payments'
import LoadingSpinner from '../components/LoadingSpinner'
import { DollarSign, Play, CheckCircle2 } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)

export default function Payments() {
  const { email } = useUser()
  const qc = useQueryClient()

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const { data: providers = [] } = useQuery({
    queryKey: ['providers', email],
    queryFn: () => getProvidersByUser(email!),
    enabled: !!email,
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['debtAccounts', selectedProvider],
    queryFn: () => getDebtAccountsByProvider(selectedProvider!),
    enabled: !!selectedProvider,
  })

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', selectedAccount],
    queryFn: () => getPayments(selectedAccount!),
    enabled: !!selectedAccount,
  })

  const payMut = useMutation({
    mutationFn: () => doPayment(selectedAccount!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      setPaymentSuccess(true)
      setTimeout(() => setPaymentSuccess(false), 3000)
    },
  })

  const totalPaid = payments.reduce((s, p) => s + (p.amount ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Payment history and processing</p>
        </div>
        {selectedAccount && (
          <div className="flex items-center gap-3">
            {paymentSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 size={16} /> Payment processed!
              </span>
            )}
            <button
              onClick={() => payMut.mutate()}
              disabled={payMut.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Play size={15} /> Process Payment
            </button>
          </div>
        )}
      </div>

      {/* Selectors */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
          <select
            value={selectedProvider ?? ''}
            onChange={(e) => {
              setSelectedProvider(e.target.value || null)
              setSelectedAccount(null)
            }}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select provider…</option>
            {providers.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {selectedProvider && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Account</label>
            <select
              value={selectedAccount ?? ''}
              onChange={(e) => setSelectedAccount(e.target.value || null)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedAccount && payments.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Table / Cards */}
      {!selectedAccount ? (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center text-gray-400">
          <DollarSign size={36} className="mx-auto mb-2 opacity-25" />
          <p className="text-sm">Select a provider and account to view payments</p>
        </div>
      ) : isLoading ? (
        <LoadingSpinner />
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center text-gray-400">
          <DollarSign size={36} className="mx-auto mb-2 opacity-25" />
          <p className="text-sm">No payments recorded for this account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Mobile cards */}
          <div className="sm:hidden divide-y">
            {payments.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-mono">#{p.id}</p>
                  <p className="text-sm">{p.paymentDate}</p>
                </div>
                <p className="font-semibold text-green-700">{fmt(p.amount)}</p>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">ID</th>
                  <th className="px-6 py-3 text-left font-medium">Payment Date</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{p.id}</td>
                    <td className="px-6 py-4">{p.paymentDate}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-700">
                      {fmt(p.amount)}
                    </td>
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
