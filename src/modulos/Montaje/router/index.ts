import { type RouteRecordRaw } from "vue-router"

import MontajeDashboard from "../components/MontajeDashboard.vue"

// Views (vistas principales)
import WorkDetail from "../views/WorkDetail.vue"
import InstrumentDetail from "../views/InstrumentDetail.vue"
import EvaluationsView from "../views/EvaluationsView.vue"
import WeeklyEvaluationsView from "../views/WeeklyEvaluationsView.vue"
import AnalyticsView from "../views/AnalyticsView.vue"

// Componentes funcionales
import MusicalTools from "../components/MusicalTools.vue"
import InteractiveCalendar from "../components/InteractiveCalendar.vue"
import PermissionsManager from "../components/PermissionsManager.vue"
import UsersApp from "../components/users/UsersApp.vue"

// Rutas del módulo Montaje para integración en el proyecto principal
const montajeRoutes: RouteRecordRaw[] = [
  {
    path: "/montaje",
    component: MontajeDashboard,
    meta: {
      title: "Sistema Musical",
      permissions: ["montaje:access"],
      requiresAuth: true,
    },
    children: [
      // Dashboard principal
      {
        path: "",
        name: "montaje-dashboard",
        component: MontajeDashboard,
        meta: { title: "Dashboard Musical", permissions: ["montaje:access"] },
      },

      // Gestión de obras musicales
      {
        path: "works",
        name: "montaje-works-list",
        component: MontajeDashboard, // Lista de obras
        meta: { title: "Lista de Obras", permissions: ["works:read"] },
      },
      {
        path: "works/create",
        name: "montaje-work-create",
        component: MontajeDashboard, // Crear obra
        meta: { title: "Nueva Obra", permissions: ["works:create"] },
      },
      {
        path: "works/:id",
        name: "montaje-work-detail",
        component: WorkDetail,
        props: true,
        meta: { title: "Detalle de Obra", permissions: ["works:read"] },
      },
      {
        path: "works/:id/edit",
        name: "montaje-work-edit",
        component: WorkDetail, // Modo edición
        props: true,
        meta: { title: "Editar Obra", permissions: ["works:edit"] },
      },

      // Instrumentos
      {
        path: "works/:workId/instruments/:instrumentId",
        name: "montaje-instrument-detail",
        component: InstrumentDetail,
        props: true,
        meta: { title: "Detalle de Instrumento", permissions: ["works:read"] },
      },

      // Evaluaciones
      {
        path: "evaluations",
        name: "montaje-evaluations-list",
        component: EvaluationsView,
        meta: { title: "Todas las Evaluaciones", permissions: ["evaluations:read"] },
      },
      {
        path: "works/:id/evaluations",
        name: "montaje-work-evaluations",
        component: EvaluationsView,
        props: true,
        meta: { title: "Evaluaciones de Obra", permissions: ["evaluations:read"] },
      },
      {
        path: "works/:id/weekly-evaluations",
        name: "montaje-weekly-evaluations",
        component: WeeklyEvaluationsView,
        props: true,
        meta: { title: "Evaluaciones Semanales", permissions: ["evaluations:read"] },
      },

      // Analytics y reportes
      {
        path: "analytics",
        name: "montaje-analytics-general",
        component: AnalyticsView,
        meta: { title: "Analytics Generales", permissions: ["reports:read"] },
      },
      {
        path: "works/:id/analytics",
        name: "montaje-work-analytics",
        component: AnalyticsView,
        props: true,
        meta: { title: "Analytics de Obra", permissions: ["reports:read"] },
      },

      // Herramientas musicales
      {
        path: "tools",
        name: "montaje-musical-tools",
        component: MusicalTools,
        meta: { title: "Herramientas Musicales", permissions: ["montaje:read"] },
      },
      {
        path: "tools/metronome",
        name: "montaje-metronome",
        component: MusicalTools, // Vista específica del metrónomo
        meta: { title: "Metrónomo", permissions: ["montaje:read"] },
      },
      {
        path: "tools/tuner",
        name: "montaje-tuner",
        component: MusicalTools, // Vista específica del afinador
        meta: { title: "Afinador", permissions: ["montaje:read"] },
      },

      // Calendario y sesiones
      {
        path: "calendar",
        name: "montaje-calendar",
        component: InteractiveCalendar,
        meta: { title: "Calendario", permissions: ["montaje:read"] },
      },
      {
        path: "sessions",
        name: "montaje-sessions-list",
        component: InteractiveCalendar, // Lista de sesiones
        meta: { title: "Sesiones Programadas", permissions: ["montaje:read"] },
      },

      // Gestión de usuarios
      {
        path: "users",
        name: "montaje-users-management",
        component: UsersApp,
        meta: { title: "Gestión de Usuarios", permissions: ["users:access"] },
        children: [
          {
            path: "",
            name: "montaje-users-list",
            component: UsersApp,
            meta: { title: "Lista de Usuarios", permissions: ["users:read"] },
          },
          {
            path: "create",
            name: "montaje-user-create",
            component: UsersApp,
            meta: { title: "Crear Usuario", permissions: ["users:manage"] },
          },
          {
            path: ":userId",
            name: "montaje-user-detail",
            component: UsersApp,
            props: true,
            meta: { title: "Detalle de Usuario", permissions: ["users:read"] },
          },
          {
            path: ":userId/edit",
            name: "montaje-user-edit",
            component: UsersApp,
            props: true,
            meta: { title: "Editar Usuario", permissions: ["users:manage"] },
          },
        ],
      },

      // Configuraciones y permisos
      {
        path: "settings",
        name: "montaje-settings",
        component: PermissionsManager,
        meta: { title: "Configuraciones", permissions: ["montaje:read"] },
      },
      {
        path: "permissions",
        name: "montaje-permissions",
        component: PermissionsManager,
        meta: { title: "Gestión de Permisos", permissions: ["users:manage"] },
      },

      // Perfil de usuario
      {
        path: "profile",
        name: "montaje-user-profile",
        component: UsersApp, // Vista de perfil
        meta: { title: "Mi Perfil", permissions: ["montaje:access"] },
      },
    ],
  },
]

export default montajeRoutes