import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskmanager_token')
  // Debugging: log whether token is present and that we're attaching headers
  try {
    // mask token for logs
    const masked = token ? `${token.substring(0, 6)}...${token.substring(token.length - 6)}` : null
    // eslint-disable-next-line no-console
    console.debug('[api] attaching token:', masked)
  } catch (e) {
    // ignore logging errors
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[api] response error:', err && err.response ? err.response.status : err.message)
    return Promise.reject(err)
  }
)

export default api
