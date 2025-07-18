import { RouteRecordRaw } from 'vue-router';

export const studentRoutes: RouteRecordRaw[] = [
  {
    path: '/students',
    name: 'Students',
    component: () => import('../view/StudentsView.vue'),
    meta: { title: 'Estudiantes' },
  },
  {
    path: '/students/new',
    name: 'StudentNew',
    component: () => import('../view/StudentNewView.vue'),
    meta: { title: 'Nuevo Estudiante' },
  },
  {
    path: '/students/:id',
    name: 'StudentProfile',
    component: () => import('../view/StudentProfileView.vue'),
    meta: { title: 'Perfil de Estudiante' },
    props: true,
  },
  {
    path: '/students/edit/:id',
    name: 'StudentEdit',
    component: () => import('../view/StudentEditView.vue'),
    meta: { title: 'Editar Estudiante' },
    props: true,
  },
  {
    path: '/students/delete/:id',
    name: 'StudentDelete',
    component: () => import('../view/StudentDeleteView.vue'),
    meta: { title: 'Eliminar Estudiante' },
    props: true,
  },
  {
    path: '/students/riesgo/:id',
    name: 'atRiskStudents',
    component: () => import('../view/AtRiskStudentsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/student/schedule/:id',
    name: 'studentSchedule',
    component: () => import('../view/StudentScheduleView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/classes/:classId/add-student',
    name: 'AddStudentToClass',
    component: () => import('../view/AddStudentToClassView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: ['Director', 'Admin', 'Maestro'],
      title: 'Añadir Estudiante a Clase',
    },
  },
];

export default studentRoutes;
