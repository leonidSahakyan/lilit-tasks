export interface User {
  id: number
  username: string
  fullName: string
  role: 'admin' | 'user'
  available: boolean
  createdAt: string
  updatedAt: string
  lastSeen: string
  permissions?: string[]
}

export interface UserFrontend extends User {
  avatarColor: string
  permissionsChecked: boolean[]
}
