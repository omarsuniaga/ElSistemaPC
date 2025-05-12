// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { instrumentsRoutes } from '../modulos/Instruments/router';
import studentRoutes from '../modulos/Students/router';
// import { attendanceRoutes } from '../modulos/attendance/router/attendanceRoutes'

const routes: Array<RouteRecordRaw> = [
  // Rutas públicas (sin requerir autenticación)
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
  // Ruta para editar la ficha de inscripción de un maestro
  {
    path: '/teachers/:id/edit-enrollment',
    name: 'TeacherEditEnrollment',
    component: () => import('../modulos/Teachers/view/TeacherEditEnrollmentView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro', 'Director', 'Admin']
    }
  },
  {
    path: '/teachers/:id/edit',
    name: 'TeacherEdit',
    component: () => import('../modulos/Teachers/view/TeacherEditView.vue'),
    meta: { requiresAuth: true }
  },
  // Rutas específicas para Maestros y Directores
  {
    path: '/teachers',
    name: 'Teachers',
    component: () => import('../modulos/Teachers/view/admin/TeacherAdminView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin']
    }
  },
  // Rutas específicas para maestros
  {
    path: '/teacher',
    name: 'TeacherHome',
    component: () => import('../modulos/Teachers/view/TeacherDashboardPage.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro']
    }
  },  {
    path: '/teacher/attendance',
    redirect: '/teacher/attendance/calendar',
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro']
    }
  },
  {
    path: '/teacher/attendance/calendar',
    name: 'TeacherAttendanceCalendar',
    component: () => import('../views/AttendanceView.vue'),
    props: { mode: 'calendar' },
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro']
    }
  },
  {
    path: '/teacher/attendance/:date?/:classId?',
    name: 'TeacherAttendanceDetail',
    component: () => import('../views/AttendanceView.vue'),
    props: true,
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
    component: () => import('../modulos/Teachers/view/teacher/TeacherProfileView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro']
    }
  },
  // {
  //   path: '/teacher-attendance',
  //   name: 'teacher-attendance',
  //   component: () => import('../views/TeacherAttendanceView.vue'),
  //   meta: {
  //     requiresAuth: true,
  //     requiresTeacher: true
  //   }
  // },
  {
    path: '/attendance/:date/:classId',
    name: 'attendance',
      component: () => import('../modulos/Attendance/components/AttendanceList.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro', 'Director', 'Admin']
    }
  },
  {
    path: '/teacher/class/:id',
    name: 'TeacherClassDetail',
    component: () => import('../modulos/Teachers/view/teacher/ClassDetailView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro', 'Director', 'Admin']
    }
  },
  {
    path: '/admin/reporte-semanal',
    name: 'AdminReporteSemanal',
    component: () => import('../modulos/Teachers/view/admin/AdminReporteSemanal.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Maestro', 'Director', 'Admin']
    }
  },
  // Ruta para la lista dinámica de actividades según la fecha (ej: /attendance/20250318)
  {
    path: '/attendance/:date(\\d{8})',
    name: 'AttendanceActivities',
    component: () => import('../views/AttendanceActivitiesView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro', 'Director', 'Admin']
    }
  },
  // Ruta para el detalle de una actividad (ej: /attendance/20250318/123)
  {
    path: '/attendance/:date(\\d{8})/:classId',
    name: 'AttendanceDetail',
    component: () => import('../views/AttendanceView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Maestro', 'Director', 'Admin']
    }
  },

  // Rutas para directores y administradores
  {
    path: '/dashboard',
    name: 'AdminHomeView',
    component: () => import('../modulos/Teachers/view/admin/AdminHomeView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin']
    }
  },
  {
    path: '/monitoring',
    name: 'DailyMonitoring',
    component: () => import('../views/DailyMonitoringView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin']
    }
  },
  {
    path: '/students',
    name: 'Students',
    component: () => import('../views/StudentsView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin', 'Maestro']
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
  {    path: '/classes',
    name: 'Classes',
    component: () => import('../views/ClassesView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin']
    }
  },  {
    path: '/classes/:id',
    name: 'ClassDetail',
    component: () => {
      // Envolver la importación en un try-catch para manejar errores de carga
      return import('../modulos/Classes/view/ClassDetailView.vue')
        .catch(err => {
          console.error('Error cargando ClassDetailView:', err);
          
          // Si el usuario es un maestro, redirigir a la vista de maestro
          const userDataStr = localStorage.getItem('user');
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.role === 'Maestro') {
                return import('../modulos/Teachers/view/teacher/ClassDetailView.vue');
              }
            } catch (e) {
              console.warn('Error al parsear datos de usuario:', e);
            }
          }
          
          // Vista de error como fallback
          return {
            template: `
              <div class="p-6">
                <h2 class="text-xl font-bold mb-4">Error al cargar la vista de clase</h2>
                <p>Se produjo un error al cargar los detalles de la clase.</p>
                <button @click="$router.push('/dashboard')" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                  Volver al Dashboard
                </button>
              </div>
            `
          };
        });
    },
    props: true,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin', 'Maestro']
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
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/students/new',
    name: 'NewStudent',
    component: () => import('../modulos/Students/view/NewStudentView.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin', 'Maestro']
    }
  },
  // ruta para /students/:studentId/
  {
    path: '/students/:studentId',
    name: 'StudentProfile',
    component: () => import('../modulos/Students/view/StudentProfileView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin', 'Maestro']
    }
  },

  {
    path: '/students/:studentId/instrumento/:instrumentId',
    name: 'StudentInstrumentProfile',
    component: () => import('../modulos/Students/view/StudentInstrumentProfile.vue'),
    meta: { requiresAuth: true, allowedRoles: ['Director', 'Admin', 'Maestro'] }
  },
  {
    path: '/attendance/calendar',
    name: 'AttendanceCalendar',
    component: () => import('../views/ClassSelectionView.vue')
  },
  {
    path: '/attendance/informe',
    name: 'AttendanceReport',
    component: () => import('../components/TeacherInformeAttendance.vue'),
    props: route => ({ teacherId: route.query.teacherId }),
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['Director', 'Admin', 'Maestro'] 
    }
  },
  {
    path: '/teacher/attendance/informe',
    name: 'TeacherInformeAttendance',
    component: () => import('../components/TeacherInformeAttendance.vue'),
    meta: { requiresAuth: true, allowedRoles: ['Maestro'] }
  },
  {
    path: '/classes/:classId/add-student',
    name: 'AddStudentToClass',
    component: () => import('../modulos/Students/view/AddStudentToClassView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Añadir Estudiante a Clase'
    }
  },
  ...instrumentsRoutes,
  ...studentRoutes,
  // ...attendanceRoutes,
  // Ruta inicial: redirige según el rol
  {
    path: '/',
    name: 'home',
    redirect: () => {
      const authStore = useAuthStore()
      // Si el usuario es maestro se redirige a '/teacher', de lo contrario a '/schedule'
      return authStore.isTeacher ? '/teacher' : '/dashboard'
    },
    meta: { requiresAuth: true }
  },

  // Ruta 404: redirige a home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guardia de rutas
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const isPublicRoute = to.meta.public

  try {
    // Si el usuario aún no está autenticado, se verifica su estado
    if (!authStore.isLoggedIn) {
      await authStore.checkAuth()
    }
    const user = authStore.user
    const userRole = user?.role
    const userStatus = user?.status
    const allowedRoles = to.meta.allowedRoles as string[] | undefined

    // Si la ruta requiere autenticación y el usuario no está logueado, redirige a Login
    if (!isPublicRoute && !authStore.isLoggedIn) {
      return next({ 
        name: 'Login',
        query: { redirect: to.fullPath }
      })
    }

    // Si la ruta es pública pero el usuario ya está autenticado y aprobado, redirige a su área
    if (isPublicRoute && authStore.isLoggedIn && userStatus === 'aprobado') {
      return next(authStore.isTeacher ? '/teacher' : '/')
    }

    // Si la ruta tiene restricciones de rol y el usuario no cumple, redirige según su rol
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      console.warn(`⚠️ Acceso denegado: rol ${userRole} no tiene permiso para acceder a ${to.path}`)
      // Redirigir: si es maestro, a '/teacher'; de lo contrario, a '/' o alguna ruta de acceso general
      return next(authStore.isTeacher ? '/teacher' : '/')
    }

    next()
  } catch (error) {
    console.error('❌ Error en la navegación:', error)
    next({ name: 'Login' })
  }
})

