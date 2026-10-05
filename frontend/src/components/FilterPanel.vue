<template>
  <div
    class="absolute bg-white shadow-lg rounded-lg border border-slate-300 z-50 filter w-full sm:w-80 max-h-[80vh] overflow-y-auto"
    v-show="visible"
    :style="style"
  >
    <div class="p-4 border-b border-slate-200 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-900">Filters</h3>
      <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="p-4 space-y-4 max-h-170 overflow-y-auto">
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-900">Keyword</label>
        <input
          type="text"
          v-model="filters.keyword"
          placeholder="Search by title and description"
          class="mt-1 w-full border border-slate-300 rounded px-2 py-1 text-sm text-slate-500"
        />
      </div>
      <div v-if="canSeeOtherTasks">
        <h4 class="font-medium text-slate-900 text-xs mb-2">Members</h4>
        <div class="space-y-1">
          <label class="flex items-center text-sm">
            <input type="checkbox" v-model="filters.members.noMembers" class="rounded border-slate-300 text-blue-600" />
            <span class="ml-2 text-slate-700">No members</span>
          </label>

          <label class="flex items-center text-sm">
            <input type="checkbox" v-model="filters.members.assignedToMe" class="rounded border-slate-300 text-blue-600" />
            <span class="ml-2 text-slate-700">Cards assigned to me</span>
          </label>

          <div class="relative" ref="inputRef">
            <label class="flex items-center text-sm">
              <input type="checkbox" v-model="allSelected" @change="toggleAllSelected" class="rounded border-slate-300 text-blue-600" />
              <input
                type="text"
                readonly
                @click.prevent="toggleDropdown"
                :value="selectedUsersLabel"
                class="ml-2 flex-1 border border-slate-300 rounded px-2 py-1 text-sm cursor-pointer"
              />
            </label>

            <div
              v-show="dropdownOpen"
              :style="{
                position: 'fixed',
                top: `${inputRect.top + inputRect.height}px`,
                left: `${inputRect.left}px`,
                width: `${inputRect.width}px`,
                zIndex: 9999,
              }"
              class="bg-white border border-slate-300 rounded-lg shadow-lg max-h-150 overflow-y-auto"
            >
              <div v-for="user in users" :key="user.id" class="flex items-center px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  :id="'user-' + user.id"
                  :checked="filters.selectedUserIds.includes(user.id)"
                  @change="toggleUser(user.id)"
                  class="rounded border-slate-300 text-blue-600"
                />
                <label :for="'user-' + user.id" class="ml-2 cursor-pointer">{{ user.fullName }}</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 class="font-medium text-slate-900 text-xs mb-2">Card Status</h4>
        <div class="space-y-1">
          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.status.complete"
              @change="(e: Event) => uncheckStatus('complete', (e.target as HTMLInputElement).checked)"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Marked as complete</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.status.incomplete"
              @change="(e: Event) => uncheckStatus('incomplete', (e.target as HTMLInputElement).checked)"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Not marked as complete</span>
          </label>
        </div>
      </div>

      <div>
        <h4 class="font-medium text-slate-900 text-xs mb-2 flex items-center justify-between">
          <span>Due Date</span>
          <button @click="clearDueDate" class="text-xs text-blue-600 hover:text-blue-700">Clear</button>
        </h4>

        <div class="space-y-1">
          <div class="flex gap-2">
            <input
              type="date"
              v-model="filters.due.start"
              :max="filters.due.end || undefined"
              class="border border-slate-300 rounded px-2 py-1 text-sm flex-1"
            />
            <input
              type="date"
              v-model="filters.due.end"
              :min="filters.due.start || undefined"
              class="border border-slate-300 rounded px-2 py-1 text-sm flex-1"
            />
          </div>

          <label class="flex items-center text-sm">
            <input type="checkbox" v-model="filters.due.noDate" :disabled="isDueRangeSelected" class="rounded border-slate-300 text-blue-600" />
            <span class="ml-2 text-slate-700">No dates</span>
          </label>

          <label class="flex items-center text-sm">
            <input type="checkbox" v-model="filters.due.overdue" :disabled="isDueRangeSelected" class="rounded border-slate-300 text-blue-600" />
            <span class="ml-2 text-slate-700">Overdue</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.due.nextDay"
              @change="(e: Event) => uncheckNextDue('nextDay', (e.target as HTMLInputElement).checked)"
              :disabled="isDueRangeSelected"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Due in the next day</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.due.nextWeek"
              @change="(e: Event) => uncheckNextDue('nextWeek', (e.target as HTMLInputElement).checked)"
              :disabled="isDueRangeSelected"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Due in the next week</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.due.nextMonth"
              @change="(e: Event) => uncheckNextDue('nextMonth', (e.target as HTMLInputElement).checked)"
              :disabled="isDueRangeSelected"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Due in the next month</span>
          </label>
        </div>
      </div>

      <div>
        <h4 class="font-medium text-slate-900 text-xs mb-2">Activity</h4>
        <div class="space-y-1">
          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.activity.lastWeek"
              @change="(e: Event) => uncheckActivity('lastWeek', (e.target as HTMLInputElement).checked)"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Active in the last week</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.activity.lastTwoWeeks"
              @change="(e: Event) => uncheckActivity('lastTwoWeeks', (e.target as HTMLInputElement).checked)"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Active in the last two weeks</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.activity.lastFourWeeks"
              @change="(e: Event) => uncheckActivity('lastFourWeeks', (e.target as HTMLInputElement).checked)"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Active in the last four weeks</span>
          </label>

          <label class="flex items-center text-sm">
            <input
              type="checkbox"
              :checked="filters.activity.noActivity"
              @change="(e: Event) => uncheckActivity('noActivity', (e.target as HTMLInputElement).checked)"
              class="rounded border-slate-300 text-blue-600"
            />
            <span class="ml-2 text-slate-700">Without activity in the last four weeks</span>
          </label>
        </div>
      </div>
    </div>

    <div class="p-4 border-t border-slate-200 flex justify-between items-center">
      <button @click="resetFilters" class="text-xs text-blue-600 hover:text-blue-700">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { getTasks } from '@/api/task'
