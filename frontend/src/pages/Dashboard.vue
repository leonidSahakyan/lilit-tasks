<template>
  <MainLayout class="relative">
    <div class="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex flex-row items-center justify-between gap-4 flex-shrink-0">
      <div class="flex flex-1 min-w-0 gap-4">
        <select disabled class="px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed">
          <option>Project Board</option>
        </select>
      </div>

      <button v-if="isFilterActive" @click="filterRef?.resetFilters()" class="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">Clear</button>
      <div class="relative inline-block" ref="filterWrapper">
        <button
          ref="filterBtn"
          @click="toggleFilter"
          class="cursor-pointer relative px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.121A1 1 0 013 6.414V4z"
            />
          </svg>

          <!-- Show found count if filter is active -->
          <span
            v-if="isFilterActive"
            class="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs flex items-center justify-center rounded-full"
          >
            {{ foundCount }}
          </span>
        </button>

        <FilterPanel
          ref="filterRef"
          :visible="filterVisible"
          :style="panelStyles"
          :users="filteredUsers"
          :filters="filters"
          :can-see-other-tasks="canSeeOtherTasks"
          @update-tasks="updateTasks"
          @close="filterVisible = false"
        />
      </div>
    </div>

    <!-- Kanban wrapper -->
    <div class="flex-1 overflow-x-auto w-full px-4 py-4 mb-5" ref="columnsWrapperRef">
      <draggable
        v-model="columns"
        item-key="id"
        class="flex gap-6 min-w-max items-start"
        handle=".drag-handle"
        ghost-class="task-ghost"
        chosen-class="drag-over"
        :delay="0"
        :group="{ name: 'columns' }"
        :fallbackOnBody="true"
        :filter="'.no-drag'"
        :prevent-on-filter="true"
        :disabled="dragDisabled"
        @start="onColumnDragStart"
        @end="onColumnDragEnd"
        @update:modelValue="onColumnsDragEnd"
      >
        <template #item="{ element: col }">
          <Column
            :id="`column-${col.id}`"
            :column="col"
            :users="users"
            :current-user="currentUser"
            @open-task="openTaskModal"
            @task-status-change="onTaskStatusChange"
            @update-task-completed="onUpdateTaskCompleted"
            @add-task="onAddTask"
            @delete-column="deleteColumn"
            @update-title="onUpdateTitle"
            :tasks-drag-disabled="tasksDragDisabled"
            @disable-drag="(state: boolean) => (tasksDragDisabled = state)"
            @disable-column-drag="dragDisabled = $event"
            @disable-tasks-drag="tasksDragDisabled = $event"
          />
        </template>

        <!-- Add Column Footer -->
        <template #footer>
          <div ref="columnWrapperRef">
            <div
              v-if="!addingColumn"
              @click="showColumnInput"
              class="flex-shrink-0 w-80 flex items-center justify-center bg-white rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              + Create another list
            </div>

            <div v-else class="flex-shrink-0 w-80 flex flex-col gap-2 p-4 bg-white rounded-lg border border-slate-300">
              <input
                v-model="newColumnTitle"
                ref="newColumnInput"
                @keyup.enter="() => confirmAddColumn(addColumn)"
                type="text"
                placeholder="Enter list name..."
                class="px-3 py-2 border border-slate-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div class="flex gap-2">
                <button
                  @click="() => confirmAddColumn(addColumn)"
                  class="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  Add list
                </button>
                <button
                  @click="cancelAddColumn"
                  class="bg-slate-200 text-slate-700 px-2 py-1 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Task Modal -->
    <TaskModal
      v-if="showTaskModal && selectedTask"
      :task="selectedTask"
      :statuses="statuses"
      :users="users"
      @update-task-completed="onUpdateTaskCompleted"
      @close="closeTaskModal"
      @update="updateTask"
      @delete="deleteTask"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, reactive, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import Column from '@/components/Column.vue'
import TaskModal from '@/components/TaskModal.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import draggable from 'vuedraggable'
import { ColumnService } from '@/services/ColumnService'
import { TaskService } from '@/services/TaskService'
import { useColumnInput } from '@/composables/useColumnInput'
import type { Filters, UserFrontend, Task, Status } from '@/types'
import { mapFiltersToApi } from '@/utils/mappers'
import { useUserStore } from '@/stores/userStore'
import { socketService } from '@/services/SocketService'

const userStore = useUserStore()
const users = computed(() => userStore.users)
const currentUser = computed<UserFrontend | null>(() => userStore.user ?? null)

const filteredUsers = computed<UserFrontend[]>(() => (currentUser.value ? users.value.filter((u) => u.id !== currentUser.value!.id) : []))

const canSeeOtherTasks = computed(() =>
  currentUser.value ? currentUser.value.role === 'admin' || currentUser.value.permissions?.includes('see_other_tasks') === true : false,
)

const columnService = new ColumnService()
const columns = columnService.columns
const tasks = ref<Task[]>([])

const taskService = new TaskService(columns)

// Column Input
const columnsWrapperRef = ref<HTMLElement | null>(null)
const columnWrapperRef = ref<HTMLElement | null>(null)
const { addingColumn, newColumnTitle, newColumnInput, showColumnInput, confirmAddColumn, cancelAddColumn } = useColumnInput(
  columnsWrapperRef,
  columnWrapperRef,
)

// Refs & State
const showTaskModal = ref(false)
const selectedTask = ref<Task | null>(null)
const dragDisabled = ref(false)
const tasksDragDisabled = ref(false)
const filterVisible = ref(false)
const filterBtn = ref<HTMLElement | null>(null)
const filterWrapper = ref<HTMLElement | null>(null)
const panelStyles = ref({})
const allSelected = ref(false)
const filterRef = ref<InstanceType<typeof FilterPanel>>()

