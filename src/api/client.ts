import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const apiWithEmail = (email: string) =>
  axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json', email },
  })

type LogEntry = {
  id: string
  method: string
  url: string
  status: number | null
  timestamp: string
  duration: number | null
  isError: boolean
}

type LogHandler = (entry: LogEntry) => void
type ToastHandler = (message: string) => void

let _logHandler: LogHandler | null = null
let _toastHandler: ToastHandler | null = null

export function registerLogHandler(fn: LogHandler) {
  _logHandler = fn
}

export function registerToastHandler(fn: ToastHandler) {
  _toastHandler = fn
}

function attachInterceptors(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use((config) => {
    (config as any)._startTime = Date.now()
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const start = (response.config as any)._startTime
      const duration = start ? Date.now() - start : null
      _logHandler?.({
        id: crypto.randomUUID(),
        method: response.config.method?.toUpperCase() ?? 'GET',
        url: response.config.url ?? '',
        status: response.status,
        timestamp: new Date().toISOString(),
        duration,
        isError: false,
      })
      return response
    },
    (error) => {
      const config = error.config ?? {}
      const start = config._startTime
      const duration = start ? Date.now() - start : null
      const status = error.response?.status ?? null
      const message =
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        'Request failed'

      _logHandler?.({
        id: crypto.randomUUID(),
        method: config.method?.toUpperCase() ?? 'UNKNOWN',
        url: config.url ?? '',
        status,
        timestamp: new Date().toISOString(),
        duration,
        isError: true,
      })

      _toastHandler?.(String(message))
      return Promise.reject(error)
    },
  )
}

attachInterceptors(api)
