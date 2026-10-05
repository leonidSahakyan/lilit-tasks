// import type { User } from './user'
// import type { Status } from './status'

export interface Task {
  id: number
  title: string
  description: string
  dueDate: string
  assignedUserId: number | null
  statusId: number
  createdAt: string
  updatedAt: string
  position: number
  completed: number
}

export interface Column {
  id: number
  title: string
  tasks: Task[]
  position?: number
  disabled?: boolean
}

export interface TaskStats {
  total: number
  statuses: [] | null
  totalCompleted: number
  totalOverdue: number
  lastUpdated: string | null
}

export interface CreateTaskDto {
  title: string
  statusId: number
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  dueDate?: string
  assignedUserId?: number | null
  statusId: number
  position?: number
}

export interface TaskPositionUpdate {
  id: number
  statusId?: number
  position?: number
}
