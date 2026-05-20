import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import {
  getExpenseCatalogs,
  getExpensesByUser,
  createExpense,
  updateExpense,
  deleteExpense,
  createExpenseCatalog,
  deleteExpenseCatalog,
} from '../api/fixedExpenses'
import type { FixedExpense, FixedExpenseReq } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { Plus, Trash2, Edit2, ListChecks } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)

export default function FixedExpenses() {
  const { email } = useUser()
  const qc = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [editExpense, setEditExpense] = useState<FixedExpense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'expense'; id: number } | { type: 'catalog'; id: number } | null
  >(null)
  const [newCatalogName, setNewCatalogName] = useState('')
  const [form, setForm] = useState<Partial<FixedExpenseReq>>({})

  const { data: catalogs = [] } = useQuery({
    queryKey: ['expenseCatalogs'],
    queryFn: getExpenseCatalogs,
  })

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', email],
    queryFn: () => getExpensesByUser(email!),
    enabled: !!email,
  })

  const createMut = useMutation({
    mutationFn: (req: FixedExpenseReq) => createExpense(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setShowModal(false)
      setForm({})
    },
  })

  const updateMut = useMutation({
    mutationFn: (e: FixedExpense) => updateExpense(e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setEditExpense(null)
      setShowModal(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setDeleteTarget(null)
    },
  })

  const createCatalogMut = useMutation({
    mutationFn: (name: string) => createExpenseCatalog(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenseCatalogs'] })
      setShowCatalogModal(false)
      setNewCatalogName('')
    },
  })

  const deleteCatalogMut = useMutation({
    mutationFn: (id: number) => deleteExpenseCatalog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenseCatalogs'] })
      setDeleteTarget(null)
    },
  })

  const openCreate = () => {
    setForm({})
    setEditExpense(null)
    setShowModal(true)
  }

  const openEdit = (e: FixedExpense) => {
    setEditExpense(e)
    setForm({ name: e.name, monthlyCost: e.monthlyCost, paymentDay: e.paymentDay })
    setShowModal(true)
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (editExpense) {
      updateMut.mutate({
        ...editExpense,
        name: form.name!,
        monthlyCost: form.monthlyCost!,
        paymentDay: form.paymentDay!,
      })
    } else {
      createMut.mutate({ ...(form as FixedExpenseReq), email: email! })
    }
  }

  const total = expenses.reduce((s, e) => s + e.monthlyCost, 0)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixed Expenses</h1>
          <p className="text-sm text-gray-500">Recurring monthly bills</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Plus size={15} /> Add Category
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* Total banner */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div className="bg-yellow-500 p-3 rounded-lg text-white">
          <ListChecks size={22} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Monthly Fixed Expenses</p>
          <p className="text-3xl font-bold text-gray-900">{fmt(total)}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {catalogs.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-800 text-sm px-3 py-1 rounded-full"
            >
              {c.name}
              <button
                onClick={() => setDeleteTarget({ type: 'catalog', id: c.id })}
                className="hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </span>
          ))}
          {catalogs.length === 0 && (
            <p className="text-sm text-gray-400">No categories yet.</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Expenses ({expenses.length})</h2>
        </div>
        {expenses.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ListChecks size={36} className="mx-auto mb-2 opacity-25" />
            <p className="text-sm">No fixed expenses yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-left font-medium">Pay Day</th>
                <th className="px-6 py-3 text-right font-medium">Monthly Cost</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{e.name}</td>
                  <td className="px-6 py-4 text-gray-500">{e.fixedExpenseCatalog?.name ?? '-'}</td>
                  <td className="px-6 py-4">Day {e.paymentDay}</td>
                  <td className="px-6 py-4 text-right font-semibold">{fmt(e.monthlyCost)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(e)}
                      className="p-1 text-blue-500 hover:text-blue-700 mr-1"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'expense', id: e.id })}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-700">
                  Total
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Expense modal */}
      {showModal && (
        <Modal
          title={editExpense ? 'Edit Expense' : 'Add Fixed Expense'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                required
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Cost
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.monthlyCost ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, monthlyCost: Number(e.target.value) }))
                  }
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
                  value={form.paymentDay ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentDay: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            {!editExpense && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={form.catalogId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, catalogId: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select category…</option>
                  {catalogs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                {editExpense ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Catalog modal */}
      {showCatalogModal && (
        <Modal title="Add Category" onClose={() => setShowCatalogModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createCatalogMut.mutate(newCatalogName)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                required
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Utilities, Rent, Insurance"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete this ${deleteTarget.type}?`}
          onConfirm={() => {
            if (deleteTarget.type === 'expense') deleteMut.mutate(deleteTarget.id)
            else deleteCatalogMut.mutate(deleteTarget.id)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