import type { User } from '@/types'
import type { Filters, StatusFilters, ActivityFilters } from '@/types'
import { mapFiltersToApi } from '@/utils/mappers'

const props = defineProps<{
  visible: boolean
  style?: Record<string, any>
  users?: User[]
  filters: Filters
  canSeeOtherTasks: boolean
}>()

const filters = props.filters

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-tasks', tasks: any): void
}>()

const users = computed(() => props.users ?? [])
const dropdownOpen = ref(false)
const allSelected = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const inputRect = reactive({ top: 0, left: 0, height: 0, width: 0 })

watch(
  users,
  (val) => {
    allSelected.value = filters.selectedUserIds.length === val.length
  },
  { immediate: true },
)

const toggleDropdown = () => {
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
    inputRect.top = rect.top
    inputRect.left = rect.left
    inputRect.height = rect.height
    inputRect.width = rect.width
  }
  dropdownOpen.value = !dropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownOpen.value && inputRef.value && !inputRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

watch(dropdownOpen, (val) => {
  if (val) document.addEventListener('click', handleClickOutside)
  else document.removeEventListener('click', handleClickOutside)
})

const selectedUsersLabel = computed(() => {
  if (allSelected.value) return `${users.value.length} members selected`
  if (filters.selectedUserIds.length === 0) return 'Select members'
  return `${filters.selectedUserIds.length} member${filters.selectedUserIds.length > 1 ? 's' : ''} selected`
})

const toggleUser = (id: number) => {
  const index = filters.selectedUserIds.indexOf(id)
  if (index >= 0) filters.selectedUserIds.splice(index, 1)
  else filters.selectedUserIds.push(id)
  allSelected.value = filters.selectedUserIds.length === users.value.length
}

const toggleAllSelected = () => {
  if (allSelected.value) filters.selectedUserIds = users.value.map((u) => u.id)
  else filters.selectedUserIds = []
}

const uncheckStatus = (field: keyof StatusFilters, value: boolean) => {
  Object.keys(filters.status).forEach((k) => {
    if (k !== field) filters.status[k as keyof StatusFilters] = false
  })
  filters.status[field] = value
}

const uncheckActivity = (field: keyof ActivityFilters, value: boolean) => {
  Object.keys(filters.activity).forEach((k) => {
    if (k !== field) filters.activity[k as keyof ActivityFilters] = false
  })
  filters.activity[field] = value
}

type BooleanDueKey = 'nextDay' | 'nextWeek' | 'nextMonth'

const uncheckNextDue = (field: BooleanDueKey, value: boolean) => {
  const nextKeys: BooleanDueKey[] = ['nextDay', 'nextWeek', 'nextMonth']
  nextKeys.forEach((k) => {
    if (k !== field) filters.due[k] = false
  })
  filters.due[field] = value
}

const isDueRangeSelected = computed(() => !!filters.due.start || !!filters.due.end)
watch(isDueRangeSelected, (val) => {
  if (val) {
    filters.due.noDate = false
    filters.due.overdue = false
    filters.due.nextDay = false
    filters.due.nextWeek = false
    filters.due.nextMonth = false
  }
})

let skipNext = false
const applyFilterUpdate = async () => {
  if (skipNext) {
    skipNext = false
    return
  }
  const taskFilters = mapFiltersToApi(filters)
  const taskData = await getTasks(taskFilters)
  emit('update-tasks', taskData)
}

watch(
  [() => filters.due, () => filters.status, () => filters.activity, () => filters.members, () => filters.keyword, () => filters.selectedUserIds],
  () => {
    applyFilterUpdate()
    localStorage.setItem('dashboardFilters', JSON.stringify(filters))
  },
  { deep: true },
)

const clearDueDate = () => {
  filters.due.start = ''
  filters.due.end = ''
}

const resetFilters = () => {
  Object.assign(filters, {
    members: { noMembers: false, assignedToMe: false },
    status: { complete: false, incomplete: false },
    due: { start: '', end: '', date: '', noDate: false, overdue: false, nextDay: false, nextWeek: false, nextMonth: false },
    activity: { lastWeek: false, lastTwoWeeks: false, lastFourWeeks: false, noActivity: false },
    keyword: '',
    selectedUserIds: [],
  })
  allSelected.value = false
  localStorage.removeItem('dashboardFilters')
}

defineExpose({ resetFilters })

onMounted(() => {
  allSelected.value = filters.selectedUserIds.length === users.value.length
  skipNext = true
})
</script>
