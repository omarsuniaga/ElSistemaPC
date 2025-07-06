
// src/modulos/Classes/router.ts
import { RouteRecordRaw } from 'vue-router';

const classesRoutes: Array<RouteRecordRaw> = [
  {
    path: "/classes",
    name: "Classes",
    component: () => import("./views/ClassesView.vue"), // Ruta actualizada
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "classes",
      permission: "view_all",
    },
  },
  {
    path: "/classes/:id",
    name: "ClassDetail",
    component: () => import("./view/ClassDetailView.vue"),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "classes",
      permission: "view_detail",
    },
  },
  {
    path: "/classes/:id/edit",
    name: "EditClass",
    component: () => import("./view/ClassDetailView.vue"), // Asumo que es la misma vista
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "classes",
      permission: "edit",
    },
  },
  {
    path: "/student-schedule-demo",
    name: "StudentScheduleDemo",
    component: () => import("./components/StudentScheduleDemo.vue"),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "classes",
      permission: "view_schedule",
    },
  },
   {
    path: "/teacher/classes",
    name: "TeacherClasses",
    component: () => import("./components/TeacherClassesDashboard.vue"),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "classes",
      permission: "teacher_view",
    },
  },
   {
    path: "/teacher/class/:id",
    name: "TeacherClassDetail",
    component: () => import("../Teachers/view/teacher/ClassDetailView.vue"),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "classes",
      permission: "teacher_view_detail",
    },
  },
];

export default classesRoutes;
