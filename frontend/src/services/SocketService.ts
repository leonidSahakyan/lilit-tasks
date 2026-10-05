import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'

import type { Task, TaskStats } from '@/types'
import { showAssignedToast } from '../utils/utils'
import { useUserStore } from '@/stores/userStore'

class SocketService {
  socket: Socket | null = null

  tasks = ref<Task[]>([])
  stats = ref<TaskStats>({
    total: 0,
    statuses: [],
    lastUpdated: null,
    totalCompleted: 0,
    totalOverdue: 0,
  })

  connect(token: string) {
    this.socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    })
    this.registerEvents()
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data)
  }

  on(event: string, cb: (data: any) => void) {
    this.socket?.on(event, cb)
  }

  off(event: string, cb?: (data: any) => void) {
    this.socket?.off(event, cb)
  }

  private registerEvents() {
    if (!this.socket) return

    const userStore = useUserStore()

    this.socket.on('user.updated', (updatedUser) => {
      if (userStore.user?.id === updatedUser.id) {
        userStore.user = { ...userStore.user, ...updatedUser }
        localStorage.setItem('user', JSON.stringify(userStore.user))
      }

      userStore.users = userStore.users.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    })

    this.socket.on('task.unassigned', ({ task, userFullName }) => {
      showAssignedToast('Task unassigned', `"${task.title}" unassigned from ${userFullName}`, task.id)
    })

    this.socket.on('task.assigned', ({ task, userFullName }) => {
      showAssignedToast('Task assigned', `"${task.title}" assigned to ${userFullName}`, task.id)
    })

    this.socket.on('task.removed', ({ taskTitle, userFullName }) => {
      showAssignedToast('Task removed', `"${taskTitle}" assigned to ${userFullName} has been removed`)
    })

    this.socket.on('task.completed', ({ task, userFullName }) => {
      showAssignedToast('Task completed', `"${task.title}" assigned to ${userFullName} has been marked completed`, task.id)
    })

    this.socket.on('task.uncompleted', ({ task, userFullName }) => {
      showAssignedToast('Task uncompleted', `"${task.title}" assigned to ${userFullName} has been marked uncompleted`, task.id)
    })

    this.socket.on('tasks.statsUpdated', (data: TaskStats) => {
      this.stats.value = data
    })
  }
}

export const socketService = new SocketService()
