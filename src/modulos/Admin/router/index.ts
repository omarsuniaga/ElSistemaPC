import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'AdminModule',
    component: () => import('../views/SuperAdminDashboard.vue'),
    meta: {
      title: 'Super Admin Dashboard',
      requiresAuth: true,
      permissions: {
        module: 'admin',
        action: 'view_dashboard'
      }
    }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboard.vue'),
    meta: {
      title: 'Dashboard Administrativo',
      requiresAuth: true,
      permissions: {
        module: 'admin',
        action: 'view_dashboard'
      }
    }
  },
  {
    path: '/admin/super',
    name: 'SuperAdminDashboard',
    component: () => import('../views/SuperAdminDashboard.vue'),
    meta: {
      title: 'Super Admin Dashboard',
      requiresAuth: true,
      permissions: {
        module: 'admin',
        action: 'super_admin'
      }
    }
  },
  {
    path: '/admin/students',
    name: 'AdminStudents',
    component: () => import('../views/AdminStudentsView.vue'),
    meta: {
      title: 'Gestión de Estudiantes',
      requiresAuth: true,
      permissions: {
        module: 'students',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/students/new',
    name: 'AdminStudentCreate',
    component: () => import('../views/AdminStudentCreateView.vue'),
    meta: {
      title: 'Crear Estudiante',
      requiresAuth: true,
      permissions: {
        module: 'students',
        action: 'create'
      }
    }
  },
  {
    path: '/admin/students/:id',
    name: 'AdminStudentDetail',
    component: () => import('../views/AdminStudentDetailView.vue'),
    props: true,
    meta: {
      title: 'Detalle de Estudiante',
      requiresAuth: true,
      permissions: {
        module: 'students',
        action: 'view'
      }
    }
  },
  {
    path: '/admin/teachers',
    name: 'AdminTeachers',
    component: () => import('../views/AdminTeachersView.vue'),
    meta: {
      title: 'Gestión de Maestros',
      requiresAuth: true,
      permissions: {
        module: 'teachers',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/teachers/new',
    name: 'AdminTeacherCreate',
    component: () => import('../views/AdminTeacherCreateView.vue'),
    meta: {
      title: 'Crear Maestro',
      requiresAuth: true,
      permissions: {
        module: 'teachers',
        action: 'create'
      }
    }
  },
  {
    path: '/admin/teachers/:id',
    name: 'AdminTeacherDetail',
    component: () => import('../views/AdminTeacherDetailView.vue'),
    props: true,
    meta: {
      title: 'Detalle de Maestro',
      requiresAuth: true,
      permissions: {
        module: 'teachers',
        action: 'view'
      }
    }
  },
  {
    path: '/admin/classes',
    name: 'AdminClasses',
    component: () => import('../views/AdminClassesView.vue'),
    meta: {
      title: 'Gestión de Clases',
      requiresAuth: true,
      permissions: {
        module: 'classes',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/classes/new',
    name: 'AdminClassCreate',
    component: () => import('../views/AdminClassCreateView.vue'),
    meta: {
      title: 'Crear Clase',
      requiresAuth: true,
      permissions: {
        module: 'classes',
        action: 'create'
      }
    }
  },
  {
    path: '/admin/classes/:id',
    name: 'AdminClassDetail',
    component: () => import('../views/AdminClassDetailView.vue'),
    props: true,
    meta: {
      title: 'Detalle de Clase',
      requiresAuth: true,
      permissions: {
        module: 'classes',
        action: 'view'
      }
    }
  },
  {
    path: '/admin/monitoring',
    name: 'AdminClassMonitoring',
    component: () => import('../views/AdminReportsView.vue'),
    meta: {
      title: 'Monitoreo de Clases - Panel Director',
      requiresAuth: true,
      permissions: {
        module: 'classes',
        action: 'monitor'
      }
    }
  },
  {
    path: '/admin/schedules',
    name: 'AdminSchedules',
    component: () => import('../views/AdminSchedulesView.vue'),
    meta: {
      title: 'Gestión de Horarios',
      requiresAuth: true,
      permissions: {
        module: 'schedules',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/schedules/new',
    name: 'AdminScheduleCreate',
    component: () => import('../views/AdminScheduleCreateView.vue'),
    meta: {
      title: 'Crear Horario',
      requiresAuth: true,
      permissions: {
        module: 'schedules',
        action: 'create'
      }
    }
  },
  {
    path: '/admin/schedules/:id',
    name: 'AdminScheduleDetail',
    component: () => import('../views/AdminScheduleDetailView.vue'),
    props: true,
    meta: {
      title: 'Detalle de Horario',
      requiresAuth: true,
      permissions: {
        module: 'schedules',
        action: 'view'
      }
    }
  },
  {
    path: '/admin/inventory',
    name: 'AdminInventory',
    component: () => import('../views/AdminInventoryView.vue'),
    meta: {
      title: 'Gestión de Inventario',
      requiresAuth: true,
      permissions: {
        module: 'inventory',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/inventory/new',
    name: 'AdminInventoryCreate',
    component: () => import('../views/AdminInventoryCreateView.vue'),
    meta: {
      title: 'Agregar Item al Inventario',
      requiresAuth: true,
      permissions: {
        module: 'inventory',
        action: 'create'
      }
    }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('../views/AdminReportsView.vue'),
    meta: {
      title: 'Reportes y Análisis',
      requiresAuth: true,
      permissions: {
        module: 'reports',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/reports/attendance',
    name: 'AdminReportsAttendance',
    component: () => import('../views/AdminReportsAttendanceView.vue'),
    meta: {
      title: 'Reporte de Asistencias',
      requiresAuth: true,
      permissions: {
        module: 'reports',
        action: 'view_attendance'
      }
    }
  },
  {
    path: '/admin/reports/performance',
    name: 'AdminReportsPerformance',
    component: () => import('../views/AdminReportsPerformanceView.vue'),
    meta: {
      title: 'Reporte de Rendimiento',
      requiresAuth: true,
      permissions: {
        module: 'reports',
        action: 'view_performance'
      }
    }
  },
  {
    path: '/admin/system',
    name: 'AdminSystem',
    component: () => import('../views/AdminSystemView.vue'),
    meta: {
      title: 'Administración del Sistema',
      requiresAuth: true,
      permissions: {
        module: 'system',
        action: 'view_admin'
      }
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/AdminUsersView.vue'),
    meta: {
      title: 'Gestión de Usuarios',
      requiresAuth: true,
      permissions: {
        module: 'users',
        action: 'view_all'
      }
    }
  },
  {
    path: '/admin/permissions',
    name: 'AdminPermissions',
    component: () => import('../views/AdminPermissionsView.vue'),
    meta: {
      title: 'Gestión de Permisos',
      requiresAuth: true,
      permissions: {
        module: 'permissions',
        action: 'view_all'
      }
    }
  }
]

export default adminRoutes
