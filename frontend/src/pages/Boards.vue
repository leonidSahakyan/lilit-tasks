<template>
  <MainLayout>
    <div class="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-2">
          <div>
            <h2 class="text-3xl font-semibold text-slate-900 mb-1">{{ board.title }}</h2>
            <p class="text-sm text-slate-500">{{ board.description }}</p>
          </div>
          <button disabled class="px-3 py-2 bg-slate-100 text-slate-400 border border-slate-300 rounded-md cursor-not-allowed">
            Create New Board
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            class="bg-white rounded-lg p-6 shadow cursor-pointer border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-colors duration-200"
            @click="$router.push('/dashboard')"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="font-semibold text-slate-900 mb-1">{{ board.title }}</h3>
                <p class="text-sm text-slate-500">{{ board.description }}</p>
              </div>
              <span class="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">Active</span>
            </div>
            <div class="space-y-2 mb-4">
              <div v-for="status in statuses" :key="status.id" class="flex items-center justify-between text-sm">
                <span class="text-slate-500">{{ status.name }}</span>
                <span class="font-medium text-slate-900">{{ status.count }}</span>
              </div>

              <div class="flex items-center justify-between text-sm border-slate-200 pt-3">
                <span class="text-blue-600 font-medium">Total</span>
                <span class="font-medium text-slate-900">{{ totalTasks }}</span>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-green-600">Completed</span>
                <span class="font-medium text-green-600">{{ totalCompleted }}</span>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-red-600">Overdue</span>
                <span class="font-medium text-red-600">{{ totalOverdue }}</span>
              </div>
            </div>

            <div class="border-t border-slate-200 pt-3">
              <span class="text-xs text-slate-400">Updated {{ timeAgo(lastUpdated) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div v-for="stat in quickStats" :key="stat.label" class="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-sm">
            <div :class="['text-2xl font-bold', stat.color]">{{ stat.value }}</div>
            <div class="text-sm text-slate-500">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import MainLayout from '@/layouts/MainLayout.vue'
import { getTaskStats } from '@/api/task'
import { socketService } from '@/services/SocketService'
import type { TaskStats } from '@/types'

dayjs.extend(relativeTime)

const board = {
  title: 'Project Management',
  description: 'Organize your work across different boards',
}

const statuses = ref<{ id: number; name: string; count: number }[]>([])
const totalTasks = ref(0)
const totalCompleted = ref(0)
const totalOverdue = ref(0)
const lastUpdated = ref<string | null>(null)

const quickStats = computed(() => [
  { label: 'Total Boards', value: 1, color: 'text-foreground' },
  { label: 'Total Tasks', value: totalTasks.value, color: 'text-foreground' },
  { label: 'Completed', value: totalCompleted.value, color: 'text-green-600' },
  { label: 'Overdue', value: totalOverdue.value, color: 'text-red-600' },
])

const updateStats = (data: TaskStats) => {
  totalTasks.value = data.total
  statuses.value = data.statuses ?? []
  lastUpdated.value = data.lastUpdated
  totalCompleted.value = data.totalCompleted
  totalOverdue.value = data.totalOverdue
}

const fetchStats = async () => {
  try {
    const data: TaskStats = await getTaskStats()
    updateStats(data)
    socketService.stats.value = data
  } catch (err) {
    console.error('Failed to fetch stats', err)
  }
}

const onStatsUpdated = (data: TaskStats) => updateStats(data)

const timeAgo = (date?: string | null) => (date ? dayjs(date).fromNow() : '')

const tick = ref(0)

onMounted(() => {
  fetchStats()
  socketService.on('tasks.statsUpdated', onStatsUpdated)

  const timer = setInterval(() => {
    tick.value++
  }, 60 * 1000)

  onBeforeUnmount(() => clearInterval(timer))
})

onBeforeUnmount(() => {
  socketService.off('tasks.statsUpdated', onStatsUpdated)
})
</script>
