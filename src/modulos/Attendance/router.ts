// src/modulos/Attendance/router.ts
import { RouteRecordRaw } from 'vue-router';

const attendanceRoutes: Array<RouteRecordRaw> = [
  {
    path: "/teacher/attendance",
    redirect: "/teacher/attendance/calendar",
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "teacher_view",
    },
  },
  {
    path: "/teacher/attendance/calendar",
    name: "TeacherAttendanceCalendar",
    component: () => import("./views/TeacherAttendanceDashboard.vue"),
    props: {mode: "calendar"},
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "teacher_calendar",
    },
  },
  {
    path: "/teacher/attendance/:date?/:classId?",
    name: "TeacherAttendanceDetail",
    component: () => import("./views/AttendanceFormView.vue"),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "teacher_detail",
    },
  },
  {
    path: "/attendance/:date/:classId",
    name: "attendance",
    component: () => import("./components/AttendanceList.vue"),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "view_detail",
    },
  },
  {
    path: "/attendance/:date(\\d{8})",
    name: "AttendanceActivities",
    component: () => import("./views/AttendanceActivitiesView.vue"),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "view_activities",
    },
  },
  {
    path: "/attendance/:date(\\d{8})/:classId",
    name: "AttendanceDetail",
    component: () => import("./views/AttendanceView.vue"),
    props: true,
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "view_detail",
    },
  },
  {
    path: "/attendance/calendar",
    name: "AttendanceCalendar",
    component: () => import("./views/ClassSelectionView.vue"),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "calendar",
    },
  },
  {
    path: "/attendance/informe",
    name: "AttendanceReport",
    component: () => import("./components/TeacherInformeAttendance.vue"),
    props: (route) => ({teacherId: route.query.teacherId}),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "report",
    },
  },
  {
    path: "/teacher/attendance/informe",
    name: "TeacherInformeAttendance",
    component: () => import("./components/TeacherInformeAttendance.vue"),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "teacher_report",
    },
  },
  {
    path: "/admin/asistencia-diaria",
    name: "ReporteAsistenciaDiaria",
    component: () => import("./views/ReporteAsistenciaDiaria.vue"),
    meta: {
      requiresAuth: true,
      requiresRBAC: true,
      moduleKey: "attendance",
      permission: "admin_view",
      allowedRoles: ["Superusuario", "Director", "Admin"],
    },
  },
];

export { attendanceRoutes };
export default attendanceRoutes;