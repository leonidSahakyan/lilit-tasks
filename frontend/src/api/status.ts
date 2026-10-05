import api from './api'

import type { Status } from '@/types'
import { socketService } from '@/services/SocketService'

const withSocketId = (payload: any) => {
  const socketId = socketService.socket?.id
  return socketId ? { ...payload, initiatorSocketId: socketId } : payload
}

export const getStatuses = async (): Promise<Status[]> => {
  const { data } = await api.get('/statuses')
  return data
}

export const deleteStatus = async (id: number): Promise<void> => {
  await api.delete(`/statuses/${id}`)
}

export const createStatus = async (name: string): Promise<Status> => {
  const payload = withSocketId({ name })
  const { data } = await api.post('/statuses', payload)
  return data
}

export const saveColumnOrder = async (order: number[]): Promise<void> => {
  const payload = withSocketId({ order })
  await api.post('/statuses/order', payload)
}

export const updateStatusTitle = async (id: number, name: string): Promise<Status> => {
  const payload = withSocketId({ name })
  const { data } = await api.patch(`/statuses/${id}`, payload)
  return data
}
