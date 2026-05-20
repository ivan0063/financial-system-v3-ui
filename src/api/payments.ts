import { api } from './client'
import type { Payment } from '../types'

export const getPayments = (accountCode: string) =>
  api.get<Payment[]>(`/payment/${accountCode}`).then((r) => r.data)

export const getLatestPayment = (accountCode: string) =>
  api.get<Payment>(`/payment/latest/${accountCode}`).then((r) => r.data)

export const doPayment = (accountCode: string) =>
  api.get<Payment>(`/payment/do/${accountCode}`).then((r) => r.data)
