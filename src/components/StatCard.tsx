import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  icon: ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  subtitle?: string
}

const bg: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
}

export default function StatCard({ title, value, icon, color = 'blue', subtitle }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4">
      <div className={`${bg[color]} p-3 rounded-lg text-white shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
