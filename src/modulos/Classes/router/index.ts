// src/modulos/Classes/router/index.ts
import type { RouteRecordRaw } from 'vue-router';

/**
 * Rutas para el módulo de Clases
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/classes',
    name: 'Classes',
    component: () => import('../view/ClassesView.vue'),
    meta: {
      title: 'Clases',
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'view_all',
    },
  },
  {
    path: '/classes/new',
    name: 'NewClass',
    component: () => import('../view/NewClassView.vue'),
    meta: {
      title: 'Nueva Clase',
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'create',
    },
  },
  {
    path: '/classes/:id',
    name: 'ClassDetail',
    component: () => import('../view/ClassDetailView.vue'),
    props: true,
    meta: {
      title: 'Detalle de Clase',
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: 'classes',
      permission: 'view',
    },
  },
];

/**
 * Crea y devuelve las rutas del módulo de Clases
 */
export function createRouter(): RouteRecordRaw[] {
  return routes;
}

export default routes;
