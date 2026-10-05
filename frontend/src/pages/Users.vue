<template>
  <MainLayout>
    <div class="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-6xl mx-auto">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 mb-2">User Management</h2>
            <p class="text-slate-600">Manage user availability, permissions, and access levels</p>
          </div>

          <button disabled class="px-3 py-2 bg-slate-100 text-slate-400 border border-slate-300 rounded-md cursor-not-allowed">Add User</button>
        </div>

        <!-- Users Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div
            v-for="user in userStore.users"
            :key="user.id"
            class="flex flex-col bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div :class="['w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg', user.avatarColor]">
                  {{ user.fullName.charAt(0) }}
                </div>
                <div class="ml-3">
                  <h3 class="font-semibold text-slate-900">{{ user.fullName }}</h3>
                  <p class="text-sm text-slate-500">{{ user.role }}</p>
                </div>
              </div>
              <div class="flex items-center">
                <span class="w-3 h-3 rounded-full" :class="user.available ? 'bg-emerald-500' : 'bg-red-500'"></span>
              </div>
            </div>

            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium text-slate-700">Availability</span>
              <div class="flex items-center">
                <span class="text-sm mr-3 font-medium" :class="user.available ? 'text-emerald-600' : 'text-slate-500'">
                  {{ user.available ? 'Available' : 'Unavailable' }}
                </span>

                <label class="toggle-switch">
                  <input type="checkbox" v-model="user.available" @change="userStore.toggleAvailability(user)" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <div v-if="user.role === 'admin'" class="mb-4">
              <h4>Permissions</h4>
              <div v-for="perm in ['Full access', 'User management', 'Board management']" :key="perm" class="flex items-center">
                <input type="checkbox" checked disabled />
                <span class="ml-2">{{ perm }}</span>
              </div>
            </div>

            <!-- Permissions -->
            <div v-if="user.role === 'user'" class="mb-4">
              <h4>Permissions</h4>
              <div v-for="permKey in ['see_other_tasks']" :key="permKey" class="flex items-center">
                <input
                  type="checkbox"
                  :value="permKey"
                  v-model="user.permissions"
                  @change="userStore.updatePermissions(user)"
                  :id="`perm-${user.id}-${permKey}`"
                />
                <label :for="`perm-${user.id}-${permKey}`" class="ml-2 cursor-pointer">
                  {{ permKey === 'see_other_tasks' ? 'See other tasks' : permKey }}
                </label>
              </div>
            </div>

            <!-- Spacer pushes Last Active to bottom -->
            <div class="flex-grow"></div>

            <div class="pt-4 border-t border-slate-200 text-sm flex items-center justify-between">
              <span class="text-slate-500">Last active</span>
              <span class="text-slate-700 font-medium">{{ timeAgo(user.lastSeen) }}</span>
            </div>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div class="text-3xl font-bold text-slate-900 mb-1">{{ userStore.users.length }}</div>
            <div class="text-sm text-slate-500">Total Users</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div class="text-3xl font-bold text-emerald-600 mb-1">{{ availableUsers }}</div>
            <div class="text-sm text-slate-500">Available</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div class="text-3xl font-bold text-red-600 mb-1">{{ unavailableUsers }}</div>
            <div class="text-sm text-slate-500">Unavailable</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div class="text-3xl font-bold text-blue-600 mb-1">{{ activeToday }}</div>
            <div class="text-sm text-slate-500">Active Today</div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

import MainLayout from '@/layouts/MainLayout.vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const availableUsers = computed(() => userStore.users.filter((u) => u.available).length)
const unavailableUsers = computed(() => userStore.users.filter((u) => !u.available).length)
const activeToday = computed(
  () =>
    userStore.users.filter((u) => {
      if (!u.lastSeen) return false
      const updatedDate = dayjs(u.lastSeen)
      return updatedDate.isSame(dayjs(), 'day')
    }).length,
)

const timeAgo = (date?: string | null) => {
  return date ? dayjs(date).fromNow() : ''
}

onMounted(async () => {
  await userStore.loadUsers()
})
</script>
