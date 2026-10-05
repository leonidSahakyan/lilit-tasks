<template>
  <div
    class="task-card group relative bg-white border border-slate-300 rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow min-h-[40px]"
    @click="$emit('click')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="relative task-drag-handle">
      <!-- Checkbox -->
      <div
        class="absolute top-0 left-0 w-5 h-5 border-2 border-slate-400 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out"
        :class="{
          'opacity-100 bg-green-500 border-green-500': completed,
          'opacity-100': isCheckboxVisible && !completed,
          'opacity-0': !isCheckboxVisible && !completed,
        }"
      >
        <input type="checkbox" class="absolute w-5 h-5 opacity-0 cursor-pointer z-10" :checked="!!completed" @click.stop="toggleComplete" />
        <svg
          class="w-3 h-3 text-white transition-opacity duration-300"
          :class="{ 'opacity-100': completed, 'opacity-0': !completed }"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div class="transition-all duration-300 ease-in-out mt-1" :style="{ marginLeft: textMarginLeft }">
        <h4 class="font-medium text-slate-900 text-sm break-words">
          {{ task.title }}
        </h4>
      </div>
    </div>

    <span v-if="task.dueDate" :class="['text-[10px] px-1 rounded mt-1 inline-block text-slate-500', isOverdue ? 'bg-red-200' : 'bg-slate-200']">
      {{ formattedDueDate }}
    </span>
    <div
      v-if="assignedUser"
      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold absolute bottom-2 right-2"
      :class="assignedUser.avatarColor"
      :title="assignedUser.fullName"
    >
      {{ assigneeInitial }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Task, UserFrontend } from '@/types'

const props = defineProps<{
  task: Task
  users: UserFrontend[]
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'toggle-complete', taskId: number, completed: number): void
}>()

const completed = ref(props.task.completed ?? 0)

watch(
  () => props.task.completed,
  (val) => {
    completed.value = val ?? 0
  },
)

const toggleComplete = async () => {
  completed.value = completed.value ? 0 : 1
  emit('toggle-complete', props.task.id, completed.value)
}

const screenWidth = ref(window.innerWidth)

const updateWidth = () => {
  screenWidth.value = window.innerWidth
}

const isCheckboxVisible = computed(() => {
  if (completed.value) return true
  if (screenWidth.value < 640) return true
  return isHovered.value
})

const textMarginLeft = computed(() => {
  if (screenWidth.value >= 640) {
    return completed.value || isHovered.value ? '28px' : '0px'
  }
  return '28px'
})
const assignedUser = computed<UserFrontend | null>(() => {
  if (!props.task.assignedUserId) return null
  return props.users.find((u) => u.id === props.task.assignedUserId) ?? null
})

const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  const date = new Date(props.task.dueDate)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}`
})

const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  return new Date(props.task.dueDate) < new Date()
})

const assigneeInitial = computed(() => {
  const name = assignedUser.value?.fullName || ''
  return name ? name.charAt(0).toUpperCase() : ''
})

const isHovered = ref(false)

onMounted(() => window.addEventListener('resize', updateWidth))
onUnmounted(() => window.removeEventListener('resize', updateWidth))
</script>
