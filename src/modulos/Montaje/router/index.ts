import { type RouteRecordRaw } from 'vue-router';

import MontajeDashboard from '../components/MontajeDashboard.vue';

// Views (vistas principales)
import WorkDetail from '../views/WorkDetail.vue';
import InstrumentDetail from '../views/InstrumentDetail.vue';
import EvaluationsView from '../views/EvaluationsView.vue';
import WeeklyEvaluationsView from '../views/WeeklyEvaluationsView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';

// Nuevas vistas para progreso por instrumento con RBAC
import InstrumentProgressView from '../views/InstrumentProgressView.vue';
import DirectorDashboardView from '../views/DirectorDashboardView.vue';

// Componentes funcionales
import MusicalTools from '../components/MusicalTools.vue';
import InteractiveCalendar from '../components/InteractiveCalendar.vue';
import PermissionsManager from '../components/PermissionsManager.vue';
import UsersApp from '../components/users/UsersApp.vue';

// Rutas del módulo Montaje para integración en el proyecto principal
const montajeRoutes: RouteRecordRaw[] = [
  {
    path: '/montaje',
    component: MontajeDashboard,
    meta: {
      title: 'Sistema Musical',
      // requiresAuth: true,
      // moduleKey: 'montaje',
      // permission: 'access',
      // allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher', 'Admin', 'Director', 'Superusuario'],
    },
    children: [
      // Dashboard principal
      {
        path: '',
        name: 'montaje-dashboard',
        component: MontajeDashboard,
        meta: { title: 'Dashboard Musical', moduleKey: 'montaje', permission: 'access' },
      },

      // Gestión de obras musicales
      {
        path: 'works',
        name: 'montaje-works-list',
        component: MontajeDashboard, // Lista de obras
        meta: { title: 'Lista de Obras', moduleKey: 'montaje', permission: 'works_read' },
      },
      {
        path: 'works/create',
        name: 'montaje-work-create',
        component: MontajeDashboard, // Crear obra
        meta: { title: 'Nueva Obra', moduleKey: 'montaje', permission: 'works_create' },
      },
      {
        path: 'works/:id',
        name: 'montaje-work-detail',
        component: WorkDetail,
        props: true,
        meta: { title: 'Detalle de Obra', moduleKey: 'montaje', permission: 'works_read' },
      },
      {
        path: 'works/:id/edit',
        name: 'montaje-work-edit',
        component: WorkDetail, // Modo edición
        props: true,
        meta: { title: 'Editar Obra', moduleKey: 'montaje', permission: 'works_edit' },
      },

      // Instrumentos
      {
        path: 'works/:workId/instruments/:instrumentId',
        name: 'montaje-instrument-detail',
        component: InstrumentDetail,
        props: true,
        meta: { title: 'Detalle de Instrumento', moduleKey: 'montaje', permission: 'works_read' },
      },
      
      // Progreso por instrumento (RBAC)
      {
        path: 'works/:id/instrument-progress',
        name: 'montaje-instrument-progress',
        component: InstrumentProgressView,
        props: true,
        meta: { 
          title: 'Progreso por Instrumento', 
          moduleKey: 'montaje', 
          permission: 'instrument_progress_view',
        },
      },
      
      // Dashboard para directores (RBAC)
      {
        path: 'works/:id/director-dashboard',
        name: 'montaje-director-dashboard',
        component: DirectorDashboardView,
        props: true,
        meta: { 
          title: 'Dashboard de Director', 
          moduleKey: 'montaje', 
          permission: 'view_aggregated_reports', 
        },
      },

      // Evaluaciones
      {
        path: 'evaluations',
        name: 'montaje-evaluations-list',
        component: EvaluationsView,
        meta: { title: 'Todas las Evaluaciones', moduleKey: 'montaje', permission: 'evaluations_read' },
      },
      {
        path: 'works/:id/evaluations',
        name: 'montaje-work-evaluations',
        component: EvaluationsView,
        props: true,
        meta: { title: 'Evaluaciones de Obra', moduleKey: 'montaje', permission: 'evaluations_read' },
      },
      {
        path: 'works/:id/weekly-evaluations',
        name: 'montaje-weekly-evaluations',
        component: WeeklyEvaluationsView,
        props: true,
        meta: { title: 'Evaluaciones Semanales', moduleKey: 'montaje', permission: 'evaluations_read' },
      },

      // Analytics y reportes
      {
        path: 'analytics',
        name: 'montaje-analytics-general',
        component: AnalyticsView,
        meta: { title: 'Analytics Generales', moduleKey: 'montaje', permission: 'reports_read' },
      },
      {
        path: 'works/:id/analytics',
        name: 'montaje-work-analytics',
        component: AnalyticsView,
        props: true,
        meta: { title: 'Analytics de Obra', moduleKey: 'montaje', permission: 'reports_read' },
      },

      // Herramientas musicales
      {
        path: 'tools',
        name: 'montaje-musical-tools',
        component: MusicalTools,
        meta: { title: 'Herramientas Musicales', moduleKey: 'montaje', permission: 'read' },
      },
      {
        path: 'tools/metronome',
        name: 'montaje-metronome',
        component: MusicalTools, // Vista específica del metrónomo
        meta: { title: 'Metrónomo', moduleKey: 'montaje', permission: 'read' },
      },
      {
        path: 'tools/tuner',
        name: 'montaje-tuner',
        component: MusicalTools, // Vista específica del afinador
        meta: { title: 'Afinador', moduleKey: 'montaje', permission: 'read' },
      },

      // Calendario y sesiones
      {
        path: 'calendar',
        name: 'montaje-calendar',
        component: InteractiveCalendar,
        meta: { title: 'Calendario', moduleKey: 'montaje', permission: 'read' },
      },
      {
        path: 'sessions',
        name: 'montaje-sessions-list',
        component: InteractiveCalendar, // Lista de sesiones
        meta: { title: 'Sesiones Programadas', moduleKey: 'montaje', permission: 'read' },
      },

      // Gestión de usuarios
      {
        path: 'users',
        name: 'montaje-users-management',
        component: UsersApp,
        meta: { title: 'Gestión de Usuarios', moduleKey: 'montaje', permission: 'users_access' },
        children: [
          {
            path: '',
            name: 'montaje-users-list',
            component: UsersApp,
            meta: { title: 'Lista de Usuarios', moduleKey: 'montaje', permission: 'users_read' },
          },
          {
            path: 'create',
            name: 'montaje-user-create',
            component: UsersApp,
            meta: { title: 'Crear Usuario', moduleKey: 'montaje', permission: 'users_manage' },
          },
          {
            path: ':userId',
            name: 'montaje-user-detail',
            component: UsersApp,
            props: true,
            meta: { title: 'Detalle de Usuario', moduleKey: 'montaje', permission: 'users_read' },
          },
          {
            path: ':userId/edit',
            name: 'montaje-user-edit',
            component: UsersApp,
            props: true,
            meta: { title: 'Editar Usuario', moduleKey: 'montaje', permission: 'users_manage' },
          },
        ],
      },

      // Configuraciones y permisos
      {
        path: 'settings',
        name: 'montaje-settings',
        component: PermissionsManager,
        meta: { title: 'Configuraciones', moduleKey: 'montaje', permission: 'read' },
      },
      {
        path: 'permissions',
        name: 'montaje-permissions',
        component: PermissionsManager,
        meta: { title: 'Gestión de Permisos', moduleKey: 'montaje', permission: 'users_manage' },
      },

      // Perfil de usuario
      {
        path: 'profile',
        name: 'montaje-user-profile',
        component: UsersApp, // Vista de perfil
        meta: { title: 'Mi Perfil', moduleKey: 'montaje', permission: 'access' },
      },
    ],
  },
  // Rutas específicas para el flujo de Montaje del Maestro
  {
    path: '/maestro/montaje/obras',
    name: 'MaestroMontajeObras',
    component: () => import('../views/MaestroMontajeView.vue'),
    meta: {
      title: 'Gestión de Obras (Maestro)',
      requiresAuth: true,
      moduleKey: 'montaje',
      permission: 'maestro_access',
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher'],
    },
  },
  {
    path: '/maestro/montaje/obras/:obraId',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetailView.vue'),
    props: true,
    meta: {
      title: 'Detalle de Obra (Maestro)',
      requiresAuth: true,
      moduleKey: 'montaje',
      permission: 'maestro_access',
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher'],
    },
  },
  {
    path: '/maestro/montaje/obras/:obraId/compases/:instrumentoId',
    name: 'MeasureManager',
    component: () => import('../views/MeasureManagerView.vue'),
    props: true,
    meta: {
      title: 'Gestión de Compases (Maestro)',
      requiresAuth: true,
      moduleKey: 'montaje',
      permission: 'maestro_access',
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher'],
    },
  },
  {
    path: '/maestro/montaje/settings/classroom',
    name: 'MaestroClassroomSettings',
    component: () => import('../views/teacher/ClassroomSettingsView.vue'),
    meta: {
      title: 'Configuración de Aula (Maestro)',
      requiresAuth: true,
      moduleKey: 'montaje',
      permission: 'maestro_access', // O un permiso más específico como 'classroom_settings_manage'
      allowedRoles: ['Maestro', 'maestro', 'teacher', 'Teacher'],
    },
  },
];

export default montajeRoutes;