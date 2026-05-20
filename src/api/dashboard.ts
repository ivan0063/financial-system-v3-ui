import { api } from './client'
import type { UserStatusDashboard } from '../types'

export const getDashboard = (email: string) =>
  api.get<UserStatusDashboard>(`/financial/status/${encodeURIComponent(email)}`).then((r) => r.data)
