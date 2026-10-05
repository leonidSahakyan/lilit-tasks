import { defineStore } from 'pinia'
import router from '@/router'
import type { UserFrontend, LoginPayload } from '@/types'
import * as AuthAPI from '@/api/auth'
import { getUsers, toggleAvailabilityApi, updatePermissionsApi } from '@/api/user'
import { socketService } from '@/services/SocketService.ts'
import type { User } from '@/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as UserFrontend | null,
    accessToken: '' as string,
    users: [] as UserFrontend[],
    allPermissions: ['see_other_tasks'],
    isLoggedIn: false,
  }),
  actions: {
    async login(payload: LoginPayload) {
      const res = await AuthAPI.login({ ...payload })
      this.accessToken = res.access_token

      const userPerms = res.user.role === 'user' ? res.user.permissions || [] : []

      this.user = {
        ...res.user,
        avatarColor: this.getAvatarColor(res.user.id),
        permissions: userPerms,
        permissionsChecked: this.allPermissions.map((p) => userPerms.includes(p)),
      }

      this.isLoggedIn = true
      socketService.connect(this.accessToken)

      localStorage.setItem('accessToken', this.accessToken)
      localStorage.setItem('user', JSON.stringify(this.user))

      return this.user.role
    },

    logout: async function () {
      try {
        await AuthAPI.logoutApi()
      } catch {
      } finally {
        socketService.disconnect()
        this.user = null
        this.accessToken = ''
        this.isLoggedIn = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        router.push('/login')
      }
    },

    loadFromStorage() {
      const token = localStorage.getItem('accessToken')
      const user = localStorage.getItem('user')
      if (token && user) {
        this.accessToken = token
        this.user = JSON.parse(user)
        socketService.connect(this.accessToken)
      }
    },

    async loadUsers(): Promise<UserFrontend[]> {
      if (this.users.length) return this.users

      const backendUsers = await getUsers()
      this.users = backendUsers.map((user) => this.formatUser(user))
      return this.users
    },

    async toggleAvailability(user: UserFrontend) {
      const updated: User = await toggleAvailabilityApi(user.id)
      this.updateUserLocal(updated)
    },

    async updatePermissions(user: UserFrontend) {
      if (user.role !== 'user' || !user.permissions) return
      const updated = await updatePermissionsApi(user.id, user.permissions)
      this.updateUserLocal(updated)
    },

    handleUserUpdated(updatedUser: User) {
      this.updateUserLocal(updatedUser)
    },

    updateUserLocal(user: User) {
      const formatted = this.formatUser(user)
      this.users = this.users.map((u) => (u.id === formatted.id ? formatted : u))

      if (this.user?.id === formatted.id) {
        this.user = {
          ...this.user,
          ...formatted,
        }
      }
    },

    formatUser(user: User): UserFrontend {
      const perms = user.role === 'user' ? [...(user.permissions || [])] : undefined
      return {
        ...user,
        avatarColor: this.getAvatarColor(user.id),
        permissions: perms,
        permissionsChecked: user.role === 'user' ? this.allPermissions.map((p) => perms!.includes(p)) : [],
      }
    },

    getAvatarColor(id: number) {
      const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-slate-100 text-slate-700']
      return colors[id % colors.length]
    },
  },
})
