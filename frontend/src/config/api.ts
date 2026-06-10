import axios from 'axios'

const defaultApiBaseUrl = '/api'

export const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? defaultApiBaseUrl
).replace(/\/$/, '')

export function configureAxiosBaseUrl() {
  axios.defaults.baseURL = apiBaseUrl
  axios.defaults.withCredentials = true
}
