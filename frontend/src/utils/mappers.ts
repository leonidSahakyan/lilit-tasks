import type { Task, UpdateTaskDto, Filters, TaskFilters } from '@/types'

export function mapTaskToUpdateDto(task: Task): UpdateTaskDto {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    assignedUserId: task.assignedUserId,
    statusId: task.statusId,
    position: (task as any).position,
  }
}

export function mapFiltersToApi(filters: Filters): Partial<TaskFilters> {
  const result: Partial<TaskFilters> = {}

  const assignedIds: number[] = [...filters.selectedUserIds]
  if (filters.members.assignedToMe) assignedIds.push(-1)
  if (filters.members.noMembers) assignedIds.push(0)
  if (assignedIds.length) {
    result.assignedUserIds = assignedIds
  }

  if (filters.status.complete) result.completed = 1
  else if (filters.status.incomplete) result.completed = 0

  if (filters.due.start) result.startDate = filters.due.start
  if (filters.due.end) result.endDate = filters.due.end
  if (!filters.due.start && !filters.due.end) {
    if (filters.due.noDate) result.dueDate = 'none'
    else if (filters.due.overdue) result.dueDate = 'overdue'
    else if (filters.due.nextDay) result.dueDate = 'nextDay'
    else if (filters.due.nextWeek) result.dueDate = 'nextWeek'
    else if (filters.due.nextMonth) result.dueDate = 'nextMonth'
  }

  const activeActivity = Object.entries(filters.activity).find(([_, v]) => v)?.[0]
  if (activeActivity) result.activity = activeActivity as TaskFilters['activity']

  if (filters.keyword) result.keyword = filters.keyword

  return result
}
