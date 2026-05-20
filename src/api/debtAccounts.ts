import { api } from './client'
import type { DebtAccount, DebtAccountStatusDto, CreateDebtAccountReq } from '../types'

export const getDebtAccountsByProvider = (providerCode: string) =>
  api.get<DebtAccount[]>(`/debt/account/all/${providerCode}`).then((r) => r.data)

export const getDebtAccountStatus = (code: string) =>
  api.get<DebtAccountStatusDto>(`/debt/account/status/${code}`).then((r) => r.data)

export const createDebtAccount = (req: CreateDebtAccountReq, providerCode: string) =>
  api.post<DebtAccount>(`/debt/account/${providerCode}`, req).then((r) => r.data)

export const updateDebtAccount = (account: DebtAccount) =>
  api.put<DebtAccount>('/debt/account', account).then((r) => r.data)

export const deleteDebtAccount = (code: string) => api.delete(`/debt/account/${code}`)
