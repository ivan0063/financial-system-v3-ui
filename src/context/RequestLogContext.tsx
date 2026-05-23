import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

export interface RequestLogEntry {
  id: string
  method: string
  url: string
  status: number | null
  timestamp: string
  duration: number | null
  isError: boolean
}

const STORAGE_KEY = 'fs_request_log'
const MAX_ENTRIES = 100

interface RequestLogContextType {
  entries: RequestLogEntry[]
  addEntry: (entry: RequestLogEntry) => void
  clearLog: () => void
}

const RequestLogContext = createContext<RequestLogContextType | null>(null)

export function RequestLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<RequestLogEntry[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const addEntry = useCallback((entry: RequestLogEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES)
      return next
    })
  }, [])

  const clearLog = useCallback(() => {
    setEntries([])
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <RequestLogContext.Provider value={{ entries, addEntry, clearLog }}>
      {children}
    </RequestLogContext.Provider>
  )
}

export function useRequestLog() {
  const ctx = useContext(RequestLogContext)
  if (!ctx) throw new Error('useRequestLog must be inside RequestLogProvider')
  return ctx
}
