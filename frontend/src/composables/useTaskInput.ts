import { ref, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useTaskInput(addFn: (title: string) => void, wrapperRef: Ref<HTMLElement | null>) {
  const adding = ref(false)
  const newTaskTitle = ref('')
  const inputRef = ref<HTMLInputElement | null>(null)
  const inputWrapper = ref<HTMLButtonElement | null>(null)

  const scrollToBottom = () => {
    if (!wrapperRef.value) return
    const tasksContainer = wrapperRef.value.querySelector<HTMLElement>('.overflow-y-auto')
    if (!tasksContainer) return
    tasksContainer.scrollTop = tasksContainer.scrollHeight
  }

  const openInput = async () => {
    adding.value = true
    await nextTick()
    inputRef.value?.focus()
    scrollToBottom()
  }

  const addTask = () => {
    const title = newTaskTitle.value.trim()
    if (!title) return

    addFn(title)
    newTaskTitle.value = ''

    nextTick(() => {
      setTimeout(() => {
        scrollToBottom()
        inputRef.value?.focus()
      }, 50)
    })
  }

  const cancelAdd = () => {
    adding.value = false
    newTaskTitle.value = ''
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (!adding.value) return
    const target = e.target as Node
    if (inputWrapper.value?.contains(target)) return
    cancelAdd()
  }

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cancelAdd()
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleEsc)
  })

  return { adding, newTaskTitle, inputRef, inputWrapper, openInput, addTask, cancelAdd }
}
