import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import ConfigView from '@/views/ConfigView.vue'
import ActionsView from '@/views/ActionsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigView
    },
    {
      path: '/actions',
      name: 'actions',
      component: ActionsView
    }
  ]
})

export default router
