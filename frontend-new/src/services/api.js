import axios from 'axios'

const DEFAULT_PROD_API_ORIGIN = 'https://job-analytics-api.onrender.com'

const normalizeApiBase = (value) => {
  if (!value) return ''

  const trimmed = String(value).trim().replace(/\/+$/, '')
  const withoutApiSuffix = trimmed.replace(/\/api$/i, '')
  return `${withoutApiSuffix}/api`
}

// Determine base URL based on environment
const getBaseURL = () => {
  const configuredBase = process.env.VUE_APP_API_URL || process.env.VITE_API_URL

  // Production: use environment variable
  if (process.env.NODE_ENV === 'production') {
    const normalizedConfiguredBase = normalizeApiBase(configuredBase)
    if (normalizedConfiguredBase) return normalizedConfiguredBase

    // Netlify fallback to known Render backend if env var is missing.
    return normalizeApiBase(DEFAULT_PROD_API_ORIGIN)
  }

  // Development: use proxy
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Increased for Render cold starts
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: false // Set to true if using cookies
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
