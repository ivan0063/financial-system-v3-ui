import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import { getProvidersByUser } from '../api/financialProviders'
import {
  getDebtAccountsByProvider,
  createDebtAccount,
  updateDebtAccount,
  deleteDebtAccount,
  getDebtAccountStatus,
} from '../api/debtAccounts'
import type { DebtAccount, CreateDebtAccountReq } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { Plus, Trash2, Edit2, CreditCard, ChevronRight, ChevronDown } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)

const STATEMENT_TYPES = ['DIGITAL', 'PDF', 'EMAIL', 'PHYSICAL', 'ONLINE']

export default function DebtAccounts() {
  const { email } = useUser()
  const qc = useQueryClient()

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editAccount, setEditAccount] = useState<DebtAccount | null>(null)
  const [statusAccount, setStatusAccount] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<CreateDebtAccountReq>>({})

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['providers', email],
    queryFn: () => getProvidersByUser(email!),
    enabled: !!email,
  })

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['debtAccounts', selectedProvider],
    queryFn: () => getDebtAccountsByProvider(selectedProvider!),
    enabled: !!selectedProvider,
  })

  const { data: accountStatus } = useQuery({
    queryKey: ['accountStatus', statusAccount],
    queryFn: () => getDebtAccountStatus(statusAccount!),
    enabled: !!statusAccount,
  })

  const createMut = useMutation({
    mutationFn: (req: CreateDebtAccountReq) => createDebtAccount(req, selectedProvider!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debtAccounts'] })
      setShowModal(false)
      setForm({})
    },
  })

  const updateMut = useMutation({
    mutationFn: (a: DebtAccount) => updateDebtAccount(a),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debtAccounts'] })
      setEditAccount(null)
      setShowModal(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (code: string) => deleteDebtAccount(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debtAccounts'] })
      setDeleteTarget(null)
    },
  })

  const openCreate = () => {
    setForm({})
    setEditAccount(null)
    setShowModal(true)
  }

  const openEdit = (acc: DebtAccount) => {
    setEditAccount(acc)
    setForm({
      name: acc.name,
      payDay: acc.payDay,
      credit: acc.credit,
      accountStatementType: acc.accountStatementType,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editAccount) {
      updateMut.mutate({ ...editAccount, ...form } as DebtAccount)
    } else {
      createMut.mutate(form as CreateDebtAccountReq)
    }
  }

  if (loadingProviders) return <LoadingSpinner />

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debt Accounts</h1>
          <p className="text-sm text-gray-500">Credit cards and debt accounts per provider</p>
        </div>
        {selectedProvider && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={15} /> Add Account
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider list */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-fit">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Providers</p>
          </div>
          <div className="divide-y">
            {providers.map((p) => (
              <button
                key={p.code}
                onClick={() => {
                  setSelectedProvider(p.code)
                  setStatusAccount(null)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  selectedProvider === p.code
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{p.name}</span>
                <ChevronRight size={15} className="text-gray-400" />
              </button>
            ))}
            {providers.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No providers. Add one first.</p>
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedProvider ? (
            <div className="bg-white rounded-xl shadow-sm py-16 text-center text-gray-400">
              <CreditCard size={36} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm">Select a provider to see accounts</p>
            </div>
          ) : loadingAccounts ? (
            <LoadingSpinner />
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm py-16 text-center text-gray-400">
              <CreditCard size={36} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm">No accounts for this provider.</p>
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.code}
                className={`bg-white rounded-xl shadow-sm p-5 ${
                  statusAccount === acc.code ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{acc.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{acc.code}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>
                        Credit: <strong className="text-gray-900">{fmt(acc.credit)}</strong>
                      </span>
                      <span>
                        Pay Day: <strong className="text-gray-900">{acc.payDay}</strong>
                      </span>
                      <span>
                        Type:{' '}
                        <strong className="text-gray-900">{acc.accountStatementType}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setStatusAccount(statusAccount === acc.code ? null : acc.code)
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      Status{' '}
                      {statusAccount === acc.code ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(acc)}
                      className="p-1.5 text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(acc.code)}
                      className="p-1.5 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {statusAccount === acc.code && accountStatus && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-sm">
                      Monthly Payment:{' '}
                      <strong className="text-blue-600">{fmt(accountStatus.monthPayment)}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      {accountStatus.debts?.length ?? 0} active debt(s)
                    </p>
                    {(accountStatus.almostCompletedDebts?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-green-700 mb-1">Almost done:</p>
                        {accountStatus.almostCompletedDebts.map((d, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            {d.description} — {d.remainingInstallments} installments left
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Account Modal */}
      {showModal && (
        <Modal
          title={editAccount ? 'Edit Account' : 'Add Debt Account'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  required
                  value={form.code ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="ACC_001"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                required
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Account name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                <input
                  required
                  type="number"
                  value={form.credit ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, credit: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay Day</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={31}
                  value={form.payDay ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, payDay: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statement Type
              </label>
              <select
                required
                value={form.accountStatementType ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountStatementType: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {STATEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
                {editAccount ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message="Delete this account? All associated debts will also be removed."
          onConfirm={() => deleteMut.mutate(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
