import api from './api'
import type { LoginPayload, LoginResponse } from '@/types'

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post(
    '/auth/login',
    { ...payload },
    {
      headers: { skipAuthInterceptor: true },
    },
  )
  return data
}

export const logoutApi = async () => {
  return api.post('/auth/logout', null, {
    headers: {
      skipAuthLogoutCheck: true,
    },
  })
}
