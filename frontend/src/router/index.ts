import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Boards from '../pages/Boards.vue'
import Dashboard from '../pages/Dashboard.vue'
import Users from '../pages/Users.vue'
import { useUserStore } from '../stores/userStore'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/boards',
    name: 'Boards',
    component: Boards,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = !!userStore.accessToken

  if (to.name === 'Login' && isLoggedIn) {
    next({ name: 'Boards' })
    return
  }

  if (!isLoggedIn && to.name !== 'Login') {
    next({ name: 'Login' })
    return
  }

  if (to.name === 'Users' && userStore.user?.role !== 'admin') {
    next({ name: 'Boards' })
    return
  }

  next()
})

export default router
