<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 shadow-sm">
      <div class="px-6 sm:px-8 lg:px-10">
        <div class="flex items-center justify-between h-16">
          <!-- Logo (Desktop + Mobile) -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-semibold text-slate-900">
              <router-link :to="'/boards'">TaskFlow</router-link>
            </h1>
          </div>

          <!-- Desktop navigation -->
          <nav class="hidden md:flex items-center space-x-3">
            <span class="text-sm font-semibold text-slate-500 mr-6">Hello, {{ userStore.user?.fullName || 'User' }}!</span>
            <router-link :to="'/boards'" :class="linkClass('/boards')">Boards</router-link>
            <router-link :to="'/dashboard'" :class="linkClass('/dashboard')">Dashboard</router-link>
            <router-link v-if="userStore.user?.role === 'admin'" :to="'/users'" :class="linkClass('/users')">Users</router-link>
            <button @click="logout" class="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg text-sm font-medium ml-2 cursor-pointer">
              Logout
            </button>
          </nav>

          <!-- Mobile greeting (flex row) -->
          <div class="md:hidden flex-1 flex items-center justify-end space-x-3">
            <span class="text-sm font-semibold text-slate-500">Hello, {{ userStore.user?.fullName || 'User' }}!</span>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="md:hidden flex justify-between items-center px-4 pb-4">
        <div class="flex space-x-3">
          <router-link :to="'/boards'" :class="linkClass('/boards')">Boards</router-link>
          <router-link :to="'/dashboard'" :class="linkClass('/dashboard')">Dashboard</router-link>
          <router-link v-if="userStore.user?.role === 'admin'" :to="'/users'" :class="linkClass('/users')">Users</router-link>
        </div>
        <button @click="logout" class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer">Logout</button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex flex-col flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/SocketService.ts'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function logout() {
  userStore.logout()
  router.push('/')
}

function handleUserUpdate(updatedUser: any) {
  userStore.handleUserUpdated(updatedUser)
}

onMounted(() => {
  socketService.on('user.updated', handleUserUpdate)
})

onBeforeUnmount(() => {
  socketService.off('user.updated', handleUserUpdate)
})

const linkClass = (path: string) => {
  const base = 'px-3 py-2 rounded-lg text-sm font-medium'
  const active = 'bg-blue-50 text-blue-600 hover:text-blue-700'
  const inactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
  return route.path.replace(/\/$/, '') === path ? `${base} ${active}` : `${base} ${inactive}`
}
</script>
