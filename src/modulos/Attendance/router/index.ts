/**
 * 🚀 CONFIGURACIÓN DE RUTAS - MÓDULO DE ASISTENCIA OPTIMIZADA
 * Sistema de navegación mejorado con lazy loading y guards
 */
import type {RouteRecordRaw} from "vue-router"

/**
 * 🎯 Rutas principales del módulo de Asistencia
 */
export const attendanceRoutes: RouteRecordRaw[] = [
  {
    path: "/attendance",
    name: "AttendanceModule",
    component: () => import("../views/AttendanceViewOptimized.vue"),
    meta: {
      title: "Gestión de Asistencia",
      requiresAuth: true,
      module: "attendance",
      permissions: ["attendance:read"],
      breadcrumb: [
        {name: "Inicio", to: "/"},
        {name: "Asistencia", to: "/attendance"},
      ],
    },
    children: [
      // Vista principal optimizada
      {
        path: "",
        name: "AttendanceMain",
        component: () => import("../views/AttendanceViewOptimized.vue"),
        meta: {
          title: "Panel de Asistencia",
          description: "Gestión integral de asistencia de estudiantes",
        },
      },

      // Vista de calendario optimizado
      {
        path: "calendar",
        name: "AttendanceCalendar",
        component: () => import("../components/AttendanceCalendarOptimized.vue"),
        meta: {
          title: "Calendario de Asistencia",
          description: "Navegación por fechas y visualización de actividad",
        },
      },

      // Vista de calendario profesional
      {
        path: "professional-calendar",
        name: "ProfessionalCalendar",
        component: () => import("../views/ProfessionalCalendarView.vue"),
        meta: {
          title: "Calendario Profesional",
          description: "Calendario avanzado con datos reales e integración completa",
          permissions: ["attendance:read"],
        },
      },

      // Vista de lista de asistencia
      {
        path: "list/:date/:classId",
        name: "AttendanceList",
        component: () => import("../components/AttendanceListOptimized.vue"),
        props: (route) => ({
          selectedDate: route.params.date,
          selectedClass: route.params.classId,
          showDebugInfo: route.query.debug === "true",
        }),
        meta: {
          title: "Lista de Asistencia",
          description: "Registro y gestión de asistencia por clase",
          breadcrumb: [
            {name: "Inicio", to: "/"},
            {name: "Asistencia", to: "/attendance"},
            {name: "Lista", to: ""},
          ],
        },
      },

      // Vista de reportes
      {
        path: "reports",
        name: "AttendanceReports",
        component: () => import("../views/AttendanceReportsView.vue"),
        meta: {
          title: "Reportes de Asistencia",
          description: "Análisis y estadísticas de asistencia",
          permissions: ["attendance:reports"],
        },
      },

      // Vista de configuración
      {
        path: "settings",
        name: "AttendanceSettings",
        component: () => import("../views/AttendanceSettingsView.vue"),
        meta: {
          title: "Configuración de Asistencia",
          description: "Ajustes y preferencias del módulo",
          permissions: ["attendance:admin"],
        },
      },
    ],
  },
]

/**
 * 🎨 Configuración de navegación para el módulo
 */
export const attendanceNavigation = {
  main: {
    title: "Asistencia",
    icon: "UserGroupIcon",
    to: "/attendance",
    description: "Gestión de asistencia de estudiantes",
  },

  quickActions: [
    {
      title: "Registrar Hoy",
      icon: "CalendarIcon",
      to: "/attendance?date=today",
      description: "Acceso rápido a clases de hoy",
    },
    {
      title: "Ver Reportes",
      icon: "ChartBarIcon",
      to: "/attendance/reports",
      description: "Estadísticas y análisis",
    },
    {
      title: "Calendario",
      icon: "CalendarDaysIcon",
      to: "/attendance/calendar",
      description: "Navegación por fechas",
    },
    {
      title: "Calendario Pro",
      icon: "SparklesIcon",
      to: "/attendance/professional-calendar",
      description: "Calendario profesional con datos reales",
    },
  ],

  breadcrumbs: {
    "/attendance": [
      {name: "Inicio", to: "/"},
      {name: "Asistencia", to: "/attendance"},
    ],
    "/attendance/calendar": [
      {name: "Inicio", to: "/"},
      {name: "Asistencia", to: "/attendance"},
      {name: "Calendario", to: "/attendance/calendar"},
    ],
    "/attendance/professional-calendar": [
      {name: "Inicio", to: "/"},
      {name: "Asistencia", to: "/attendance"},
      {name: "Calendario Pro", to: "/attendance/professional-calendar"},
    ],
    "/attendance/reports": [
      {name: "Inicio", to: "/"},
      {name: "Asistencia", to: "/attendance"},
      {name: "Reportes", to: "/attendance/reports"},
    ],
  },
}

/**
 * 🔒 Guards de navegación
 */
export const attendanceGuards = {
  // Verificar permisos antes de acceder
  beforeEnter: (to: any, from: any, next: any) => {
    // TODO: Implementar verificación de permisos
    const userPermissions = ["attendance:read"] // Obtener de store de auth
    const routePermissions = to.meta?.permissions || []

    const hasPermission = routePermissions.every((permission: string) =>
      userPermissions.includes(permission)
    )

    if (hasPermission) {
      next()
    } else {
      next({name: "Unauthorized"})
    }
  },

  // Validar parámetros de fecha y clase
  beforeRouteUpdate: (to: any, from: any, next: any) => {
    if (to.name === "AttendanceList") {
      const {date, classId} = to.params

      // Validar formato de fecha
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      if (!isValidDate) {
        next({name: "AttendanceMain"})
        return
      }

      // Validar que classId no esté vacío
      if (!classId || classId.trim() === "") {
        next({name: "AttendanceMain"})
        return
      }
    }

    next()
  },
}

/**
 * 📱 Meta información para PWA
 */
export const attendancePWAConfig = {
  shortcuts: [
    {
      name: "Asistencia Hoy",
      short_name: "Hoy",
      description: "Registrar asistencia de hoy",
      url: "/attendance?date=today",
      icons: [{src: "/icons/attendance-today-192.png", sizes: "192x192"}],
    },
    {
      name: "Reportes",
      short_name: "Reportes",
      description: "Ver reportes de asistencia",
      url: "/attendance/reports",
      icons: [{src: "/icons/attendance-reports-192.png", sizes: "192x192"}],
    },
  ],

  categories: ["education", "productivity"],

  navigation_scope: "/attendance/",

  share_target: {
    action: "/attendance/import",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url",
      files: [
        {
          name: "attendance_file",
          accept: ["text/csv", ".xlsx", ".xls"],
        },
      ],
    },
  },
}

/**
 * 🎯 Configuración de analytics para el módulo
 */
export const attendanceAnalytics = {
  events: {
    attendance_view_opened: "Vista de asistencia abierta",
    attendance_recorded: "Asistencia registrada",
    attendance_report_generated: "Reporte generado",
    attendance_bulk_update: "Actualización masiva",
    attendance_calendar_navigated: "Navegación en calendario",
  },

  tracking: {
    pageViews: true,
    interactions: true,
    performance: true,
    errors: true,
  },
}

/**
 * 🚀 Exportación unificada
 */
export default {
  routes: attendanceRoutes,
  navigation: attendanceNavigation,
  guards: attendanceGuards,
  pwa: attendancePWAConfig,
  analytics: attendanceAnalytics,
}
