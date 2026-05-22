import { api } from './client'
import type { AccountStatementPreviewDto, AccountStatementType, Debt } from '../types'

/**
 * Upload a statement file and get a read-only categorized preview.
 * Nothing is written to the database.
 *
 * POST /account/statement/extract/{debtAccountCode}
 */
export const extractFromStatement = (
  file: File,
  debtAccountCode: string,
  accountStatementType: AccountStatementType,
): Promise<AccountStatementPreviewDto> => {
  const form = new FormData()
  form.append('file', file)
  return api
    .post<AccountStatementPreviewDto>(
      `/account/statement/extract/${debtAccountCode}?accountStatementType=${accountStatementType}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    .then((r) => r.data)
}

/**
 * Upload a statement file and sync it with the database:
 *  - deactivates debts no longer in the statement
 *  - saves new debts
 *  - updates currentInstallment for advanced debts
 *
 * POST /account/statement/sync/{debtAccountCode}
 */
export const syncFromStatement = (
  file: File,
  debtAccountCode: string,
  accountStatementType: AccountStatementType,
): Promise<Debt[]> => {
  const form = new FormData()
  form.append('file', file)
  return api
    .post<Debt[]>(
      `/account/statement/sync/${debtAccountCode}?accountStatementType=${accountStatementType}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    .then((r) => r.data)
}
