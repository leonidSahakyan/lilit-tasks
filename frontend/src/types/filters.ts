export interface MembersFilters {
  noMembers: boolean
  assignedToMe: boolean
}

export interface StatusFilters {
  complete: boolean
  incomplete: boolean
}

export interface DueFilters {
  start: string
  end: string
  date: string
  noDate: boolean
  overdue: boolean
  nextDay: boolean
  nextWeek: boolean
  nextMonth: boolean
}

export interface ActivityFilters {
  lastWeek: boolean
  lastTwoWeeks: boolean
  lastFourWeeks: boolean
  noActivity: boolean
}

export interface Filters {
  members: MembersFilters
  status: StatusFilters
  due: DueFilters
  activity: ActivityFilters
  keyword: string
  selectedUserIds: number[]
}

export interface TaskFilters {
  assignedUserIds?: number[]
  completed?: 0 | 1
  dueDate?: string
  activity?: 'lastWeek' | 'lastTwoWeeks' | 'lastFourWeeks' | 'noActivity'
  keyword?: string
  startDate?: string
  endDate?: string
}
