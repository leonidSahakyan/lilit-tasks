<template>
  <div class="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg border border-slate-300 w-full max-w-2xl max-h-[90vh] overflow-y-auto" ref="modalRef">
      <div class="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-900">Edit Task</h2>
        <button @click="close" class="text-slate-400 hover:text-slate-900 cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="save" class="p-6 space-y-6">
        <div class="mb-4">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-900 cursor-pointer">
            <div
              class="relative w-5 h-5 border-2 border-slate-400 rounded-full flex items-center justify-center"
              :class="{ 'bg-green-500 border-green-500': completed }"
              @click.stop="completed = completed ? 0 : 1"
            >
              <input type="checkbox" class="absolute w-full h-full opacity-0 cursor-pointer" :checked="!!completed" />
              <svg v-if="completed" class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            Complete Task
          </label>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-900 mb-2">Task Title *</label>
          <input
            type="text"
            v-model="taskData.title"
            class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-900 mb-2">Description</label>
          <textarea
            v-model="taskData.description"
            rows="4"
            class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">Status *</label>
            <select
              v-model="taskData.statusId"
              class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              required
            >
              <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">Assigned To</label>
            <select
              v-model="assignedUser"
              class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <option :value="null">- Unassigned -</option>
              <option v-for="user in users" :key="user.id" :value="user" :disabled="!user.available">
                {{ user.fullName }} {{ !user.available ? ' (Unavailable)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-900 mb-2">Due Date</label>
          <input
            type="date"
            v-model="taskData.dueDate"
            class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        </div>

        <div class="flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            type="button"
            @click="deleteTask"
            class="text-red-500 hover:text-red-600 px-4 py-2 sm:px-6 sm:py-3 rounded-md border border-red-200 hover:bg-red-50 cursor-pointer"
          >
            Delete
          </button>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 sm:px-6 sm:py-3 border border-slate-300 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import type { Status, Task, User } from '@/types'

const props = defineProps<{ task: Task; statuses: Status[]; users: User[] }>()

const emit = defineEmits<{
  (e: 'update', updatedTask: Task): void
  (e: 'close'): void
  (e: 'delete', taskId: number): void
  (e: 'update-task-completed', payload: { taskId: number; completed: number }): void
}>()

const taskData = reactive({
  id: 0,
  title: '',
  description: '',
  statusId: 0,
  assignedUserId: null as number | null,
  dueDate: '',
  position: 0,
  completed: 0,
})

const completed = computed({
  get: () => taskData.completed,
  set(val: number) {
    taskData.completed = val
    emit('update-task-completed', { taskId: props.task.id, completed: val })
  },
})

// const toggleComplete = () => {
//   completed.value = completed.value ? 0 : 1
//   emit('update-task-completed', { taskId: props.task.id, completed: completed.value })
// }

const assignedUser = computed<User | null>({
  get() {
    return taskData.assignedUserId != null ? (props.users.find((u) => u.id === taskData.assignedUserId) ?? null) : null
  },
  set(user: User | null) {
    taskData.assignedUserId = user?.id ?? null
  },
})

watch(
  () => props.task,
  (t) => {
    if (t) {
      Object.assign(taskData, {
        id: t.id,
        title: t.title,
        description: t.description,
        statusId: t.statusId,
        assignedUserId: t.assignedUserId ?? null,
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
        position: t.position,
        completed: t.completed,
      })
    }
  },
  { immediate: true },
)

const saving = ref(false)

const save = () => {
  if (saving.value) return
  saving.value = true

  const payload: Task = {
    id: taskData.id,
    title: taskData.title,
    description: taskData.description,
    statusId: taskData.statusId,
    assignedUserId: taskData.assignedUserId ?? null,
    dueDate: taskData.dueDate || '',
    createdAt: props.task?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    position: taskData.position,
    completed: taskData.completed,
  }

  emit('update', payload)
  saving.value = false
  close()
}

const close = () => emit('close')
const deleteTask = () => {
  emit('delete', taskData.id)
  close()
}

const modalRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (e.button !== 0) return
  if (modalRef.value && !modalRef.value.contains(e.target as Node)) {
    close()
  }
}
const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('keydown', handleEsc)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('keydown', handleEsc)
})
</script>
