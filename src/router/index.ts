import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'Inicio' }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { public: true, title: 'Iniciar Sesión' }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { public: true, title: 'Registro' }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { title: 'Perfil' }
    },
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/StudentsView.vue'),
      meta: { title: 'Estudiantes' }
    },
    {
      path: '/students/new',
      name: 'StudentNew',
      component: () => import('../views/StudentNewView.vue'),
      meta: { title: 'Nuevo Estudiante' }
    },
    {
      path: '/students/:id',
      name: 'StudentProfile',
      component: () => import('../views/StudentProfileView.vue'),
      meta: { title: 'Perfil de Estudiante' },
      props: true
    },
    {
      path: '/students/:id/edit',
      name: 'StudentEdit',
      component: () => import('../views/StudentEditView.vue'),
      meta: { title: 'Editar Estudiante' },
      props: true
    },
    {
      path: '/students/:id/delete',
      name: 'StudentDelete',
      component: () => import('../views/StudentDeleteView.vue'),
      meta: { title: 'Eliminar Estudiante' },
      props: true
    },
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('../views/TeachersView.vue'),
      meta: { title: 'Profesores' }
    },
    {
      path: '/teachers/new',
      name: 'TeacherNew',
      component: () => import('../views/TeacherNewView.vue'),
      meta: { title: 'Nuevo Profesor' }
    },
    {
      path: '/teachers/:id',
      name: 'TeacherProfile',
      component: () => import('../views/TeacherProfileView.vue'),
      meta: { title: 'Perfil de Profesor' },
      props: true
    },
    {
      path: '/teachers/:id/edit',
      name: 'TeacherEdit',
      component: () => import('../views/TeacherEditView.vue'),
      meta: { title: 'Editar Profesor' },
      props: true
    },
    {
      path: '/classes',
      name: 'Classes',
      component: () => import('../views/ClassesView.vue'),
      meta: { title: 'Clases' }
    },
    {
      path: '/attendance',
      name: 'Attendance',
      component: () => import('../views/AttendanceView.vue'),
      meta: { title: 'Asistencia' }
    },
    {
      path: '/attendance/:date/:classId',
      name: 'AttendanceDetail',
      component: () => import('../views/AttendanceView.vue'),
      meta: { title: 'Registro de Asistencia' },
      props: true
    },
    {
      path: '/contents',
      name: 'Contents',
      component: () => import('../views/ContentsView.vue'),
      meta: { title: 'Contenidos' }
    },
    {
      path: '/repertoire',
      name: 'Repertoire',
      component: () => import('../views/RepertoireView.vue'),
      meta: { title: 'Repertorio' }
    },
    {
      path: '/workspace',
      name: 'Workspace',
      component: () => import('../views/WorkspaceView.vue'),
      meta: { title: 'Área de Trabajo' }
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/at-risk-students',
      name: 'atRiskStudents',
      component: () => import('../views/AtRiskStudentsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/student-schedule/:id',
      name: 'studentSchedule',
      component: () => import('../views/StudentScheduleView.vue'),
      meta: { requiresAuth: true }
    },
    // Ruta 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Navigation guard global
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const isPublicRoute = to.meta.public
  
  // Actualizar título de la página
  if (to.meta.title) {
    document.title = `${to.meta.title} - Academia de Música`
  }

  try {
    // Verificar autenticación
    if (!authStore.isLoggedIn) {
      await authStore.checkAuth()
    }

    // Redireccionar a login si la ruta requiere autenticación
    if (!isPublicRoute && !authStore.isLoggedIn) {
      next({ 
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Redireccionar al home si ya está autenticado y va a una ruta pública
    if (isPublicRoute && authStore.isLoggedIn) {
      next({ name: 'Home' })
      return
    }

    // Verificar permisos según el rol
    if (to.meta.requiresDirector && !authStore.isDirector) {
      next({ name: 'Home' })
      return
    }

    next()
  } catch (error) {
    console.error('Error en la navegación:', error)
    next({ name: 'Login' })
  }
})

// Error handler para navegación
router.onError((error) => {
  console.error('Error de enrutamiento:', error)
  
  // Si el error es de carga de chunk, recargar la página
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.reload()
  }
})

export default router