// Filters
const filters = reactive<Filters>({
  members: { noMembers: false, assignedToMe: false },
  status: { complete: false, incomplete: false },
  due: { start: '', end: '', date: '', noDate: false, overdue: false, nextDay: false, nextWeek: false, nextMonth: false },
  activity: { lastWeek: false, lastTwoWeeks: false, lastFourWeeks: false, noActivity: false },
  keyword: '',
  selectedUserIds: [],
})

// Computed
const statuses = computed(() =>
  columns.value.map((col, index) => ({
    id: col.id,
    name: col.title,
    position: index,
  })),
)

const isFilterActive = computed(() => {
  const f = filters
  return (
    f.keyword !== '' ||
    f.members.noMembers ||
    f.members.assignedToMe ||
    f.status.complete ||
    f.status.incomplete ||
    f.due.start !== '' ||
    f.due.end !== '' ||
    f.due.noDate ||
    f.due.overdue ||
    f.due.nextDay ||
    f.due.nextWeek ||
    f.due.nextMonth ||
    f.activity.lastWeek ||
    f.activity.lastTwoWeeks ||
    f.activity.lastFourWeeks ||
    f.activity.noActivity ||
    f.selectedUserIds.length > 0
  )
})

const foundCount = computed(() => tasks.value.length)

const updateTasks = (newTasks: Task[]) => {
  tasks.value = newTasks
  columns.value.forEach((col) => {
    col.tasks = tasks.value.filter((t) => t.statusId === col.id)
  })
}

const onAddTask = async ({ title, columnId }: { title: string; columnId: number }) => await taskService.addTask(title, columnId)

const updateTask = async (task: Task) => {
  await taskService.updateTask(task)
}

const deleteTask = async (id: number) => await taskService.deleteTask(id)

const onTaskStatusChange = async ({ task, newStatusId, newPosition }: { task: Task; newStatusId: number; newPosition: number }) =>
  await taskService.moveTask(task, newStatusId, newPosition)

const onUpdateTaskCompleted = async ({ taskId, completed }: { taskId: number; completed: number }) => {
  await taskService.updateTaskCompleted(taskId, completed)
}

const addColumn = async (title: string) => await columnService.addColumn(title)
const onUpdateTitle = async ({ id, title }: { id: number; title: string }) => await columnService.updateColumn(id, title)
const deleteColumn = async (id: number) => await columnService.deleteColumn(id)

const onColumnDragStart = (event: any) => {
  tasksDragDisabled.value = true
  const el = event.item as HTMLElement
  if (el) el.classList.add('dragging')
}

const onColumnDragEnd = (event: any) => {
  tasksDragDisabled.value = false
  const el = event.item as HTMLElement
  if (el) el.classList.remove('dragging')
}

const onColumnsDragEnd = async () => await columnService.reorderColumns()

const openTaskModal = (task: Task) => {
  selectedTask.value = task
  showTaskModal.value = true
}

const closeTaskModal = () => {
  showTaskModal.value = false
}

const toggleFilter = async () => {
  filterVisible.value = !filterVisible.value
  await nextTick()
  if (filterVisible.value && filterBtn.value) {
    const btnRect = filterBtn.value.getBoundingClientRect()
    const panelWidth = 320
    const viewportWidth = window.innerWidth
    const spacing = 4
    let left = 0
    const rightEdge = btnRect.left + panelWidth
    if (rightEdge > viewportWidth - 16) {
      left = -(rightEdge - viewportWidth + 16)
    }
    panelStyles.value = {
      position: 'absolute',
      top: `${btnRect.height + spacing}px`,
      left: `${left}px`,
      width: `${panelWidth}px`,
      zIndex: 9999,
    }
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (filterVisible.value && filterWrapper.value && !filterWrapper.value.contains(event.target as Node)) {
    filterVisible.value = false
  }
}

const loadDashboard = async () => {
  try {
    await userStore.loadUsers()
    await columnService.loadColumns()
    const taskFilters = mapFiltersToApi(filters)
    tasks.value = await columnService.loadTasks(taskFilters)
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
}

watch(currentUser, (user) => {})

onMounted(async () => {
  const savedFilters = localStorage.getItem('dashboardFilters')
  if (savedFilters) {
    try {
      Object.assign(filters, JSON.parse(savedFilters))
      allSelected.value = filters.selectedUserIds.length === users.value.length
    } catch (e) {
      console.error('Failed to parse saved filters', e)
    }
  }

  await loadDashboard()
  window.addEventListener('mousedown', handleClickOutside)

  socketService.on('task.created', (task: Task) => taskService.handleSocketEvent('created', task))
  socketService.on('task.updated', (task: Task) => taskService.handleSocketEvent('updated', task))
  socketService.on('task.deleted', ({ id }: { id: number }) => taskService.handleSocketEvent('deleted', id))
  socketService.on('tasks.reordered', (updatedTasks: Task[]) => taskService.handleSocketEvent('reordered', updatedTasks))

  socketService.on('column.created', (column: Status) => columnService.handleSocketEvent('created', column))
  socketService.on('column.updated', (column: Status) => columnService.handleSocketEvent('updated', column))
  socketService.on('column.deleted', (columnId: Status) => columnService.handleSocketEvent('deleted', columnId))
  socketService.on('columns.reordered', (updatedColumns: Status[]) => columnService.handleSocketEvent('reordered', updatedColumns))
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  socketService.off('task.created')
  socketService.off('task.updated')
  socketService.off('task.deleted')
  socketService.off('tasks.reordered')
  socketService.off('column.created')
  socketService.off('column.updated')
  socketService.off('column.deleted')
  socketService.off('columns.reordered')
})
</script>
