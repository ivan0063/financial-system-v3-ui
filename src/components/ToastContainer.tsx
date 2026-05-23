import { X } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const colorMap = {
  error: 'bg-red-600 text-white',
  success: 'bg-green-600 text-white',
  info: 'bg-blue-600 text-white',
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm ${colorMap[t.type]}`}
        >
          <span className="flex-1 break-words">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} className="shrink-0 mt-0.5 opacity-80 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
