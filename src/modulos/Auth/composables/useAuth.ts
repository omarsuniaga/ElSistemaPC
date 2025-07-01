// src/modulos/Auth/composables/useAuth.ts

import {computed} from "vue"
import {useAuthStore} from "@/stores/auth"

/**
 * Composable para gestión de autenticación
 * Proporciona una interfaz reactiva sobre el store de autenticación
 */
export function useAuth() {
  const authStore = useAuthStore()

  return {
    // Usuario actual
    user: computed(() => authStore.user),

    // Estados de autenticación
    isLoggedIn: computed(() => authStore.isLoggedIn),
    isLoading: computed(() => authStore.isLoading),
    isInitialized: computed(() => authStore.isInitialized),

    // Roles y permisos
    isTeacher: computed(() => authStore.isTeacher),
    isAdmin: computed(() => authStore.isAdmin),
    isDirector: computed(() => authStore.isDirector),
    isSuperusuario: computed(() => authStore.isSuperusuario),

    // Métodos de autenticación
    login: authStore.login,
    logout: authStore.logout,
    checkAuth: authStore.checkAuth,

    // Estado de error
    error: computed(() => authStore.error),
    clearError: authStore.clearError,

    // Notificaciones
    notifications: computed(() => authStore.notifications),
    addNotification: authStore.addNotification,
    removeNotification: authStore.removeNotification,
  }
}
