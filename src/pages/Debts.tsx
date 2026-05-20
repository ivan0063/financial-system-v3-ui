import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import { getProvidersByUser } from '../api/financialProviders'
import { getDebtAccountsByProvider } from '../api/debtAccounts'
import { getDebtsByAccount, createDebt, updateDebt, deleteDebt, payOffAccount } from '../api/debts'
import type { Debt, CreateDebtReq } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { Plus, Trash2, Edit2, Receipt } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)

export default function Debts() {
  const { email } = useUser()
  const qc = useQueryClient()

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editDebt, setEditDebt] = useState<Debt | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<CreateDebtReq>>({})

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

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts', selectedAccount],
    queryFn: () => getDebtsByAccount(selectedAccount!),
    enabled: !!selectedAccount,
  })

  const createMut = useMutation({
    mutationFn: (req: CreateDebtReq) => createDebt(req, selectedAccount!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] })
      setShowModal(false)
      setForm({})
    },
  })

  const updateMut = useMutation({
    mutationFn: (d: Debt) => updateDebt(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] })
      setEditDebt(null)
      setShowModal(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteDebt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] })
      setDeleteTarget(null)
    },
  })

  const payOffMut = useMutation({
    mutationFn: () => payOffAccount(selectedAccount!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })

  const openCreate = () => {
    setForm({})
    setEditDebt(null)
    setShowModal(true)
  }

  const openEdit = (d: Debt) => {
    setEditDebt(d)
    setForm({
      description: d.description,
      operationDate: d.operationDate,
      currentInstallment: d.currentInstallment,
      maxFinancingTerm: d.maxFinancingTerm,
      originalAmount: d.originalAmount,
      monthlyPayment: d.monthlyPayment,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editDebt) {
      updateMut.mutate({ ...editDebt, ...form } as Debt)
    } else {
      createMut.mutate(form as CreateDebtReq)
    }
  }

  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0)
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debts</h1>
          <p className="text-sm text-gray-500">Individual debt items per account</p>
        </div>
        <div className="flex gap-2">
          {selectedAccount && (
            <>
              <button
                onClick={() => payOffMut.mutate()}
                disabled={payOffMut.isPending}
                className="px-3 py-2 border border-green-600 text-green-700 rounded-lg text-sm hover:bg-green-50 disabled:opacity-50"
              >
                Advance Installments
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Plus size={15} /> Add Debt
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
          <select
            value={selectedProvider ?? ''}
            onChange={(e) => {
              setSelectedProvider(e.target.value || null)
              setSelectedAccount(null)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
      {selectedAccount && debts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Active Debts</p>
            <p className="text-2xl font-bold text-gray-900">{debts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Monthly Payments</p>
            <p className="text-2xl font-bold text-red-600">{fmt(totalMonthly)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Total Original</p>
            <p className="text-2xl font-bold text-blue-600">{fmt(totalOriginal)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!selectedAccount ? (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center text-gray-400">
          <Receipt size={36} className="mx-auto mb-2 opacity-25" />
          <p className="text-sm">Select a provider and account to view debts</p>
        </div>
      ) : isLoading ? (
        <LoadingSpinner />
      ) : debts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center text-gray-400">
          <Receipt size={36} className="mx-auto mb-2 opacity-25" />
          <p className="text-sm">No debts for this account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Description</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Progress</th>
                <th className="px-6 py-3 text-right font-medium">Monthly</th>
                <th className="px-6 py-3 text-right font-medium">Original</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {debts.map((d) => {
                const pct = Math.min(
                  (d.currentInstallment / d.maxFinancingTerm) * 100,
                  100,
                )
                const remaining = d.maxFinancingTerm - d.currentInstallment
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{d.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{d.operationDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            remaining <= 3
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {d.currentInstallment}/{d.maxFinancingTerm}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">{fmt(d.monthlyPayment)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{fmt(d.originalAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1 text-blue-500 hover:text-blue-700 mr-1"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editDebt ? 'Edit Debt' : 'Add Debt'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                required
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Date
              </label>
              <input
                required
                value={form.operationDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, operationDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 2024-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Installment
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.currentInstallment ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentInstallment: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Term</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.maxFinancingTerm ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxFinancingTerm: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Amount
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.originalAmount ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, originalAmount: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Payment
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.monthlyPayment ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, monthlyPayment: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editDebt ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          message="Delete this debt entry?"
          onConfirm={() => deleteMut.mutate(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
