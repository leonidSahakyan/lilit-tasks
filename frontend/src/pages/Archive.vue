<template>
  <MainLayout>
    <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-row items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-3">
            <router-link to="/dashboard" class="text-sm text-blue-600 hover:text-blue-700">← Board</router-link>
            <h2 class="text-xl font-semibold text-slate-500">Archive</h2>
            <span class="text-sm text-slate-400">{{ tasks.length }}</span>
          </div>
          <button
            v-if="doneColumn"
            @click="archiveDone"
            :disabled="busy"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            Archive all in «{{ doneColumn.name }}»
          </button>
        </div>

        <p v-if="loading" class="text-sm text-slate-400">Loading…</p>
        <p v-else-if="!tasks.length" class="text-sm text-slate-400">The archive is empty.</p>

        <ul v-else class="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          <li v-for="task in tasks" :key="task.id" class="flex items-center gap-3 px-4 py-3">
            <span class="text-xs text-slate-400 w-10 shrink-0">#{{ task.id }}</span>
            <button @click="openTask(task)" class="flex-1 min-w-0 text-left text-sm text-slate-700 hover:text-blue-700 truncate cursor-pointer">
              {{ task.title }}
            </button>
            <span class="hidden sm:inline text-xs text-slate-400 shrink-0">{{ statusName(task.statusId) }}</span>
            <span class="hidden sm:inline text-xs text-slate-400 shrink-0 w-28 truncate">{{ userName(task.assignedUserId) }}</span>
            <span class="text-xs text-slate-400 shrink-0 w-16 text-right">{{ when(task.updatedAt) }}</span>
            <button @click="restore(task)" :disabled="busy" class="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 shrink-0 cursor-pointer">
              Restore
            </button>
          </li>
        </ul>
      </div>
    </div>

    <TaskModal
      v-if="selectedTask"
      :task="selectedTask"
      :statuses="statuses"
      :users="users"
      @update-task-completed="onUpdateTaskCompleted"
      @close="selectedTask = null"
      @update="updateTask"
      @delete="deleteTask"
    />
  </MainLayout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import TaskModal from '@/components/TaskModal.vue'
import { getTasks, setTaskArchivedApi, archiveDoneApi, updateTask as updateTaskApi, deleteTask as deleteTaskApi, updateTaskCompletedApi } from '@/api/task'
import { getStatuses } from '@/api/status'
import { useUserStore } from '@/stores/userStore'
import { socketService } from '@/services/SocketService'
import type { Task, Status } from '@/types'

const userStore = useUserStore()
const users = computed(() => userStore.users)

const tasks = ref<Task[]>([])
const statuses = ref<Status[]>([])
const loading = ref(true)
const busy = ref(false)
const selectedTask = ref<Task | null>(null)

// The last column is Done.
const doneColumn = computed(() => [...statuses.value].sort((a, b) => b.position - a.position)[0])

const statusName = (id: number) => statuses.value.find((s) => s.id === id)?.name ?? ''
const userName = (id: number | null) => (id ? (users.value.find((u) => u.id === id)?.fullName ?? '') : '')
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

const load = async () => {
  try {
    tasks.value = await getTasks({ archived: 1 })
  } finally {
    loading.value = false
  }
}

const run = async (fn: () => Promise<unknown>) => {
  busy.value = true
  try {
    await fn()
    await load()
  } finally {
    busy.value = false
  }
}

const archiveDone = () => run(archiveDoneApi)
const restore = (task: Task) => run(() => setTaskArchivedApi(task.id, false))

const openTask = (task: Task) => (selectedTask.value = task)
const updateTask = (task: Task) => run(() => updateTaskApi(task))
const deleteTask = (id: number) => run(() => deleteTaskApi(id))
const onUpdateTaskCompleted = ({ taskId, completed }: { taskId: number; completed: number }) =>
  run(() => updateTaskCompletedApi(taskId, completed))

onMounted(async () => {
  await userStore.loadUsers()
  statuses.value = await getStatuses()
  await load()
  socketService.on('tasks.archived', load)
})

onBeforeUnmount(() => socketService.off('tasks.archived', load))
</script>
