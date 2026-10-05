<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md mx-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Task Manager</h1>
        <p class="text-slate-500">Sign in to your account</p>
      </div>

      <!-- Login Form -->
      <form class="space-y-6" @submit.prevent="login">
        <div>
          <label for="username" class="block text-sm font-medium text-slate-700 mb-2"> Username </label>
          <input
            type="text"
            id="username"
            v-model="form.username"
            placeholder="Enter your username"
            required
            class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-700 mb-2"> Password </label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="Enter your password"
            required
            class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors font-medium"
        >
          Sign In
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { POSITION, useToast } from 'vue-toastification'
const toast = useToast()

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
})

const error = ref<string | null>(null)

async function login() {
  try {
    const role = await userStore.login({ ...form })
    if (role === 'admin') router.push('/boards')
    else router.push('/dashboard')
  } catch (e) {
    toast.error('Invalid credentials. Please try again.', {
      icon: false,
      position: POSITION.TOP_CENTER,
      timeout: 3000,
      closeOnClick: true,
      hideProgressBar: true,
    })
  }
}
</script>
