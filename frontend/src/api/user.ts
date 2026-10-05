import api from './api'
import type { User } from '@/types'

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users')
  return data
}

export const toggleAvailabilityApi = async (id: number): Promise<User> => {
  const { data } = await api.patch(`/users/${id}/toggle-availability`)
  return data
}

export const updatePermissionsApi = async (id: number, permissions: string[]): Promise<User> => {
  const { data } = await api.patch(`/users/${id}/permissions`, { permissions })
  return data
}
