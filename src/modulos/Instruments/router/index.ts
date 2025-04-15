import { RouteRecordRaw } from 'vue-router';

export const instrumentsRoutes: RouteRecordRaw[] = [
  {
    path: '/instrumentos',
    name: 'InstrumentList',
    component: () => import('../view/InstrumentManagement.vue'),
    meta: { requiresAuth: true, title: 'Inventario de Instrumentos' }
  },
  {
    path: '/instrumentos/nuevo',
    name: 'InstrumentCreate',
    component: () => import('../view/InstrumentCrudView.vue'),
    meta: { requiresAuth: true, title: 'Registrar Instrumento' }
  },
  {
    path: '/instrumentos/editar/:id',
    name: 'InstrumentEdit',
    component: () => import('../view/InstrumentCrudView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Editar Instrumento' }
  },
  {
    path: '/instrumentos/detalle/:id',
    name: 'InstrumentDetail',
    component: () => import('../view/InstrumentDetailView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Detalle de Instrumento' }
  },
  {
    path: '/instrumentos/asignar/:id',
    name: 'InstrumentAssign',
    component: () => import('../view/InstrumentAssignView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Asignar Instrumento' }
  },
  {
    path: '/instrumentos/galeria/:id',
    name: 'InstrumentGallery',
    component: () => import('../view/InstrumentGalleryView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Galería de Instrumento' }
  }
];
