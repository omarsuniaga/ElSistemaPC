/* --------------------------------------------------------------
 * modulos/attendance/router/attendanceRoutes.ts
 * --------------------------------------------------------------
 * Rutas propias del módulo Attendance, exportadas para ser inyectadas
 * en src/router/index.ts.
 *
 *  Admin/Director → AdminHome.vue
 *  Maestro         → TeacherHome.vue
 * -------------------------------------------------------------- */
import type { RouteRecordRaw } from 'vue-router'

export const attendanceRoutes: RouteRecordRaw[] = [
  /* Maestro */
  {
    path: '/teacher/attendance',
    redirect: '/teacher/attendance/calendar',
    meta: { requiresAuth: true, allowedRoles: ['Maestro'] },
  },
  {
    path: '/teacher/attendance/calendar',
    name: 'TeacherAttendanceCalendar',
    component: () => import('../views/teacher/TeacherHome.vue'),
    meta: { requiresAuth: true, allowedRoles: ['Maestro'] },
  },
  {
    path: '/teacher/attendance/:date(\\d{8})?/:classId?',
    name: 'TeacherAttendanceDetail',
    component: () => import('../views/teacher/TeacherHome.vue'),
    props: true,
    meta: { requiresAuth: true, allowedRoles: ['Maestro'] },
  },

  /* Admin/Director */
  {
    path: '/attendance',
    redirect: '/attendance/calendar',
    meta: { requiresAuth: true, allowedRoles: ['Director', 'Admin'] },
  },
  {
    path: '/attendance/calendar',
    name: 'AdminAttendanceCalendar',
    component: () => import('../views/admin/AdminHome.vue'),
    meta: { requiresAuth: true, allowedRoles: ['Director', 'Admin'] },
  },
  {
    path: '/attendance/:date(\\d{8})?/:classId?',
    name: 'AdminAttendanceDetail',
    component: () => import('../views/admin/AdminHome.vue'),
    props: true,
    meta: { requiresAuth: true, allowedRoles: ['Director', 'Admin'] },
  },
]
