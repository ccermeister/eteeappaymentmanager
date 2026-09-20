import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import Login from '../views/Login'
import AppLayout from '../views/AppLayout'
import DashboardOverview from '../views/DashboardOverview'
import Students from '../views/Students'
import StudentDetail from '../views/StudentDetail'
import Payments from '../views/Payments'
import Payables from '../views/Payables'
import EditRequests from '../views/EditRequests'
import AuditLog from '../views/AuditLog'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: DashboardOverview },
      { path: 'students', name: 'Students', component: Students },
      { path: 'students/:id', name: 'StudentDetail', component: StudentDetail },
      { path: 'payments', name: 'Payments', component: Payments },
      { path: 'payables', name: 'Payables', component: Payables },
      { path: 'requests', name: 'EditRequests', component: EditRequests },
      { path: 'audit', name: 'AuditLog', component: AuditLog }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()
  
  if (authStore.loading) {
    await authStore.initialize()
  }

  const isAuthenticated = !!authStore.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login' }
  } else if (to.name === 'Login' && isAuthenticated) {
    return { name: 'Students' }
  }
})

export default router
