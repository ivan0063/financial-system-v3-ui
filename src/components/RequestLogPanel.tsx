import { useState } from 'react'
import { Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useRequestLog } from '../context/RequestLogContext'

const statusColor = (status: number | null, isError: boolean) => {
  if (isError || (status !== null && status >= 400)) return 'text-red-600'
  if (status !== null && status >= 200 && status < 300) return 'text-green-600'
  return 'text-gray-500'
}

export default function RequestLogPanel() {
  const { entries, clearLog } = useRequestLog()
  const [open, setOpen] = useState(false)

  const errorCount = entries.filter((e) => e.isError).length

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <Activity size={14} className={errorCount > 0 ? 'text-red-500' : 'text-green-500'} />
          API Log
          {errorCount > 0 && (
            <span className="bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 text-xs">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-gray-400">({entries.length} total)</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-gray-100">
          <div className="flex justify-end px-3 py-1.5 border-b border-gray-100">
            <button
              onClick={clearLog}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-4">No requests yet</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-3 py-1.5 font-medium">Method</th>
                  <th className="px-3 py-1.5 font-medium">URL</th>
                  <th className="px-3 py-1.5 font-medium">Status</th>
                  <th className="px-3 py-1.5 font-medium">Duration</th>
                  <th className="px-3 py-1.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((e) => (
                  <tr key={e.id} className={e.isError ? 'bg-red-50' : ''}>
                    <td className="px-3 py-1.5 font-mono font-semibold text-blue-700">{e.method}</td>
                    <td className="px-3 py-1.5 font-mono text-gray-700 max-w-xs truncate">{e.url}</td>
                    <td className={`px-3 py-1.5 font-semibold ${statusColor(e.status, e.isError)}`}>
                      {e.status ?? '—'}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">
                      {e.duration != null ? `${e.duration}ms` : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-gray-400">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
