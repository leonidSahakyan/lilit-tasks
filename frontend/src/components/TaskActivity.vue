<template>
  <div class="px-6 pb-6">
    <h3 class="text-sm font-semibold text-slate-900 mb-3">Activity</h3>

    <div v-if="loading" class="text-sm text-slate-400">Loading…</div>
    <ul v-else class="space-y-3 mb-4">
      <li v-if="!items.length" class="text-sm text-slate-400">No activity yet.</li>
      <li v-for="item in items" :key="`${item.kind}-${item.id}`">
        <!-- Comment -->
        <div v-if="item.kind === 'comment'" class="rounded-md border p-3" :class="commentClass(item)">
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span class="font-medium text-slate-800">{{ commentAuthor(item) }}</span>
            <span v-if="item.commentKind !== 'comment'" class="rounded px-1.5 py-0.5 bg-white/70 border border-slate-200">{{ kindLabel[item.commentKind] }}</span>
            <span v-if="item.source !== 'board'" class="text-slate-400">via {{ item.source }}</span>
            <span class="ml-auto">{{ when(item.createdAt) }}</span>
          </div>
          <div class="text-sm text-slate-900 whitespace-pre-wrap break-words">
            <template v-for="(part, i) in linkify(item.body)" :key="i">
              <a v-if="part.url" :href="part.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">{{ part.text }}</a>
              <span v-else>{{ part.text }}</span>
            </template>
          </div>
        </div>

        <!-- History event -->
        <div v-else class="flex items-baseline gap-2 text-xs text-slate-500">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 translate-y-[-1px]"></span>
          <span>
            <span class="text-slate-700">{{ item.actor || 'Someone' }}</span>
            <template v-if="item.type === 'commit'">
              committed
              <a :href="item.data?.url" target="_blank" rel="noopener noreferrer" class="font-mono text-blue-600 underline">{{ item.data?.sha }}</a>
              in {{ item.data?.repo }}<template v-if="item.data?.message">: {{ item.data.message }}</template>
            </template>
            <template v-else>{{ eventText(item) }}</template>
          </span>
          <span class="ml-auto shrink-0">{{ when(item.createdAt) }}</span>
        </div>
      </li>
    </ul>

    <textarea
      v-model="draft"
      rows="3"
      placeholder="Write a comment…"
      class="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
    ></textarea>
    <div class="flex items-center justify-end gap-2 mt-2">
      <button
        type="button"
        :disabled="busy || !draft.trim()"
        @click="reopen"
        title="Send back to To Do, not completed, with this comment"
        class="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
      >
        Reopen with comment
      </button>
      <button
        type="button"
        :disabled="busy || !draft.trim()"
        @click="send"
        class="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
      >
        Comment
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { addComment, getActivity, reopenTask, type ActivityItem, type CommentItem, type EventItem } from '@/api/activity'
import { socketService } from '@/services/SocketService'

const props = defineProps<{ taskId: number }>()
const emit = defineEmits<{ (e: 'reopened'): void }>()

const items = ref<ActivityItem[]>([])
const loading = ref(true)
const draft = ref('')
const busy = ref(false)

const kindLabel: Record<string, string> = { question: 'question', answer: 'answer', report: 'report' }

const load = async () => {
  loading.value = true
  try {
    items.value = await getActivity(props.taskId)
  } finally {
    loading.value = false
  }
}

const push = (item: ActivityItem) => {
  if (!items.value.some((i) => i.kind === item.kind && i.id === item.id)) items.value.push(item)
}

const onActivity = ({ taskId, item }: { taskId: number; item: ActivityItem }) => {
  if (taskId === props.taskId) push(item)
}

onMounted(() => {
  load()
  socketService.on('task.activity', onActivity)
})
onBeforeUnmount(() => socketService.off('task.activity', onActivity))
watch(() => props.taskId, load)

const send = async () => {
  busy.value = true
  try {
    push(await addComment(props.taskId, draft.value.trim()))
    draft.value = ''
  } finally {
    busy.value = false
  }
}

const reopen = async () => {
  busy.value = true
  try {
    await reopenTask(props.taskId, draft.value.trim())
    draft.value = ''
    emit('reopened')
  } finally {
    busy.value = false
  }
}

// Answers relayed from Telegram are posted by the bot but written by the founder.
const commentAuthor = (c: CommentItem) => (c.source === 'telegram' && c.commentKind === 'answer' ? 'Founder' : c.author || 'Someone')

const commentClass = (c: CommentItem) =>
  ({
    report: 'bg-green-50 border-green-200',
    question: 'bg-amber-50 border-amber-200',
    answer: 'bg-blue-50 border-blue-200',
    comment: 'bg-slate-50 border-slate-200',
  })[c.commentKind] || 'bg-slate-50 border-slate-200'

const eventText = (e: EventItem) => {
  const d = e.data || {}
  switch (e.type) {
    case 'created':
      return `created the task in ${d.status}`
    case 'moved':
      return `moved ${d.from ?? '?'} → ${d.to}`
    case 'assigned':
      return d.to ? `assigned to ${d.to}` : `unassigned ${d.from ?? ''}`.trim()
    case 'edited':
      return `edited ${(d.fields || []).join(' and ')}`
    case 'completed':
      return 'marked it completed'
    case 'uncompleted':
      return 'marked it not completed'
    case 'reopened':
      return 'reopened it'
    case 'archived':
      return 'moved it to the archive'
    case 'unarchived':
      return 'restored it from the archive'
    default:
      return e.type
  }
}

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const URL_RE = /(https?:\/\/[^\s<>"')]+)/g
const linkify = (text: string) =>
  text.split(URL_RE).map((part, i) => (i % 2 ? { text: part, url: part } : { text: part, url: null }))
</script>
