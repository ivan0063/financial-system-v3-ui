import { api } from './client'
import type { FinancialProvider, FinancialProviderCatalog, CreateFinancialProviderReq } from '../types'

export const getProviderCatalogs = () =>
  api.get<FinancialProviderCatalog[]>('/financial/provider/catalog/all').then((r) => r.data)

export const createProviderCatalog = (name: string) =>
  api.post<FinancialProviderCatalog>('/financial/provider/catalog', { name }).then((r) => r.data)

export const updateProviderCatalog = (catalog: FinancialProviderCatalog) =>
  api.put<FinancialProviderCatalog>('/financial/provider/catalog', catalog).then((r) => r.data)

export const deleteProviderCatalog = (id: number) => api.delete(`/financial/provider/catalog/${id}`)

export const getProvidersByUser = (email: string) =>
  api.get<FinancialProvider[]>(`/financial/provider/all/${encodeURIComponent(email)}`).then((r) => r.data)

export const createProvider = (req: CreateFinancialProviderReq) =>
  api.post<FinancialProvider>('/financial/provider', req).then((r) => r.data)

export const updateProvider = (provider: FinancialProvider) =>
  api.put<FinancialProvider>('/financial/provider', provider).then((r) => r.data)

export const deleteProvider = (code: string) => api.delete(`/financial/provider/${code}`)
