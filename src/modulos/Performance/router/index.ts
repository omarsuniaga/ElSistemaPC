import {RouteRecordRaw} from "vue-router"

export const performanceRoutes: RouteRecordRaw[] = [
  {
    path: "/students/:id/performance",
    name: "StudentPerformanceDetail",
    component: () => import("../view/StudentPerformanceDetailView.vue"),
    meta: {
      title: "Análisis de Rendimiento",
      requiresAuth: true,
    },
    props: true,
  },
  {
    path: "/students/:id/recommendations",
    name: "StudentRecommendations",
    component: () => import("../view/StudentRecommendationsView.vue"),
    meta: {
      title: "Recomendaciones",
      requiresAuth: true,
    },
    props: true,
  },
  {
    path: "/performance/dashboard",
    name: "PerformanceDashboard",
    component: () => import("../components/PerformanceDashboard.vue"),
    meta: {
      title: "Dashboard de Rendimiento",
      requiresAuth: true,
    },
  },
  {
    path: "/performance/director-dashboard",
    name: "DirectorPerformanceDashboard",
    component: () => import("../components/DirectorPerformanceDashboard.vue"),
    meta: {
      title: "Dashboard Director",
      requiresAuth: true,
    },
  },
]
