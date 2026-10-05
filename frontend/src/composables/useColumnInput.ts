import { ref, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useColumnInput(columnsWrapperRef: Ref<HTMLElement | null>, columnWrapperRef: Ref<HTMLElement | null>) {
  const addingColumn = ref(false)
  const newColumnTitle = ref('')
  const newColumnInput = ref<HTMLInputElement | null>(null)

  const showColumnInput = async () => {
    addingColumn.value = true
    await nextTick(() => newColumnInput.value?.focus())
    scrollToEnd()
  }

  const confirmAddColumn = async (addFn: (title: string) => Promise<any>) => {
    const title = newColumnTitle.value.trim()
    if (!title) return

    await addFn(title)
    newColumnTitle.value = ''
    addingColumn.value = true
    await nextTick(() => newColumnInput.value?.focus())
    scrollToEnd()
  }

  const cancelAddColumn = () => {
    addingColumn.value = false
    newColumnTitle.value = ''
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (addingColumn.value && columnWrapperRef.value && !columnWrapperRef.value.contains(e.target as Node)) {
      cancelAddColumn()
    }
  }

  const handleEsc = (e: KeyboardEvent) => {
    if (addingColumn.value && e.key === 'Escape') cancelAddColumn()
  }

  const scrollToEnd = () => {
    if (columnsWrapperRef.value) columnsWrapperRef.value.scrollLeft = columnsWrapperRef.value.scrollWidth
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleEsc)
  })

  return {
    addingColumn,
    newColumnTitle,
    newColumnInput,
    columnWrapperRef,
    showColumnInput,
    confirmAddColumn,
    cancelAddColumn,
  }
}
