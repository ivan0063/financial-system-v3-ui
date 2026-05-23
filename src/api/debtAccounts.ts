import { api } from './client'
import type { AccountStatementType, DebtAccount, CreateDebtAccountReq, DebtAccountStatusDto } from '../types'

export const getDebtAccountsByProvider = (providerCode: string): Promise<DebtAccount[]> =>
  api.get<DebtAccount[]>(`/debt/account/all/${providerCode}`).then((r) => r.data)

export const createDebtAccount = (req: CreateDebtAccountReq, providerCode: string): Promise<DebtAccount> =>
  api.post<DebtAccount>(`/debt/account/${providerCode}`, req).then((r) => r.data)

export const updateDebtAccount = (account: DebtAccount): Promise<DebtAccount> =>
  api.put<DebtAccount>('/debt/account', account).then((r) => r.data)

export const updateDebtAccountStatementType = (
  code: string,
  accountStatementType: AccountStatementType,
): Promise<DebtAccount> =>
  api
    .patch<DebtAccount>(`/debt/account/${code}/statement-type`, null, {
      params: { accountStatementType },
    })
    .then((r) => r.data)

export const deleteDebtAccount = (code: string): Promise<void> =>
  api.delete(`/debt/account/${code}`).then(() => undefined)

export const getDebtAccountStatus = (code: string): Promise<DebtAccountStatusDto> =>
  api.get<DebtAccountStatusDto>(`/debt/account/status/${code}`).then((r) => r.data)
