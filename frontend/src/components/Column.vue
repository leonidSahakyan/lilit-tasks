<template>
  <div
    ref="columnRef"
    class="flex-shrink-0 w-80 flex flex-col bg-white rounded-lg border border-slate-300 max-h-[calc(80vh-100px)] column-wrapper"
    :data-column-id="column.id"
  >
    <!-- Column Header -->
    <div class="p-4 border-b border-slate-200 flex justify-between items-center drag-handle cursor-move">
      <div class="flex items-center gap-2 w-full min-w-0">
        <template v-if="isEditing">
          <input
            v-model="editTitle"
            ref="titleInput"
            @keyup.enter="saveTitle"
            @blur="handleBlur"
            @focus="handleFocus"
            class="px-2 py-1 text-sm border border-slate-200 focus:outline-none focus:ring-0 focus:border-slate-200 w-full truncate"
          />
        </template>
        <template v-else>
          <h3 class="font-semibold text-slate-900 cursor-pointer truncate flex-1 min-w-0" @click="startEditing">
            {{ column.title }}
          </h3>
        </template>
      </div>

      <span class="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full select-none ml-2">
        {{ column.tasks.length }}
      </span>

      <div class="relative ml-2">
        <button @click="menuOpen = !menuOpen" class="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>

        <div v-if="menuOpen" ref="menuRef" class="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <button
            @click="
              () => {
                openAddTask()
                menuOpen = false
              }
            "
            class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Add task
          </button>
          <button
            @click="
              () => {
                startEditing()
                menuOpen = false
              }
            "
            class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit column
          </button>
          <hr class="border-slate-200" />
          <button
            v-if="props.currentUser && props.currentUser.role !== 'user'"
            @click="
              () => {
                confirmDeleteColumn()
                menuOpen = false
              }
            "
            class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete column
          </button>
        </div>
      </div>
    </div>

    <!-- Tasks -->
    <draggable
      v-model="column.tasks"
      :group="{ name: 'tasks', pull: true, put: true }"
      item-key="id"
      :class="['overflow-y-auto flex-1', column.tasks.length ? 'space-y-2 p-4' : '']"
      handle=".task-drag-handle"
      ghost-class="task-ghost"
      chosen-class="drag-over"
      :delay="0"
      :fallbackOnBody="true"
      :disabled="tasksDragDisabled"
      ref="tasksWrapperRef"
      @end="onTaskDrop"
    >
      <template #item="{ element: task }">
        <TaskCard :id="`task-${task.id}`" :task="task" :users="users" @click="$emit('open-task', task)" @toggle-complete="onToggleComplete" />
      </template>
      <template #placeholder><div class="h-2"></div></template>
    </draggable>

    <!-- Add Task -->
    <div class="px-4 py-2 flex-shrink-0" ref="inputWrapper">
      <div v-if="!adding" @click="openInput" class="cursor-pointer text-sm text-slate-400 hover:text-slate-900">+ Add a card</div>

      <div v-else class="flex flex-col gap-2">
        <input
          v-model="newTaskTitle"
          ref="inputRef"
          @keyup.enter="addTask"
          type="text"
          placeholder="Task title..."
          class="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <div class="flex gap-2">
          <button
            @click="addTask"
            class="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            Add card
          </button>
          <button
            @click="cancelInput"
            class="bg-slate-200 text-slate-700 px-2 py-1 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import draggable from 'vuedraggable'
import TaskCard from './TaskCard.vue'
import type { Task, UserFrontend } from '@/types'
import { useTaskInput } from '@/composables/useTaskInput'
import { showConfirmToast } from '../utils/utils'

const props = defineProps<{
  column: { id: number; title: string; tasks: Task[] }
  tasksDragDisabled: boolean
  users: UserFrontend[]
  currentUser: UserFrontend | null
}>()

const emit = defineEmits<{
  (e: 'open-task', task: Task): void
  (e: 'task-status-change', payload: { task: Task; newStatusId: number; newPosition: number }): void
  (e: 'add-task', payload: { title: string; columnId: number }): void
  (e: 'delete-column', id: number): void
  (e: 'update-title', payload: { id: number; title: string }): void
  (e: 'disable-column-drag', state: boolean): void
  (e: 'update-task-completed', payload: { taskId: number; completed: number }): void
}>()

// Column Title Editing
const isEditing = ref(false)
const editTitle = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

const startEditing = () => {
  editTitle.value = props.column.title
  isEditing.value = true
  emit('disable-column-drag', true)
  nextTick(() => titleInput.value?.focus())
}

const saveTitle = async () => {
  if (!isEditing.value) return
  const title = editTitle.value.trim()
  if (title && title !== props.column.title) {
    try {
      props.column.title = title
      emit('update-title', { id: props.column.id, title })
    } catch (e) {
      console.error(e)
      alert('Failed to update title')
    }
  }
  isEditing.value = false
  emit('disable-column-drag', false)
}

const columnRef = ref<HTMLElement | null>(null)
const { adding, newTaskTitle, inputRef, inputWrapper, openInput, addTask } = useTaskInput(
  (title: string) => emit('add-task', { title, columnId: props.column.id }),
  columnRef,
)

const openAddTask = () => {
  openInput()
  nextTick(() => inputRef.value?.focus())
}

const cancelInput = () => {
  newTaskTitle.value = ''
  adding.value = false
}

const onToggleComplete = (taskId: number, completed: number) => {
  emit('update-task-completed', { taskId, completed })
}

const onTaskDrop = (event: any) => {
  const task: Task = event.item.__vueParentComponent.props.task
  const newColumnEl = event.to.closest('.column-wrapper')
  const newStatusId = Number(newColumnEl?.dataset.columnId)
  const newPosition = event.newIndex + 1
  emit('task-status-change', { task, newStatusId, newPosition })
}

const confirmDeleteColumn = async () => {
  if (props.column.tasks.length) {
    showConfirmToast({
      message: `This column has ${props.column.tasks.length} tasks. Delete?`,
      onConfirm: () => emit('delete-column', props.column.id),
    })
    return
  }
  emit('delete-column', props.column.id)
}

const menuOpen = ref(false)

const handleFocus = () => emit('disable-column-drag', true)
const handleBlur = () => saveTitle()

const menuRef = ref<HTMLElement | null>(null)
const handleClickOutsideMenu = (e: MouseEvent) => {
  const menuEl = menuRef.value
  const buttonEl = e.target as HTMLElement
  if (menuOpen.value && menuEl && !menuEl.contains(e.target as Node) && !buttonEl.closest('button')) {
    menuOpen.value = false
  }
}
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutsideMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutsideMenu)
})
</script>
