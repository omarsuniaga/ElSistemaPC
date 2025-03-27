import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Rutas públicas
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { public: true }
    },
    
    // Rutas específicas para maestros
    {
      path: '/teacher',
      name: 'TeacherHome',
      component: () => import('../views/TeachersView/TeachersHomeView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Maestro']
      }
    },
    {
      path: '/teacher/attendance',
      name: 'TeacherAttendance',
      component: () => import('../views/AttendanceView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Maestro']
      }
    },
    {
      path: '/teacher/schedule',
      name: 'TeacherSchedule',
      component: () => import('../modulos/Schedules/view/TeacherScheduleView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Maestro']
      }
    },
    {
      path: '/teacher/profile',
      name: 'TeacherProfile',
      component: () => import('../views/ProfileView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Maestro']
      }
    },

    // Rutas para directores y administradores
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/StudentsView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('../modulos/Teachers/view/TeachersView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/instruments',
      name: 'Instruments',
      component: () => import('../modulos/Instruments/view/InstrumentManagement.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('../modulos/Analytics/view/AnalyticsDashboard.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/classes',
      name: 'Classes',
      component: () => import('../views/ClassesView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/contents',
      name: 'Contents',
      component: () => import('../views/ContentsView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/schedule',
      name: 'Schedule',
      component: () => import('../modulos/Schedules/view/ScheduleView.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'),
      meta: {
        requiresAuth: true,
        allowedRoles: ['Director', 'Admin']
      }
    },
  

    // Ruta inicial (se redirigirá según el rol)
    {
      path: '/',
      name: 'home',
      redirect: () => {
        const authStore = useAuthStore()
        return authStore.isTeacher ? '/teacher' : '/schedule'
      },
      meta: { requiresAuth: true }
    },

    // Ruta 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const isPublicRoute = to.meta.public
  
  try {
    if (!authStore.isLoggedIn) {
      await authStore.checkAuth()
    }
    
    const user = authStore.user
    const userRole = user?.role
    const userStatus = user?.status
    const allowedRoles = to.meta.allowedRoles as string[] | undefined

    // Verificar acceso basado en rol
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      console.log(`⚠️ Acceso denegado: rol ${userRole} no tiene permiso para ${to.path}`)
      next(authStore.isTeacher ? '/teacher' : '/')
      return
    }

    if (!isPublicRoute && !authStore.isLoggedIn) {
      next({ 
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    if (isPublicRoute && authStore.isLoggedIn && userStatus === 'aprobado') {
      next(authStore.isTeacher ? '/teacher' : '/')
      return
    }

    next()
  } catch (error) {
    console.error('❌ Error en la navegación:', error)
    next({ name: 'Login' })
  }
})

// Error handler para navegación
router.onError((error) => {
  console.error('❌ Error de enrutamiento:', error)
  
  // Modificar para evitar el bucle infinito de recargas
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('⚠️ Error al cargar módulo dinámico. Probando una única recarga...')
    
    // Usar localStorage para evitar recargas infinitas
    const reloadCount = parseInt(localStorage.getItem('route_reload_count') || '0')
    if (reloadCount < 1) {
      localStorage.setItem('route_reload_count', (reloadCount + 1).toString())
      window.location.reload()
    } else {
      console.error('❌ Múltiples errores al cargar módulos. Deteniendo ciclo de recargas.')
      localStorage.removeItem('route_reload_count')
      // Aquí podrías mostrar un error al usuario en lugar de recargar indefinidamente
    }
  }
})

export default router