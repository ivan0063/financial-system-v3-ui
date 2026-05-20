import { api, apiWithEmail } from './client'
import type { Debt, CreateDebtReq } from '../types'

export const getDebtsByAccount = (accountCode: string) =>
  api.get<Debt[]>(`/debt/all/${accountCode}`).then((r) => r.data)

export const getDebtsByUser = (email: string) =>
  apiWithEmail(email).get<Debt[]>('/debt/all').then((r) => r.data)

export const createDebt = (req: CreateDebtReq, accountCode: string) =>
  api.post<Debt>(`/debt/${accountCode}`, req).then((r) => r.data)

export const updateDebt = (debt: Debt) => api.put<Debt>('/debt', debt).then((r) => r.data)

export const deleteDebt = (id: number) => api.delete(`/debt/${id}`)

export const payOffAccount = (accountCode: string) =>
  api.patch<Debt[]>(`/debt/management/payOff/${accountCode}`).then((r) => r.data)
