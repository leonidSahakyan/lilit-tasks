import api from './api'
import type { Task, TaskStats, TaskFilters, CreateTaskDto } from '@/types'
import { mapTaskToUpdateDto } from '@/utils/mappers'
import { socketService } from '@/services/SocketService'

const withSocketId = (payload: any) => {
  const socketId = socketService.socket?.id
  return socketId ? { ...payload, initiatorSocketId: socketId } : payload
}

export const getTasks = async (filters: TaskFilters = {}): Promise<Task[]> => {
  const { data } = await api.get('/tasks', { params: filters })
  return data
}

export const createTask = async (task: CreateTaskDto): Promise<Task> => {
  const { data } = await api.post('/tasks', withSocketId(task))
  return data
}

export const updateTask = async (task: Task): Promise<Task> => {
  const dto = mapTaskToUpdateDto(task)
  const { data } = await api.put(`/tasks/${task.id}`, withSocketId(dto))
  return data
}

export const updateTasksPositionsBulkApi = async (tasks: { id: number; statusId?: number; position?: number }[]): Promise<Task[]> => {
  const { data } = await api.patch('/tasks/bulk-update-positions', withSocketId({ tasks }))
  return data
}

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`)
}

export const updateTaskCompletedApi = async (id: number, completed: number): Promise<void> => {
  const payload = withSocketId({ completed })
  await api.patch(`/tasks/${id}/completed`, payload)
}

export const getTaskStats = async (): Promise<TaskStats> => {
  const { data } = await api.get('/tasks/stats')
  return data
}
