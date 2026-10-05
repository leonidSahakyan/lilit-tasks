import { ref, nextTick } from 'vue'
import type { Ref } from 'vue'
import { getStatuses, saveColumnOrder, createStatus, updateStatusTitle, deleteStatus } from '@/api/status'
import { getTasks } from '@/api/task'
import type { Column, Task, TaskFilters } from '@/types'
import { highlight } from '@/utils/utils'

export class ColumnService {
  columns: Ref<Column[]> = ref([])

  loadColumns = async () => {
    const statuses = await getStatuses()
    this.columns.value = statuses.sort((a, b) => a.position - b.position).map((s) => ({ id: s.id, title: s.name, tasks: [], disabled: false }))
    return this.columns.value
  }

  loadTasks = async (filters: TaskFilters = {}) => {
    const tasks: Task[] = await getTasks(filters)
    tasks.forEach((task) => {
      const col = this.columns.value.find((c) => c.id === task.statusId)
      if (col) col.tasks.push(task)
    })
    return tasks
  }

  async addColumn(title: string): Promise<void> {
    const newStatus = await createStatus(title)
    this.applyAddColumn(newStatus)
  }

  async updateColumn(columnId: number, title: string) {
    const updated = await updateStatusTitle(columnId, title)
    this.applyEditColumn(updated)
  }

  async deleteColumn(columnId: number) {
    await deleteStatus(columnId)
    this.applyRemoveColumn(columnId)
  }

  async reorderColumns() {
    const order = this.columns.value.map((c) => c.id)
    await saveColumnOrder(order)
    this.applyReorderColumns(order)
  }

  private async applyAddColumn(status: { id: number; name: string; position: number }, animate: boolean = false) {
    const column: Column = {
      id: status.id,
      title: status.name,
      tasks: [],
      disabled: false,
      position: status.position,
    }
    this.columns.value.push(column)

    if (!animate) return
    await nextTick()
    const el = document.getElementById(`column-${status.id}`)
    if (el) highlight(el)
  }

  private applyEditColumn(payload: { id: number; name: string }, animate: boolean = false) {
    const col = this.columns.value.find((c) => c.id === payload.id)
    if (!col) return

    col.title = payload.name

    if (!animate) return
    const el = document.getElementById(`column-${col.id}`)
    if (el) highlight(el)
  }

  private async applyRemoveColumn(columnId: number, animate: boolean = false) {
    if (animate) {
      const el = document.getElementById(`column-${columnId}`)
      if (el) {
        await new Promise<void>((resolve) => {
          highlight(el)
          setTimeout(() => resolve(), 800)
        })
      }
    }

    this.columns.value = this.columns.value.filter((c) => c.id !== columnId)
  }

  private async applyReorderColumns(order: number[], animate: boolean = false) {
    const oldPositions = new Map<number, number>()
    this.columns.value.forEach((c, index) => oldPositions.set(c.id, index))

    this.columns.value.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

    if (!animate) return

    await nextTick()
    this.columns.value.forEach((col, newIndex) => {
      const oldIndex = oldPositions.get(col.id)
      if (oldIndex !== undefined && oldIndex !== newIndex) {
        const el = document.getElementById(`column-${col.id}`)
        if (el) highlight(el)
      }
    })
  }
  // private async applyReorderColumns(order: number[], animate: boolean = false) {
  //   this.columns.value.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

  //   if (animate) {
  //     await nextTick()
  //     for (const col of this.columns.value) {
  //       const el = document.getElementById(`column-${col.id}`)
  //       if (el) highlight(el)
  //     }
  //   }
  // }

  public handleSocketEvent(event: 'created' | 'updated' | 'deleted' | 'reordered', payload: any) {
    switch (event) {
      case 'created':
        this.applyAddColumn(payload, true)
        break
      case 'updated':
        this.applyEditColumn(payload, true)
        break
      case 'deleted':
        this.applyRemoveColumn(payload.id, true)
        break
      case 'reordered':
        this.applyReorderColumns(payload, true)
        break
    }
  }
}
