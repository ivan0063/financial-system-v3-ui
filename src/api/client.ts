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
