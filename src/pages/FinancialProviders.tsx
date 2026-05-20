import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import {
  getProviderCatalogs,
  getProvidersByUser,
  createProvider,
  updateProvider,
  deleteProvider,
  createProviderCatalog,
  deleteProviderCatalog,
} from '../api/financialProviders'
import type { FinancialProvider, CreateFinancialProviderReq } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { Plus, Trash2, Edit2, Building2 } from 'lucide-react'

export default function FinancialProviders() {
  const { email } = useUser()
  const qc = useQueryClient()

  const [showProviderModal, setShowProviderModal] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [editProvider, setEditProvider] = useState<FinancialProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'provider'; id: string } | { type: 'catalog'; id: number } | null
  >(null)
  const [newCatalogName, setNewCatalogName] = useState('')
  const [form, setForm] = useState<Partial<CreateFinancialProviderReq>>({})

  const { data: catalogs = [], isLoading: loadingCatalogs } = useQuery({
    queryKey: ['providerCatalogs'],
    queryFn: getProviderCatalogs,
  })

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['providers', email],
    queryFn: () => getProvidersByUser(email!),
    enabled: !!email,
  })

  const createMut = useMutation({
    mutationFn: (req: CreateFinancialProviderReq) => createProvider(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
      setShowProviderModal(false)
      setForm({})
    },
  })

  const updateMut = useMutation({
    mutationFn: (p: FinancialProvider) => updateProvider(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
      setEditProvider(null)
      setShowProviderModal(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (code: string) => deleteProvider(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
      setDeleteTarget(null)
    },
  })

  const createCatalogMut = useMutation({
    mutationFn: (name: string) => createProviderCatalog(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providerCatalogs'] })
      setShowCatalogModal(false)
      setNewCatalogName('')
    },
  })

  const deleteCatalogMut = useMutation({
    mutationFn: (id: number) => deleteProviderCatalog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providerCatalogs'] })
      setDeleteTarget(null)
    },
  })

  const openCreate = () => {
    setForm({})
    setEditProvider(null)
    setShowProviderModal(true)
  }

  const openEdit = (p: FinancialProvider) => {
    setEditProvider(p)
    setForm({ name: p.name, code: p.code })
    setShowProviderModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editProvider) {
      updateMut.mutate({ ...editProvider, name: form.name! })
    } else {
      createMut.mutate({ ...(form as CreateFinancialProviderReq), email: email! })
    }
  }

  if (loadingCatalogs || loadingProviders) return <LoadingSpinner />

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Providers</h1>
          <p className="text-sm text-gray-500">Banks and financial institutions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Plus size={15} /> Add Type
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={15} /> Add Provider
          </button>
        </div>
      </div>

      {/* Catalog chips */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Provider Types</h2>
        <div className="flex flex-wrap gap-2">
          {catalogs.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-sm px-3 py-1 rounded-full"
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
            <p className="text-sm text-gray-400">No types yet — add one first.</p>
          )}
        </div>
      </div>

      {/* Providers table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Your Providers</h2>
        </div>
        {providers.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Building2 size={40} className="mx-auto mb-2 opacity-25" />
            <p className="text-sm">No providers yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {providers.map((p) => (
                <tr key={p.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{p.code}</td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {p.financialProviderCatalog?.name ?? '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1 text-blue-500 hover:text-blue-700 mr-1"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'provider', id: p.code })}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Provider modal */}
      {showProviderModal && (
        <Modal
          title={editProvider ? 'Edit Provider' : 'Add Financial Provider'}
          onClose={() => setShowProviderModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editProvider && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  required
                  value={form.code ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="BANK_001"
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
                placeholder="Bank name"
              />
            </div>
            {!editProvider && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  required
                  value={form.catalogId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, catalogId: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select type…</option>
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
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editProvider ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Catalog modal */}
      {showCatalogModal && (
        <Modal title="Add Provider Type" onClose={() => setShowCatalogModal(false)}>
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
                placeholder="e.g. Bank, Credit Card, Store"
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

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete this ${deleteTarget.type}? This action cannot be undone.`}
          onConfirm={() => {
            if (deleteTarget.type === 'provider') deleteMut.mutate(deleteTarget.id)
            else deleteCatalogMut.mutate(deleteTarget.id)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
