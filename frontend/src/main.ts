import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useUserStore } from './stores/userStore'

import 'tailwindcss'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const app = createApp(App)

const options = {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,

  toastClassName: '',
  bodyClassName: '',
  containerClassName: 'space-y-2',
}
app.use(Toast, options)

app.use(router)
app.use(createPinia())

const userStore = useUserStore()
userStore.loadFromStorage()

app.mount('#app')