// Manejador de errores en el enrutamiento (para módulos dinámicos)
router.onError((error) => {
  console.error('❌ Error de enrutamiento:', error);
  
  // Error de carga de módulos dinámicos (problema común)
  if (error.message.includes('Failed to fetch dynamically imported module') || 
      error.message.includes('Unexpected token') ||
      error.stack?.includes('SyntaxError')) {
    
    // Registra el error con más detalles para depuración
    console.warn('⚠️ Error al cargar módulo dinámico:', {
      message: error.message,
      stack: error.stack,
      to: router.currentRoute.value.fullPath
    });
    
    // Si el error ocurre en la ruta de detalles de clase, redirigir a la vista alternativa
    if (router.currentRoute.value.path.includes('/classes/')) {
      const classId = router.currentRoute.value.params.id;
      if (classId) {
        console.log('🔄 Redirigiendo a la vista de clase para maestros como fallback');
        router.push({
          name: 'TeacherClassDetail',
          params: { id: classId }
        }).catch(fallbackError => {
          console.error('💥 Error en redirección fallback:', fallbackError);
          // Si aún hay error, intentar recargar la página
          tryPageReload();
        });
        return;
      }
    }
    
    // Si no es ruta de clase o no tiene ID, intentar recarga como último recurso
    tryPageReload();
  }
});

// Función auxiliar para manejar recargas controladas y evitar bucles
function tryPageReload() {
  console.warn('⚠️ Probando una única recarga para resolver el problema...');
  const reloadCount = parseInt(localStorage.getItem('route_reload_count') || '0');
  
  if (reloadCount < 1) {
    localStorage.setItem('route_reload_count', (reloadCount + 1).toString());
    
    // Guardar la ruta actual para restaurarla después de la recarga
    const currentPath = router.currentRoute.value.fullPath;
    sessionStorage.setItem('last_route_error_path', currentPath);
    
    // Redirigir a una ruta "segura" antes de recargar para evitar bucle
    if (currentPath !== '/' && currentPath !== '/dashboard' && currentPath !== '/teacher') {
      router.push('/dashboard').then(() => {
        setTimeout(() => window.location.reload(), 100);
      });
    } else {
      window.location.reload();
    }
  } else {
    console.error('❌ Múltiples errores al cargar módulos. Deteniendo ciclo de recargas.');
    localStorage.removeItem('route_reload_count');
    // Redirigir al dashboard como medida de emergencia
    router.push('/dashboard');
  }
}

export default router
