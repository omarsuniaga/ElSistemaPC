// src/guards/navigationGuard.ts

import {NavigationGuardNext, RouteLocationNormalized} from "vue-router"
import {useAuthStore} from "@/stores/auth"
import {NavigationService} from "@/services/navigation/navigationService"

/**
 * Guard de navegación que verifica si el usuario puede acceder a una ruta específica
 * basado en la configuración RBAC de navegación
 */
export const navigationGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()
  const navigationService = NavigationService.getInstance()

  try {
    // Verificar si el usuario está autenticado
    if (!authStore.user) {
      console.warn("🚫 Usuario no autenticado, redirigiendo a login")
      next("/login")
      return
    }

    // Rutas que siempre están permitidas (públicas/sistema)
    const alwaysAllowedRoutes = ["/login", "/logout", "/unauthorized", "/error", "/404"]

    if (alwaysAllowedRoutes.includes(to.path)) {
      next()
      return
    }

    // Verificar acceso basado en configuración RBAC
    const canAccess = await navigationService.canAccessRoute(to.path)

    if (canAccess) {
      console.log(`✅ Acceso permitido a ${to.path} para rol ${authStore.user.role}`)
      next()
    } else {
      console.warn(`🚫 Acceso denegado a ${to.path} para rol ${authStore.user.role}`)

      // Redirigir a página de no autorizado o dashboard por defecto
      const redirectPath = getDefaultRouteForRole(authStore.user.role)
      next(redirectPath)
    }
  } catch (error) {
    console.error("Error en guard de navegación:", error)

    // En caso de error, permitir acceso a rutas básicas según el rol
    const fallbackRoute = getDefaultRouteForRole(authStore.user?.role || "")
    next(fallbackRoute)
  }
}

/**
 * Obtener ruta por defecto según el rol del usuario
 */
function getDefaultRouteForRole(userRole: string): string {
  const defaultRoutes: Record<string, string> = {
    Superusuario: "/superusuario/dashboard",
    Admin: "/dashboard",
    Director: "/dashboard",
    Maestro: "/dashboard",
    "Maestro Avanzado": "/dashboard",
  }

  return defaultRoutes[userRole] || "/dashboard"
}

/**
 * Guard simplificado para verificar solo roles específicos
 */
export const roleGuard = (allowedRoles: string[]) => {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore()

    if (!authStore.user) {
      next("/login")
      return
    }

    if (allowedRoles.includes(authStore.user.role)) {
      next()
    } else {
      console.warn(
        `🚫 Acceso denegado por rol. Requerido: ${allowedRoles.join(", ")}, Usuario: ${authStore.user.role}`
      )
      next("/unauthorized")
    }
  }
}

/**
 * Guard específico para superusuario
 */
export const superuserGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()

  if (!authStore.user) {
    next("/login")
    return
  }

  if (authStore.user.role === "Superusuario") {
    next()
  } else {
    console.warn(`🚫 Acceso denegado a área de superusuario. Usuario: ${authStore.user.role}`)
    next("/unauthorized")
  }
}
