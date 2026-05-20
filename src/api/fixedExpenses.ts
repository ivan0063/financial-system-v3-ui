import { api } from './client'
import type { FixedExpense, FixedExpenseCatalog, FixedExpenseReq } from '../types'

export const getExpenseCatalogs = () =>
  api.get<FixedExpenseCatalog[]>('/fixed/expense/catalog/all').then((r) => r.data)

export const createExpenseCatalog = (name: string) =>
  api.post<FixedExpenseCatalog>('/fixed/expense/catalog', { name }).then((r) => r.data)

export const updateExpenseCatalog = (catalog: FixedExpenseCatalog) =>
  api.put<FixedExpenseCatalog>('/fixed/expense/catalog', catalog).then((r) => r.data)

export const deleteExpenseCatalog = (id: number) => api.delete(`/fixed/expense/catalog/${id}`)

export const getExpensesByUser = (email: string) =>
  api.get<FixedExpense[]>(`/fixed/expense/all/${encodeURIComponent(email)}`).then((r) => r.data)

export const createExpense = (req: FixedExpenseReq) =>
  api.post<FixedExpense>('/fixed/expense', req).then((r) => r.data)

export const updateExpense = (expense: FixedExpense) =>
  api.put<FixedExpense>('/fixed/expense', expense).then((r) => r.data)

export const deleteExpense = (id: number) => api.delete(`/fixed/expense/${id}`)
