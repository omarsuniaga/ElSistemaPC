// src/modulos/Teachers/router/teacher.ts
import { RouteRecordRaw } from 'vue-router'
import TeachersLayout from '@/modulos/Teachers/view/layout/TeachersLayout.vue'

const teacherRoutes: Array<RouteRecordRaw> = [
  {
    path: '/teachers',
    component: TeachersLayout,
    children: [
      {
        path: '',
        redirect: { name: 'TeacherHome' }
      },
      {
        path: 'home',
        name: 'TeacherHome',
        component: () => import('@/modulos/Teachers/view/teacher/TeacherHomeView.vue'),
        meta: { roles: ['Maestro', 'Teacher'] }
      },
      {
        path: 'admin',
        name: 'TeacherAdmin',
        component: () => import('@/modulos/Teachers/view/admin/TeacherAdminView.vue'),
        meta: { roles: ['Director', 'Admin'] }
      },
      {
        path: ':id/edit',
        name: 'TeacherEdit',
        component: () => import('@/modulos/Teachers/view/TeacherEditView.vue'),
        meta: { roles: ['Director', 'Admin'] }
      },
      {
        path: ':id/edit-enrollment',
        name: 'TeacherEditEnrollment',
        component: () => import('@/modulos/Teachers/view/TeacherEditEnrollmentView.vue'),
        meta: { roles: ['Director', 'Admin', 'Maestro', 'Teacher'] }
      }
    ]
  }
]

export default teacherRoutes
