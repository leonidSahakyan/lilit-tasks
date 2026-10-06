import api from './api'

export interface CommentItem {
  kind: 'comment'
  id: number
  createdAt: string
  author: string | null
  authorId: number | null
  commentKind: 'comment' | 'question' | 'answer' | 'report'
  source: 'board' | 'agent' | 'telegram' | 'chat'
  body: string
}

export interface EventItem {
  kind: 'event'
  id: number
  createdAt: string
  actor: string | null
  actorId: number | null
  type: string
  data: Record<string, any> | null
}

export type ActivityItem = CommentItem | EventItem

export const getActivity = async (taskId: number): Promise<ActivityItem[]> => (await api.get(`/tasks/${taskId}/activity`)).data

export const addComment = async (taskId: number, body: string): Promise<CommentItem> =>
  (await api.post(`/tasks/${taskId}/comments`, { body, source: 'board' })).data

export const reopenTask = async (taskId: number, comment: string) => (await api.post(`/tasks/${taskId}/reopen`, { comment })).data
