// src/router/guards/roleBasedRedirect.ts

import {NavigationGuardNext, RouteLocationNormalized} from "vue-router"
import {useAuthStore} from "@/stores/auth"

/**
 * Mapeo de rutas generales a rutas específicas de admin
 * Cuando un admin accede a una ruta general, se redirige automáticamente
 * a la versión administrativa correspondiente
 */
const ADMIN_ROUTE_MAPPING: Record<string, string> = {
  "/classes": "/admin/classes",
  "/students": "/admin/students",
  "/teachers": "/admin/teachers",
  "/reports": "/admin/reports",
  "/schedules": "/admin/schedules",
  "/inventory": "/admin/inventory",
  "/system": "/admin/system",
  "/users": "/admin/users",
  "/permissions": "/admin/permissions",
  "/monitoring": "/admin/monitoring",
  "/analytics": "/admin/reports",
  "/whatsapp": "/admin/whatsapp",
}

/**
 * Roles que deben ser redirigidos automáticamente a rutas de admin
 */
const ADMIN_ROLES = ["Admin", "Director", "Superusuario"]

/**
 * Rutas que NO deben ser redirigidas (rutas compartidas o especiales)
 */
const EXCLUDED_FROM_REDIRECT = [
  "/dashboard",
  "/profile",
  "/settings",
  "/attendance", // Mantenemos las rutas de attendance como están
  "/teacher",
  "/admin",
]

/**
 * Guard que redirige automáticamente a usuarios admin
 * desde rutas generales a rutas específicas de admin
 */
export async function roleBasedRedirectGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<boolean> {
  const authStore = useAuthStore()
  const user = authStore.user

  console.log("🔄 [RoleRedirect] Ejecutando guard para:", to.path)
  console.log("🔄 [RoleRedirect] Usuario:", user)

  // Si no hay usuario, continuar sin redirección
  if (!user || !user.role) {
    console.log("🔄 [RoleRedirect] No hay usuario o rol, continuando")
    return false // No se realizó redirección
  }

  console.log("🔄 [RoleRedirect] Rol del usuario:", user.role)

  // Verificar si el usuario tiene rol de admin
  const isAdminRole = ADMIN_ROLES.includes(user.role)
  console.log("🔄 [RoleRedirect] ¿Es admin?", isAdminRole)

  // Si no es admin, continuar sin redirección
  if (!isAdminRole) {
    console.log("🔄 [RoleRedirect] No es admin, continuando sin redirección")
    return false // No se realizó redirección
  }

  // Verificar si la ruta actual debe ser redirigida
  const currentPath = to.path
  console.log("🔄 [RoleRedirect] Ruta actual:", currentPath)

  // No redirigir si ya está en una ruta de admin
  if (currentPath.startsWith("/admin/")) {
    console.log("🔄 [RoleRedirect] Ya está en ruta admin, no redirigir")
    return false // No se realizó redirección
  }

  // No redirigir rutas excluidas
  if (EXCLUDED_FROM_REDIRECT.some((excluded) => currentPath.startsWith(excluded))) {
    console.log("🔄 [RoleRedirect] Ruta excluida de redirección:", currentPath)
    return false // No se realizó redirección
  }

  // Buscar si existe una ruta de admin correspondiente
  const adminRoute = ADMIN_ROUTE_MAPPING[currentPath]
  console.log("🔄 [RoleRedirect] Ruta admin correspondiente:", adminRoute)

  if (adminRoute) {
    console.log(
      `🔄 [RoleRedirect] ✅ REDIRIGIENDO: ${currentPath} → ${adminRoute} (Rol: ${user.role})`
    )

    // Preservar query parameters y hash si existen
    const redirectLocation = {
      path: adminRoute,
      query: to.query,
      hash: to.hash,
    }

    next(redirectLocation)
    return true // Se realizó redirección
  }

  console.log("🔄 [RoleRedirect] No hay mapeo para esta ruta, continuando")
  // Si no hay mapeo específico, continuar sin redirección
  return false // No se realizó redirección
}

/**
 * Función auxiliar para verificar si una ruta debe usar la versión de admin
 */
export function shouldUseAdminRoute(userRole: string, routePath: string): boolean {
  return (
    ADMIN_ROLES.includes(userRole) &&
    Object.prototype.hasOwnProperty.call(ADMIN_ROUTE_MAPPING, routePath) &&
    !EXCLUDED_FROM_REDIRECT.some((excluded) => routePath.startsWith(excluded))
  )
}

/**
 * Función auxiliar para obtener la ruta de admin correspondiente
 */
export function getAdminRoute(routePath: string): string | null {
  return ADMIN_ROUTE_MAPPING[routePath] || null
}

/**
 * Función para verificar si un usuario puede acceder a rutas de admin
 */
export function canAccessAdminRoutes(userRole: string): boolean {
  return ADMIN_ROLES.includes(userRole)
}
