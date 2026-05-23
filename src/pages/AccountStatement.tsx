import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import { getProvidersByUser } from '../api/financialProviders'
import { getDebtAccountsByProvider } from '../api/debtAccounts'
import { extractFromStatement, syncFromStatement } from '../api/accountStatement'
import type { AccountStatementPreviewDto, AccountStatementType } from '../types'
import { Upload, FileText, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react'

const STATEMENT_TYPES: AccountStatementType[] = [
  'UNIVERSAL',
  'MANUAL',
  'RAPPI',
  'PALACIO',
  'LIVERPOOL',
  'MERCADO_PAGO',
  'BBVA',
]

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)

type Step = 'setup' | 'preview' | 'synced'

export default function AccountStatement() {
  const { email } = useUser()
  const qc = useQueryClient()

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [statementType, setStatementType] = useState<AccountStatementType | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AccountStatementPreviewDto | null>(null)
  const [syncCount, setSyncCount] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('setup')
  const fileRef = useRef<HTMLInputElement>(null)

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

  const extractMut = useMutation({
    mutationFn: () =>
      extractFromStatement(file!, selectedAccount!, statementType as AccountStatementType),
    onSuccess: (data) => {
      setPreview(data)
      setStep('preview')
    },
  })

  const syncMut = useMutation({
    mutationFn: () =>
      syncFromStatement(file!, selectedAccount!, statementType as AccountStatementType),
    onSuccess: (data) => {
      setSyncCount(data.length)
      setStep('synced')
      qc.invalidateQueries({ queryKey: ['debts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['accountStatus'] })
    },
  })

  const canExtract = !!selectedAccount && !!statementType && !!file
  const hasChanges =
    (preview?.newDebts.length ?? 0) > 0 || (preview?.installmentUpdates.length ?? 0) > 0

  const reset = () => {
    setStep('setup')
    setPreview(null)
    setSyncCount(null)
    setFile(null)
    extractMut.reset()
    syncMut.reset()
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statement Import</h1>
        <p className="text-sm text-gray-500">
          Upload a bank statement to preview changes and sync debts to the database
        </p>
      </div>

      {/* Step breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(['setup', 'preview', 'synced'] as Step[]).map((s, i) => {
          const labels: Record<Step, string> = {
            setup: '1  Configure',
            preview: '2  Review Changes',
            synced: '3  Done',
          }
          const current = step === s
          const past =
            (s === 'setup' && (step === 'preview' || step === 'synced')) ||
            (s === 'preview' && step === 'synced')
          return (
            <>
              <span
                key={s}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  current
                    ? 'bg-blue-600 text-white'
                    : past
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {labels[s]}
              </span>
              {i < 2 && <ArrowRight size={14} className="text-gray-300" />}
            </>
          )
        })}
      </div>

      {/* ── STEP 1: Setup ── */}
      {step === 'setup' && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Configuration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={selectedProvider ?? ''}
                onChange={(e) => {
                  setSelectedProvider(e.target.value || null)
                  setSelectedAccount(null)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select provider…</option>
                {providers.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={selectedAccount ?? ''}
                onChange={(e) => setSelectedAccount(e.target.value || null)}
                disabled={!selectedProvider}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statement Type
              </label>
              <select
                value={statementType}
                onChange={(e) => setStatementType(e.target.value as AccountStatementType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select type…</option>
                {STATEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-colors ${
              file
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3 text-blue-700">
                <FileText size={28} />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload size={32} className="mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Click to upload statement</p>
                <p className="text-xs mt-1">PDF or Excel (.xlsx / .xls)</p>
              </div>
            )}
          </div>

          {extractMut.isError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Extraction failed. Verify the file format matches the selected statement type.</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => extractMut.mutate()}
              disabled={!canExtract || extractMut.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {extractMut.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Extracting…
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Extract Preview
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === 'preview' && preview && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
              <p className="text-xs font-medium text-gray-500 mb-1">New Debts</p>
              <p className="text-3xl font-bold text-blue-600">{preview.newDebts.length}</p>
              <p className="text-xs text-gray-400 mt-1">will be added to the database</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
              <p className="text-xs font-medium text-gray-500 mb-1">Installment Updates</p>
              <p className="text-3xl font-bold text-amber-600">{preview.installmentUpdates.length}</p>
              <p className="text-xs text-gray-400 mt-1">existing debts with a new installment count</p>
            </div>
          </div>

          {/* Up-to-date state */}
          {!hasChanges && (
            <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
              <CheckCircle2 size={44} className="mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-gray-800">Everything is up to date</p>
              <p className="text-sm text-gray-500 mt-1">
                No new debts and no installment changes were detected in this statement.
              </p>
            </div>
          )}

          {/* New debts table */}
          {preview.newDebts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  New Debts ({preview.newDebts.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left font-medium">Description</th>
                      <th className="px-4 sm:px-6 py-3 text-left font-medium">Date</th>
                      <th className="px-4 sm:px-6 py-3 text-center font-medium">Installments</th>
                      <th className="px-4 sm:px-6 py-3 text-right font-medium">Monthly</th>
                      <th className="px-4 sm:px-6 py-3 text-right font-medium">Original</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.newDebts.map((d, i) => (
                      <tr key={i} className="hover:bg-blue-50/40">
                        <td className="px-4 sm:px-6 py-3 font-medium">{d.description}</td>
                        <td className="px-4 sm:px-6 py-3 text-gray-500">{d.operationDate}</td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {d.currentInstallment}/{d.maxFinancingTerm}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-right font-semibold">
                          {fmt(d.monthlyPayment)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-right text-gray-500">
                          {fmt(d.originalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Installment updates table */}
          {preview.installmentUpdates.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Installment Updates ({preview.installmentUpdates.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left font-medium">Description</th>
                      <th className="px-4 sm:px-6 py-3 text-center font-medium">Before</th>
                      <th className="px-4 sm:px-6 py-3 text-center font-medium">After</th>
                      <th className="px-4 sm:px-6 py-3 text-center font-medium">Max</th>
                      <th className="px-4 sm:px-6 py-3 text-right font-medium">Monthly</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.installmentUpdates.map((u, i) => {
                      const almostDone =
                        u.debt.maxFinancingTerm - u.newInstallment <= 3
                      return (
                        <tr key={i} className="hover:bg-amber-50/40">
                          <td className="px-4 sm:px-6 py-3 font-medium">{u.debt.description}</td>
                          <td className="px-4 sm:px-6 py-3 text-center text-gray-400">
                            {u.previousInstallment}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-center">
                            <span
                              className={`font-semibold ${
                                almostDone ? 'text-green-600' : 'text-amber-600'
                              }`}
                            >
                              {u.newInstallment}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-center text-gray-500">
                            {u.debt.maxFinancingTerm}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right font-semibold">
                            {fmt(u.debt.monthlyPayment)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Start Over
            </button>

            <div className="flex items-center gap-3">
              {syncMut.isError && (
                <span className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertTriangle size={14} /> Sync failed — try again.
                </span>
              )}
              <button
                onClick={() => syncMut.mutate()}
                disabled={!hasChanges || syncMut.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {syncMut.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Sync to Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 'synced' && (
        <div className="bg-white rounded-xl shadow-sm p-10 sm:p-14 text-center space-y-4">
          <CheckCircle2 size={52} className="mx-auto text-green-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sync Complete</h2>
            <p className="text-gray-500 mt-1">
              {syncCount === 0
                ? 'No changes were needed — database was already up to date.'
                : `${syncCount} debt record(s) were saved or updated.`}
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw size={15} /> Import Another Statement
          </button>
        </div>
      )}
    </div>
  )
}
