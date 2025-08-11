// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { rbacGuard } from './guards/rbacGuard';
import { navigationGuard } from '../guards/navigationGuard';
import { roleBasedRedirectGuard } from './guards/roleBasedRedirect';
import { instrumentsRoutes } from '../modulos/Instruments/router';
import studentRoutes from '../modulos/Students/router';
import montajeRoutes from '../modulos/Montaje/router/index';
import { superusuarioRoutes } from '../modulos/Superusuario/router';
import { performanceRoutes } from '../modulos/Performance/router';
import adminRoutes from '../modulos/Admin/router';
import classesRoutes from '../modulos/Classes/router';
import { attendanceRoutes } from '../modulos/Attendance/router';

const routes: Array<RouteRecordRaw> = [
  // Rutas públicas (sin requerir autenticación)
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../views/UnauthorizedView.vue'),
    meta: { public: true },
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
      permission: 'edit_enrollment',
    },
  },
  {
    path: '/teachers/:id/edit',
    name: 'TeacherEdit',
    component: () => import('../modulos/Teachers/view/TeacherEditView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teachers',
      permission: 'edit',
    },
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
      permission: 'view_all',
    },
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
      permission: 'view_detail',
    },
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
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher'],
    },
  },
  // {
  //   path: '/teacher/attendance',
  //   redirect: '/teacher/attendance/calendar',
  //   meta: {
  //     // requiresAuth: true,
  //     // requiresRBAC: true,
  //     // moduleKey: "attendance",
  //     // permission: "teacher_view",
  //   },
  // },
  
  // 🎯 NUEVA RUTA: Sistema de Calendario de Asistencias Limpio
  // {
  //   path: '/teacher/attendance/new-calendar',
  //   name: 'NewTeacherAttendanceCalendar', 
  //   component: () => import('../modulos/Attendance/views/TeacherAttendanceDashboard.vue'),
  //   props: { mode: 'new-calendar' },
  //   meta: {
  //     requiresAuth: true,
  //     requiresRBAC: true,
  //     moduleKey: 'attendance',
  //     permission: 'teacher_calendar',
  //     title: 'Nuevo Calendario de Asistencias',
  //     description: 'Sistema de calendario limpio y optimizado',
  //   },
  // },
  // {
  //   path: '/teacher/attendance/:date?/:classId?',
  //   name: 'TeacherAttendanceDetail',
  //   component: () => import('../modulos/Attendance/views/AttendanceFormView.vue'),
  //   props: true,
  //   meta: {
  //     requiresAuth: true,
  //     requiresRBAC: true,
  //     moduleKey: 'attendance',
  //     permission: 'teacher_detail',
  //   },
  // },
  {
    path: '/teacher/schedule',
    name: 'TeacherSchedule',
    component: () => import('../modulos/Schedules/view/TeacherScheduleView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'schedule',
      permission: 'teacher_view',
    },
  },
  {
    path: '/teacher/profile',
    name: 'TeacherProfile',
    component: () => import('../modulos/Teachers/view/teacher/TeacherProfileView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'teacher_profile',
      permission: 'view',
    },
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
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher'],
    },
  },

  // Rutas de asistencia (RBAC)
  // {
  //   path: '/attendance/:date/:classId',
  //   name: 'attendance',
  //   component: () => import('../modulos/Attendance/components/AttendanceList.vue'),
  //   // component: () => import('../modulos/Attendance/views/AttendanceFormView.vue'),
  //   props: true,
  //   meta: {
  //     requiresAuth: true,
  //     requiresRBAC: true,
  //     moduleKey: 'attendance',
  //     permission: 'view_detail',
  //   },
  // },
  // {
  //   path: '/attendance/:date(\d{8})',
  //   name: 'AttendanceActivities',
  //   // component: () => import('../modulos/Attendance/views/AttendanceActivitiesView.vue'),
  //   component: () => import('../modulos/Attendance/components/AttendanceList.vue'),
  //   // component: () => import('../modulos/Attendance/views/AttendanceFormView.vue'),
  //   meta: {
  //     requiresAuth: true,
  //     requiresRBAC: true,
  //     moduleKey: 'attendance',
  //     permission: 'view_activities',
  //   },
  // },
  // {
  //   path: '/attendance/:date(\d{8})/:classId',
  //   name: 'AttendanceDetail',
  //   component: () => import('../modulos/Attendance/views/AttendanceView.vue'),
  //   props: true,
  //   meta: {
  //     requiresAuth: true,
  //     requiresRBAC: true,
  //     moduleKey: 'attendance',
  //     permission: 'view_detail',
  //   },
  // },
  // {
  //   path: '/attendance/calendar',
  //   name: 'AttendanceCalendar',
  //   component: () => import('../modulos/Attendance/views/ClassSelectionView.vue'),
  //   meta: {
  //     requiresAuth: true,
  //     requiresRBAC: true,
  //     moduleKey: 'attendance',
  //     permission: 'calendar',
  //   },
  // },
  {
    path: '/attendance/informe',
    name: 'AttendanceReport',
    component: () => import('../components/reports/attendance/TeacherInformeAttendance.vue'),
    props: (route) => ({ teacherId: route.query.teacherId }),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'report',
    },
  },
  {
    path: '/teacher/attendance/informe',
    name: 'TeacherInformeAttendance',
    component: () => import('../components/reports/attendance/TeacherInformeAttendance.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'teacher_report',
    },
  },

  // Rutas administrativas (RBAC)
  {
    path: '/dashboard',
    name: 'AdminHomeView',
    component: () => import('../modulos/Admin/views/SuperAdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'dashboard',
      permission: 'view',
    },
  },
  {
    path: '/admin/reporteSemanal',
    name: 'AdminReporteSemanal',
    component: () => import('../modulos/Teachers/view/admin/AdminReporteSemanal.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'reports',
      permission: 'admin_view',
    },
  },
  {
    path: '/admin/reports',
    name: 'AdminReportsCenter',
    component: () => import('../components/reports/ReportsCenter.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      // moduleKey: "reports",
      moduleKey: 'dashboard',
      permission: 'admin_view',
    },
  },
  {
    path: '/admin/notifications',
    name: 'AdminNotifications',
    component: () => import('../views/AdminNotificationsView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'dashboard',
      permission: 'admin_view',
    },
  },
  {
    path: '/admin/asistencia-diaria',
    name: 'ReporteAsistenciaDiaria',
    component: () => import('../modulos/Attendance/views/ReporteAsistenciaDiaria.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'attendance',
      permission: 'admin_view',
      allowedRoles: ['Superusuario', 'Director', 'Admin'],
    },
  },
  {
    path: '/monitoring',
    name: 'DailyMonitoring',
    component: () => import('../views/DailyMonitoringView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'monitoring',
      permission: 'view',
    },
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../analytics/components/AnalyticsDashboard.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'analytics',
      permission: 'view',
    },
  },

  // Rutas de estudiantes (RBAC)
  {
    path: '/students',
    name: 'Students',
    component: () => import('../modulos/Students/view/StudentsView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'view_all',
    },
  },
  {
    path: '/students/new',
    name: 'NewStudent',
    component: () => import('../modulos/Students/view/NewStudentView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'create',
    },
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
      permission: 'view_detail',
    },
  },
  {
    path: '/students/:studentId/instrumento/:instrumentId',
    name: 'StudentInstrumentProfile',
    component: () => import('../modulos/Students/view/StudentInstrumentProfile.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'view_instrument',
    },
  },
  {
    path: '/students/edit/:id',
    name: 'StudentEditById',
    component: () => import('../modulos/Students/view/StudentEditView.vue'),
    props: (route) => ({ id: route.params.id }),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'students',
      permission: 'edit',
    },
  },

  // Demo de Notificaciones de Asistencia (Solo Admin/Director)
  {
    path: '/admin/attendance-notifications-demo',
    name: 'AttendanceNotificationsDemo',
    component: () => import('../components/demo/AttendanceNotificationDemo.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'admin',
      permission: 'system_demo',
      allowedRoles: ['Admin', 'Director', 'SuperAdmin'],
    },
  },

  // Probador de Escalación de Inasistencias (Solo Admin/Director)
  {
    path: '/admin/escalation-tester',
    name: 'EscalationTester',
    component: () => import('../components/demo/EscalationTester.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'admin',
      permission: 'system_demo',
      allowedRoles: ['Admin', 'Director', 'SuperAdmin'],
    },
  },

  // Sistema de Plantillas de Mensajes (Solo Admin/Director)
  {
    path: '/admin/templates',
    name: 'TemplateManager',
    component: () => import('../components/templates/TemplateManager.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'admin',
      permission: 'template_management',
      allowedRoles: ['Admin', 'Director', 'SuperAdmin'],
    },
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
      permission: 'view',
    },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('../modulos/Schedules/view/ScheduleView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'schedule',
      permission: 'admin_view',
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'profile',
      permission: 'view',
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'settings',
      permission: 'view',
    },
  },

  // Ruta temporal para probar el Footer Navigation del Superusuario
  {
    path: '/test-footer-navigation',
    name: 'TestFooterNavigation',
    component: () => import('../components/FooterNavigationTest.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Superusuario'],
      title: 'Test Footer Navigation',
    },
  },

  // Ruta temporal para test de RBAC/Firestore (solo para desarrollo)
  {
    path: '/rbac-test',
    name: 'RBACTest',
    component: () => import('../pages/RBACTest.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Superusuario', 'Admin'],
      title: 'Test RBAC Firestore',
    },
  },

  // Incluir rutas de módulos especializados
  ...instrumentsRoutes,
  ...studentRoutes,
  ...montajeRoutes,
  ...superusuarioRoutes,
  ...performanceRoutes,
  ...attendanceRoutes,
  ...adminRoutes,
  ...classesRoutes,

  // Rutas de testing y desarrollo
  {
    path: '/testing/branding',
    name: 'BrandingTest',
    component: () => import('../views/testing/BrandingTestView.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Superusuario', 'Admin'],
      title: 'Pruebas de Branding',
    },
  },
  // 🧪 RUTA DE TESTING: Nuevo Sistema de Calendario
  {
    path: '/testing/new-attendance-calendar',
    name: 'TestNewAttendanceCalendar',
    component: () => import('../modulos/Attendance/views/TeacherAttendanceDashboard.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['Superusuario', 'Admin', 'Maestro', 'maestro', 'teacher', 'Teacher'],
      title: 'Test: Nuevo Calendario de Asistencias',
      description: 'Pruebas del sistema limpio de calendario',
    },
  },
  // 🧪 RUTA DE TESTING: Menú de Pruebas
  {
    path: '/test-menu',
    name: 'TestMenu',
    component: () => import('../views/TestMenuView.vue'),
    meta: {
      requiresAuth: true,
      // Temporalmente accesible para todos los roles autenticados.
      // En producción, se asignará al rol de superusuario.
      // allowedRoles: ['Superusuario'], 
      title: 'Menú de Pruebas',
    },
  },
  // Ruta inicial: redirige según el rol
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeRedirect.vue'),
    meta: { requiresAuth: true },
  },
  // Ruta de fallback
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/ErrorView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de autenticación y RBAC
router.beforeEach(async (to, from, next) => {
  // Lazy import store to avoid early initialization
  const { useAuthStore } = await import('@/stores/auth');
  const authStore = useAuthStore();

  console.log('🛡️ [Router] Navegando a:', to.path);
  console.log('🛡️ [Router] Usuario:', authStore.user?.role);

  // Permitir rutas públicas
  if (to.meta.public) {
    console.log('🛡️ [Router] Ruta pública, permitir');
    return next();
  }

  // Esperar a que la autenticación esté inicializada antes de tomar decisiones
  if (!authStore.isInitialized) {
    console.log('🛡️ [Router] Auth no inicializada, esperando...');
    try {
      await authStore.checkAuth();
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
    }
  }

  // Verificar autenticación
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    console.log('🛡️ [Router] No autenticado, redirigir a login');
    return next('/login');
  }

  // Evitar redirección infinita
  if (to.path === '/login' && authStore.isLoggedIn) {
    console.log('🛡️ [Router] Ya autenticado, evitar login');
    return next('/');
  }

  // 🔄 NUEVA FUNCIONALIDAD: Redirección basada en roles para usuarios admin
  // Este guard redirige automáticamente a usuarios admin a rutas de admin
  if (authStore.isLoggedIn && authStore.user) {
    console.log('🔄 [Router] Verificando redirección de roles...');
    try {
      const wasRedirected = await roleBasedRedirectGuard(to, from, next);
      // Si roleBasedRedirectGuard realizó una redirección, terminar aquí
      if (wasRedirected) {
        console.log('🔄 [Router] Redirección realizada, terminando');
        return; // El guard ya manejó la redirección
      }
      console.log('🔄 [Router] No se realizó redirección, continuando');
    } catch (error) {
      console.error('Error en role-based redirect guard:', error);
      // Continuar con la navegación normal si hay error
    }
  }

  // Verificación RBAC para rutas que lo requieran
  if (to.meta.requiresRBAC && to.meta.moduleKey && to.meta.permission) {
    console.log('🛡️ [Router] Verificando RBAC...');
    try {
      await rbacGuard(to, from, next);
      return; // rbacGuard ya maneja el next()
    } catch (error) {
      console.error('Error en RBAC guard:', error);
      return next('/dashboard');
    }
  }

  // Verificación legacy de allowedRoles (para rutas que aún no se han migrado)
  if (to.meta.allowedRoles && Array.isArray(to.meta.allowedRoles)) {
    console.log('🛡️ [Router] Verificando allowedRoles...');
    const userRole = authStore.user?.role?.toLowerCase();
    const allowedRoles = to.meta.allowedRoles.map((r) => r.toLowerCase());
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next('/dashboard');
    }
  }
  // Guard de navegación RBAC configurable (nuevo sistema)
  // Solo aplicar si la ruta no tiene configuración legacy específica
  if (!to.meta.requiresRBAC && !to.meta.allowedRoles) {
    console.log('🛡️ [Router] Verificando navigation guard...');
    try {
      await navigationGuard(to, from, next);
      return; // navigationGuard ya maneja el next()
    } catch (error) {
      console.error('Error en navigation guard:', error);
      // En caso de error, permitir continuar con verificación básica
    }
  }

  console.log('🛡️ [Router] Navegación permitida a:', to.path);
  next();
});

export default router;
