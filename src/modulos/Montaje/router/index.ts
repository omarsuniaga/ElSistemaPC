import type { RouteRecordRaw } from 'vue-router'

const montajeRoutes: RouteRecordRaw[] = [
  // Ruta principal del módulo montaje
  {
    path: '/montaje',
    name: 'Montaje',
    component: () => import('../views/MontajeView.vue'),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      allowedRoles: ['Maestro', 'maestro', 'Director', 'Admin', 'Administrador'],
      title: 'Gestión de Montaje'
    }
  },
  // Ruta independiente para el detalle de obra
  {
    path: '/montaje/obras/:id',
    name: 'MontajeObraDetail',
    component: () => import('../views/ObraDetailView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      allowedRoles: ['Maestro', 'maestro', 'Director', 'Admin', 'Administrador'],
      title: 'Detalle de Obra'
    }
  },
  // Ruta para el detalle de plan
  {
    path: '/montaje/planes/:id',
    name: 'MontajePlanDetail',
    component: () => import('../views/PlanDetailView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      allowedRoles: ['Maestro', 'maestro', 'Director', 'Admin', 'Administrador'],
      title: 'Detalle de Plan'
    }
  },
  // Panel específico para maestros
  {
    path: '/montaje/maestro',
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
  },  // Panel específico para directores
  {
    path: '/montaje/director',
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

export default montajeRoutes
