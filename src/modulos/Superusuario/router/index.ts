// src/modulos/Superusuario/router/index.ts

import {RouteRecordRaw} from "vue-router"

export const superusuarioRoutes: RouteRecordRaw[] = [
  {
    path: "/superusuario",
    name: "SuperusuarioBase",
    redirect: "/superusuario/dashboard",
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
    },
  },
  {
    path: "/superusuario/dashboard",
    name: "SuperusuarioDashboard",
    component: () => import("../views/SuperusuarioDashboard.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Panel de Superusuario",
    },
  },
  {
    path: "/superusuario/roles",
    name: "SuperusuarioRoles",
    component: () => import("../components/ConfigurarRoles.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Configuración de Roles",
    },
  },
  {
    path: "/superusuario/permissions",
    name: "SuperusuarioPermissions",
    component: () => import("../views/SuperusuarioDashboard.vue"), // Reusar dashboard por ahora
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Gestión de Permisos",
    },
  },
  {
    path: "/superusuario/rbac",
    name: "SuperusuarioRBAC",
    component: () => import("../views/RBACManagement.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Gestión de Roles y Permisos (RBAC)",
    },
  },
  {
    path: "/superusuario/rbac-admin",
    name: "SuperusuarioRBACAdmin",
    component: () => import("../components/RBACAdminPanel.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Panel de Administración RBAC",
    },
  },
  {
    path: "/superusuario/navigation",
    name: "SuperusuarioNavigation",
    component: () => import("../views/NavigationManagement.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Gestión de Navegación",
    },
  },
  {
    path: "/superusuario/users",
    name: "SuperusuarioUsers",
    component: () => import("../views/GestionUsuarios.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Gestión de Usuarios",
    },
  },
  {
    path: "/superusuario/system",
    name: "SuperusuarioSystem",
    component: () => import("../views/GestionModulos.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Configuración del Sistema",
    },
  },
  {
    path: "/superusuario/audit",
    name: "SuperusuarioAudit",
    component: () => import("../views/AuditoriaView.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Auditoría del Sistema",
    },
  },
  {
    path: "/superusuario/backup",
    name: "SuperusuarioBackup",
    component: () => import("../views/SuperusuarioDashboard.vue"), // Reusar dashboard por ahora
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Respaldo y Restauración",
    },
  },
  {
    path: "/superusuario/branding",
    name: "SuperusuarioBranding",
    component: () => import("../../../components/admin/BrandingManager.vue"),
    meta: {
      requiresAuth: true,
      allowedRoles: ["Superusuario"],
      title: "Configuración de Marca",
    },
  },
]

export default superusuarioRoutes
