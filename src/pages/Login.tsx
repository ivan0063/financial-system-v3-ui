import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const { setEmail: save } = useUser()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    save(email.trim())
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">FinanceDebt</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email to access your financial dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Access Dashboard
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          No authentication required — your email identifies your data.
        </p>
      </div>
    </div>
  )
}
