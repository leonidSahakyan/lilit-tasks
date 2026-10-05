import router from '@/router'
import { h, defineComponent } from 'vue'
import { useToast } from 'vue-toastification'
const toast = useToast()

export function highlight(el: HTMLElement | null, duration = 800) {
  if (!el) return
  const style = getComputedStyle(el)
  const original = {
    opacity: style.opacity,
    transform: style.transform === 'none' ? '' : style.transform,
    backgroundColor: style.backgroundColor,
    boxShadow: style.boxShadow,
    borderColor: style.borderColor,
  }

  const keyframes = [
    original,
    {
      opacity: 0.98,
      transform: 'scale(0.998)',
      backgroundColor: 'var(--slate-50)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      borderColor: 'var(--slate-200)',
    },
    {
      opacity: 1,
      transform: 'scale(1)',
      backgroundColor: 'var(--slate-100)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      borderColor: 'var(--blue-200)',
    },
    original,
  ]

  const animation = el.animate(keyframes, {
    duration,
    easing: 'ease-out',
    fill: 'forwards',
  })

  animation.onfinish = () => {
    el.style.opacity = original.opacity
    el.style.transform = original.transform
    el.style.backgroundColor = original.backgroundColor
    el.style.boxShadow = original.boxShadow
    el.style.borderColor = original.borderColor
  }
}

function waitForElement(selector: string, timeout = 2000): Promise<HTMLElement | null> {
  const interval = 50
  let elapsed = 0
  return new Promise((resolve) => {
    const check = () => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return resolve(el)
      elapsed += interval
      if (elapsed >= timeout) return resolve(null)
      setTimeout(check, interval)
    }
    check()
  })
}

export function showAssignedToast(title: string, text: string, taskId?: number) {
  const ToastComponent = defineComponent({
    setup() {
      const goToTask = async () => {
        if (!taskId) return
        if (router.currentRoute.value.path !== '/dashboard') {
          await router.push('/dashboard')
        }
        const el = await waitForElement(`#task-${taskId}`, 3000)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          highlight(el, 2000)
        }
      }
      return { goToTask }
    },
    template: `
      <div class="bg-white border border-emerald-200 rounded-lg shadow-lg p-4 max-w-sm flex items-start space-x-3 animate-slide-in cursor-pointer"
           @click="goToTask">
        <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z">
            </path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-slate-900">${title}</p>
          <p class="text-xs text-slate-600">${text}</p>
        </div>
      </div>
    `,
  })

  toast(h(ToastComponent), {
    timeout: 5000,
    closeButton: false,
    hideProgressBar: true,
    icon: false,
    toastClassName: 'custom-notification',
  })
}

type ConfirmOptions<T = any> = {
  message: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

export function showConfirmToast(options: ConfirmOptions<any>) {
  const { message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No' } = options

  let toastId: string | number = ''

  toast(
    () =>
      h('div', [
        h('p', { style: 'margin-bottom:8px;' }, message),
        h(
          'button',
          {
            onClick: () => {
              onConfirm()
              toast.dismiss(toastId)
            },
            style: 'margin-right:8px; cursor:pointer;',
          },
          confirmText,
        ),
        h(
          'button',
          {
            onClick: () => {
              onCancel?.()
              toast.dismiss(toastId)
            },
            style: 'cursor:pointer;',
          },
          cancelText,
        ),
      ]),
    {
      timeout: false,
      icon: false, // вот здесь отключаем иконку
    },
  )
}
