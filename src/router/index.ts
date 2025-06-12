// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { rbacGuard } from './guards/rbacGuard'
import { navigationGuard } from '../guards/navigationGuard'
import { instrumentsRoutes } from '../modulos/Instruments/router'
import studentRoutes from '../modulos/Students/router'
import montajeRoutes from '../modulos/Montaje/router'
import { superusuarioRoutes } from '../modulos/Superusuario/router'
import { performanceRoutes } from '../modulos/Performance/router'
import adminRoutes from '../modulos/Admin/router'

const routes: Array<RouteRecordRaw> = [
  // Rutas públicas (sin requerir autenticación)
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { public: true }
  },  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { public: true }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../views/UnauthorizedView.vue'),
    meta: { public: true }
  },
  
  // Rutas para edición de maestros (RBAC)
  {
    path: '/teachers/:id/edit-enrollment',
    name: 'TeacherEditEnrollment',
    component: () => import('../modulos/Teachers/view/TeacherEditEnrollmentView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teachers',
      permission: 'edit_enrollment'
    }
  },
  {
    path: '/teachers/:id/edit',
    name: 'TeacherEdit',
    component: () => import('../modulos/Teachers/view/TeacherEditView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teachers',
      permission: 'edit'
    }
  },
  
  // Rutas principales para maestros (RBAC)
  {
    path: '/teachers',
    name: 'Teachers',
    component: () => import('../modulos/Teachers/view/admin/TeacherAdminView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teachers',
      permission: 'view_all'
    }
  },
  {
    path: '/teachers/:id',
    name: 'TeacherDetail',
    component: () => import('../modulos/Teachers/view/teacher/TeacherProfileView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teachers',
      permission: 'view_detail'
    }
  },
    // Rutas específicas para maestros (RBAC)
  {
    path: '/teacher',
    name: 'TeacherHome',
    component: () => import('../modulos/Teachers/view/TeacherDashboardPage.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teacher',
      permission: 'dashboard_view',
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher']
    }
  },
  {
    path: '/teacher/attendance',
    redirect: '/teacher/attendance/calendar',
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'teacher_view'
    }
  },
  {
    path: '/teacher/attendance/calendar',
    name: 'TeacherAttendanceCalendar',
    component: () => import('../views/AttendanceView.vue'),
    props: { mode: 'calendar' },
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'teacher_calendar'
    }
  },
  {
    path: '/teacher/attendance/:date?/:classId?',
    name: 'TeacherAttendanceDetail',
    component: () => import('../views/AttendanceView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'teacher_detail'
    }
  },
  {
    path: '/teacher/schedule',
    name: 'TeacherSchedule',
    component: () => import('../modulos/Schedules/view/TeacherScheduleView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'schedule',
      permission: 'teacher_view'
    }
  },
  {
    path: '/teacher/profile',
    name: 'TeacherProfile',
    component: () => import('../modulos/Teachers/view/teacher/TeacherProfileView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teacher_profile',
      permission: 'view'
    }
  },
  {
    path: '/teacher/class/:id',
    name: 'TeacherClassDetail',
    component: () => import('../modulos/Teachers/view/teacher/ClassDetailView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'teacher_view_detail'
    }
  },
  {
    path: '/teacher/classes',
    name: 'TeacherClasses',
    component: () => import('../modulos/Classes/components/TeacherClassesDashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'teacher_view'
    }
  },
  {
    path: '/teacher/notifications',
    name: 'TeacherNotifications',
    component: () => import('../modulos/Teachers/views/TeacherNotifications.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teacher_notifications',
      permission: 'view',
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher']
    }
  },
  
  // Rutas de asistencia (RBAC)
  {
    path: '/attendance/:date/:classId',
    name: 'attendance',
    component: () => import('../modulos/Attendance/components/AttendanceList.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'view_detail'
    }
  },
  {
    path: '/attendance/:date(\\d{8})',
    name: 'AttendanceActivities',
    component: () => import('../views/AttendanceActivitiesView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'view_activities'
    }
  },
  {
    path: '/attendance/:date(\\d{8})/:classId',
    name: 'AttendanceDetail',
    component: () => import('../views/AttendanceView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'view_detail'
    }
  },
  {
    path: '/attendance/calendar',
    name: 'AttendanceCalendar',
    component: () => import('../views/ClassSelectionView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'calendar'
    }
  },
  {
    path: '/attendance/informe',
    name: 'AttendanceReport',
    component: () => import('../components/TeacherInformeAttendance.vue'),
    props: route => ({ teacherId: route.query.teacherId }),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'report'
    }
  },
  {
    path: '/teacher/attendance/informe',
    name: 'TeacherInformeAttendance',
    component: () => import('../components/TeacherInformeAttendance.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'teacher_report'
    }
  },

  // Rutas administrativas (RBAC)
  {
    path: '/dashboard',
    name: 'AdminHomeView',
    component: () => import('../modulos/Teachers/view/admin/AdminHomeView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'dashboard',
      permission: 'view'
    }
  },
  {
    path: '/admin/reporteSemanal',
    name: 'AdminReporteSemanal',
    component: () => import('../modulos/Teachers/view/admin/AdminReporteSemanal.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'reports',
      permission: 'admin_view'
    }
  },
  {
    path: '/monitoring',
    name: 'DailyMonitoring',
    component: () => import('../views/DailyMonitoringView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'monitoring',
      permission: 'view'
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../modulos/Analytics/view/AnalyticsDashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'analytics',
      permission: 'view'
    }
  },
  
  // Rutas de estudiantes (RBAC)
  {
    path: '/students',
    name: 'Students',
    component: () => import('../views/StudentsView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'view_all'
    }
  },
  {
    path: '/students/new',
    name: 'NewStudent',
    component: () => import('../modulos/Students/view/NewStudentView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'create'
    }
  },
  {
    path: '/students/:studentId',
    name: 'StudentProfile',
    component: () => import('../modulos/Students/view/StudentProfileView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'view_detail'
    }
  },
  {
    path: '/students/:studentId/instrumento/:instrumentId',
    name: 'StudentInstrumentProfile',
    component: () => import('../modulos/Students/view/StudentInstrumentProfile.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'view_instrument'
    }
  },
  
  // Rutas de clases (RBAC)
  {
    path: '/classes',
    name: 'Classes',
    component: () => import('../views/ClassesView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'view_all'
    }
  },
  {
    path: '/classes/:id',
    name: 'ClassDetail',
    component: () => import('../modulos/Classes/view/ClassDetailView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'view_detail'
    }
  },
  {
    path: '/classes/:id/edit',
    name: 'EditClass',
    component: () => import('../modulos/Classes/view/ClassDetailView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'edit'
    }
  },
  {
    path: '/student-schedule-demo',
    name: 'StudentScheduleDemo',
    component: () => import('../modulos/Classes/components/StudentScheduleDemo.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'view_schedule'
    }
  },
  
  // Rutas de contenidos y configuración (RBAC)
  {
    path: '/contents',
    name: 'Contents',
    component: () => import('../views/ContentsView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'contents',
      permission: 'view'
    }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('../modulos/Schedules/view/ScheduleView.vue'),
    meta: { 
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'schedule',
      permission: 'admin_view'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'profile',
      permission: 'view'
    }  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'settings',
      permission: 'view'
    }
  },

  // Ruta temporal para probar el Footer Navigation del Superusuario
  {
    path: '/test-footer-navigation',
    name: 'TestFooterNavigation',
    component: () => import('../components/FooterNavigationTest.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Superusuario'],      title: 'Test Footer Navigation'
    }
  },
  
  // Ruta temporal para test de RBAC/Firestore (solo para desarrollo)
  {
    path: '/rbac-test',
    name: 'RBACTest',
    component: () => import('../pages/RBACTest.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Superusuario', 'Admin'],
      title: 'Test RBAC Firestore'
    }
  },
  
  // Incluir rutas de módulos
  ...instrumentsRoutes,
  ...studentRoutes,
  ...montajeRoutes,
  ...superusuarioRoutes,
  ...performanceRoutes,
  ...adminRoutes,  // Ruta inicial: redirige según el rol
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeRedirect.vue'),
    meta: { requiresAuth: true }
  },
  // Ruta de fallback
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/ErrorView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de autenticación y RBAC
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Permitir rutas públicas
  if (to.meta.public) {
    return next()
  }
  
  // Esperar a que la autenticación esté inicializada antes de tomar decisiones
  if (!authStore.isInitialized) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.error('Error al verificar autenticación:', error)
    }
  }
  
  // Verificar autenticación
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }
  
  // Evitar redirección infinita
  if (to.path === '/login' && authStore.isLoggedIn) {
    return next('/')
  }
  
  // Verificación RBAC para rutas que lo requieran
  if (to.meta.requiresRBAC && to.meta.moduleKey && to.meta.permission) {
    try {
      await rbacGuard(to, from, next)
      return // rbacGuard ya maneja el next()
    } catch (error) {
      console.error('Error en RBAC guard:', error)
      return next('/dashboard')
    }
  }
  
  // Verificación legacy de allowedRoles (para rutas que aún no se han migrado)
  if (to.meta.allowedRoles && Array.isArray(to.meta.allowedRoles)) {
    const userRole = authStore.user?.role
    if (!userRole || !to.meta.allowedRoles.includes(userRole)) {
      return next('/dashboard')
    }
  }
  // Guard de navegación RBAC configurable (nuevo sistema)
  // Solo aplicar si la ruta no tiene configuración legacy específica
  if (!to.meta.requiresRBAC && !to.meta.allowedRoles) {
    try {
      await navigationGuard(to, from, next)
      return // navigationGuard ya maneja el next()
    } catch (error) {
      console.error('Error en navigation guard:', error)
      // En caso de error, permitir continuar con verificación básica
    }
  }
  
  next()
})

export default router
