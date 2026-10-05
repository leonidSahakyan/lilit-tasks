import { nextTick } from 'vue'
import type { Ref } from 'vue'
import { createTask, updateTask as updateTaskApi, deleteTask as deleteTaskApi, updateTaskCompletedApi, updateTasksPositionsBulkApi } from '@/api/task'
import type { Column, Task } from '@/types'
import { highlight } from '@/utils/utils'

export class TaskService {
  constructor(private columns: Ref<Column[]>) {}

  // --- Public Methods ---

  async addTask(title: string, columnId: number): Promise<Task> {
    const newTask = await createTask({ title, statusId: columnId })
    this.applyAdd(newTask)
    return newTask
  }

  async updateTask(updatedTask: Task): Promise<Task> {
    await updateTaskApi(updatedTask)
    this.applyEdit(updatedTask)
    return updatedTask
  }

  async deleteTask(taskId: number) {
    await deleteTaskApi(taskId)
    this.applyRemove(taskId)
  }

  async updateTaskCompleted(taskId: number, completed: number): Promise<Task> {
    await updateTaskCompletedApi(taskId, completed)
    const task = this.columns.value.flatMap((c) => c.tasks).find((t) => t.id === taskId)
    if (!task) throw new Error(`Task with id ${taskId} not found`)
    task.completed = completed
    return task
  }

  async moveTask(task: Task, newStatusId: number, newPosition: number) {
    const oldColumn = this.columns.value.find((c) => c.tasks.some((t) => t.id === task.id))
    const newColumn = this.columns.value.find((c) => c.id === newStatusId)
    if (!oldColumn || !newColumn) return

    oldColumn.tasks = oldColumn.tasks.filter((t) => t.id !== task.id)

    newColumn.tasks.splice(newPosition - 1, 0, task)

    newColumn.tasks.forEach((t, idx) => (t.position = idx + 1))

    const updates = newColumn.tasks.map((t) => ({
      id: t.id,
      statusId: newStatusId,
      position: t.position,
    }))

    await updateTasksPositionsBulkApi(updates)

    if (oldColumn.id !== newColumn.id) task.statusId = newStatusId

    this.applyMove(task, newStatusId, newPosition)
  }

  // --- Private UI update methods ---

  private async applyAdd(task: Task, animate: boolean = false) {
    const column = this.columns.value.find((c) => c.id === task.statusId)
    if (column) column.tasks.push(task)

    if (!animate) return
    await nextTick()
    const el = document.getElementById(`task-${task.id}`)
    if (el) highlight(el)
  }

  private applyEdit(task: Task, animate: boolean = false) {
    const oldColumn = this.columns.value.find((c) => c.tasks.some((t) => t.id === task.id))
    const newColumn = this.columns.value.find((c) => c.id === task.statusId)
    if (!oldColumn || !newColumn) return

    if (oldColumn.id === newColumn.id) {
      const idx = oldColumn.tasks.findIndex((t) => t.id === task.id)
      if (idx !== -1) oldColumn.tasks.splice(idx, 1, { ...oldColumn.tasks[idx], ...task })

      if (animate) {
        const el = document.getElementById(`task-${task.id}`)
        if (el) highlight(el)
      }
    } else {
      oldColumn.tasks = oldColumn.tasks.filter((t) => t.id !== task.id)
      newColumn.tasks.push(task)

      if (animate) {
        nextTick(() => {
          const el = document.getElementById(`task-${task.id}`)
          if (el) highlight(el)
        })
      }
    }
  }

  private async applyRemove(taskId: number, animate: boolean = false) {
    if (animate) {
      const el = document.getElementById(`task-${taskId}`)
      if (el) {
        await new Promise<void>((resolve) => {
          highlight(el)
          setTimeout(() => resolve(), 800)
        })
      }
    }

    this.columns.value.forEach((col) => {
      col.tasks = col.tasks.filter((t) => t.id !== taskId)
    })
  }

  private applyMove(task: Task, newStatusId?: number, newPosition?: number, animate: boolean = false) {
    const oldColumn = this.columns.value.find((c) => c.tasks.some((t) => t.id === task.id))
    const targetStatusId = newStatusId ?? task.statusId
    const newColumn = this.columns.value.find((c) => c.id === targetStatusId)
    if (!oldColumn || !newColumn) return

    oldColumn.tasks = oldColumn.tasks.filter((t) => t.id !== task.id)

    if (newPosition !== undefined) {
      newColumn.tasks.splice(newPosition - 1, 0, task)
    } else if (!newColumn.tasks.some((t) => t.id === task.id)) {
      newColumn.tasks.push(task)
    }

    newColumn.tasks.forEach((t, idx) => (t.position = idx + 1))

    task.statusId = targetStatusId
  }

  private applyMoveBatch(tasks: Task[]) {
    tasks.forEach((task) => this.applyMoveSocket(task, task.position))
  }
  private applyMoveSocket(task: Task, newPosition?: number) {
    const oldColumn = this.columns.value.find((c) => c.tasks.some((t) => t.id === task.id))
    const newColumn = this.columns.value.find((c) => c.id === task.statusId)
    if (!oldColumn || !newColumn) return

    const oldPosition = oldColumn.tasks.findIndex((t) => t.id === task.id)
    oldColumn.tasks.splice(oldPosition, 1)

    const targetPos = newPosition !== undefined ? newPosition - 1 : newColumn.tasks.length
    newColumn.tasks.splice(targetPos, 0, task)

    newColumn.tasks.forEach((t, idx) => (t.position = idx + 1))
    if (oldColumn.id !== newColumn.id || oldPosition !== targetPos) {
      nextTick(() => {
        const el = document.getElementById(`task-${task.id}`)
        if (el) highlight(el)
      })
    }
  }

  public handleSocketEvent(event: 'created' | 'updated' | 'deleted' | 'reordered', payload: any) {
    switch (event) {
      case 'created':
        this.applyAdd(payload, true)
        break
      case 'updated':
        this.applyEdit(payload, true)
        break
      case 'deleted':
        this.applyRemove(payload, true)
        break
      case 'reordered':
        if (Array.isArray(payload)) {
          this.applyMoveBatch(payload)
        } else {
          this.applyMoveBatch([payload])
        }
        // payload.forEach((task: Task) => this.applyMove(task)) // Without animatoin
        break
    }
  }
}
