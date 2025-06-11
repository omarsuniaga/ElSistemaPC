import type { RouteRecordRaw } from 'vue-router'

const montajeRoutes: RouteRecordRaw[] = [
  {
    path: '/montaje',
    name: 'Montaje',
    component: () => import('../views/MontajeView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      allowedRoles: ['Maestro', 'maestro', 'Director', 'Admin', 'Administrador'],
      title: 'Gestión de Montaje'
    },
    children: [
      {
        path: '',
        name: 'MontajeOverview',
        component: () => import('../views/MontajeView.vue'),
        meta: {
          title: 'Resumen de Montaje'
        }
      },
      {
        path: 'obras',
        name: 'MontajeObras',
        component: () => import('../views/MontajeView.vue'),
        meta: {
          title: 'Gestión de Obras'
        }
      },
      {
        path: 'obras/:id',
        name: 'MontajeObraDetail',
        component: () => import('../views/ObraDetailView.vue'),
        meta: {
          title: 'Detalle de Obra'
        }
      },
      {
        path: 'repertorio',
        name: 'MontajeRepertorio',
        component: () => import('../views/RepertoireView.vue'),
        meta: {
          title: 'Gestión de Repertorio'
        }
      },
      {
        path: 'planes',
        name: 'MontajePlanes',
        component: () => import('../views/PlansView.vue'),
        meta: {
          title: 'Planes de Montaje'
        }
      },
      {
        path: 'planes/:id',
        name: 'MontajePlanDetail',
        component: () => import('../views/PlanDetailView.vue'),
        meta: {
          title: 'Detalle de Plan'
        }
      },
      {
        path: 'analytics',
        name: 'MontajeAnalytics',
        component: () => import('../views/AnalyticsView.vue'),
        meta: {
          title: 'Análisis y Métricas',
          requiresRBAC: true,
          allowedRoles: ['Director', 'Admin', 'Administrador']
        }
      },
      {
        path: 'collaboration',
        name: 'MontajeCollaboration',
        component: () => import('../views/CollaborationView.vue'),
        meta: {
          title: 'Centro de Colaboración'
        }
      },
      {
        path: 'history',
        name: 'MontajeHistory',
        component: () => import('../views/HistoryView.vue'),
        meta: {
          title: 'Historial y Versiones'
        }
      },
      {
        path: 'maestro',
        name: 'MaestroMontaje',
        component: () => import('../views/MaestroMontajeView.vue'),
        meta: {
          requiresAuth: true,
          requiresRBAC: true,
          allowedRoles: ['Maestro', 'maestro', 'Teacher', 'teacher'],
          title: 'Panel de Maestro - Montaje',
          moduleKey: 'montaje',
          permission: 'maestro_view'
        }
      },
      {
        path: 'director',
        name: 'DirectorMontaje',
        component: () => import('../views/DirectorMontajeView.vue'),
        meta: {
          requiresAuth: true,
          requiresRBAC: true,
          allowedRoles: ['Director', 'Admin', 'Administrador'],
          title: 'Panel de Director - Montaje',
          moduleKey: 'montaje',
          permission: 'director_view'
        }
      }
    ]
  }
]

export default montajeRoutes
