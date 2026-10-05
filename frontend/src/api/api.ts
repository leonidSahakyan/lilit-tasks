import axios from 'axios'
import router from '@/router'
import qs from 'qs'
import { useToast, POSITION } from 'vue-toastification'

const toast = useToast()

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/',
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
})

api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const skipCheck = config.headers['skipAuthLogoutCheck']
  if (!skipCheck) {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } else {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.headers?.['skipAuthInterceptor']) return Promise.reject(error)

    const token = localStorage.getItem('accessToken')
    if (!token) return Promise.reject(new axios.Cancel('User logged out'))

    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      router.push('/login')
    }

    toast.error(error.response?.data?.message || 'Something went wrong. Please try again.', {
      icon: false,
      position: POSITION.TOP_CENTER,
      timeout: 3000,
      closeOnClick: true,
      hideProgressBar: true,
    })

    return Promise.reject(error)
  },
)

export default api
