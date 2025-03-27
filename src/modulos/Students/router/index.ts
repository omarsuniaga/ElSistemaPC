import { RouteRecordRaw } from 'vue-router'

export const studentRoutes: RouteRecordRaw[] = [
  {
    path: '/students',
    name: 'Students',
    component: () => import('../view/StudentsView.vue'),
    meta: { title: 'Estudiantes' }
  },
  {
    path: '/students/new',
    name: 'StudentNew',
    component: () => import('../view/StudentNewView.vue'),
    meta: { title: 'Nuevo Estudiante' }
  },
  {
    path: '/students/:id',
    name: 'StudentProfile',
    component: () => import('../view/StudentProfileView.vue'),
    meta: { title: 'Perfil de Estudiante' },
    props: true
  },
  {
    path: '/students/:id/edit',
    name: 'StudentEdit',
    component: () => import('../view/StudentEditView.vue'),
    meta: { title: 'Editar Estudiante' },
    props: true
  },
  {
    path: '/students/:id/delete',
    name: 'StudentDelete',
    component: () => import('../view/StudentDeleteView.vue'),
    meta: { title: 'Eliminar Estudiante' },
    props: true
  },
  {
    path: '/at-risk-students',
    name: 'atRiskStudents',
    component: () => import('../view/AtRiskStudentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/student-schedule/:id',
    name: 'studentSchedule',
    component: () => import('../view/StudentScheduleView.vue'),
    meta: { requiresAuth: true }
  }
]

export default studentRoutes