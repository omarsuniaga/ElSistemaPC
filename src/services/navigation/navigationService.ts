// src/services/navigation/navigationService.ts

import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { RBACPersistenceService } from '@/services/rbac/rbacPersistenceService'
import type { NavigationItem } from '@/services/rbac/rbacPersistenceService'

export interface NavigationMenuItem {
  id: string
  name: string
  path: string
  icon: string
  isActive: boolean
  order: number
  children?: NavigationMenuItem[]
}

export class NavigationService {
  private static instance: NavigationService
  private navigationConfig = ref<NavigationItem[]>([])
  
  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService()
    }
    return NavigationService.instance
  }

  /**
   * Cargar configuración de navegación
   */
  async loadNavigationConfig(): Promise<void> {
    try {
      const config = await RBACPersistenceService.getNavigationConfig()
      this.navigationConfig.value = config
    } catch (error) {
      console.error('Error cargando configuración de navegación:', error)
    }
  }

  /**
   * Obtener navegación para un rol específico
   */
  getNavigationForRole(userRole: string): NavigationItem[] {
    return this.navigationConfig.value.filter(item => 
      item.isActive && item.roles.includes(userRole)
    ).sort((a, b) => a.order - b.order)
  }
  /**
   * Obtener menú de navegación para el usuario actual
   */
  async getNavigationForCurrentUser(): Promise<NavigationMenuItem[]> {
    const authStore = useAuthStore()
    const currentUser = authStore.user
    
    if (!currentUser?.role) {
      console.warn('No hay usuario autenticado o sin rol definido')
      return []
    }

    try {
      // Cargar configuración de navegación si no está cargada
      if (this.navigationConfig.value.length === 0) {
        await this.loadNavigationConfig()
      }

      // Obtener navegación permitida para el rol del usuario
      const allowedNavigation = this.getNavigationForRole(currentUser.role)
      
      // Convertir a formato de menú
      const menuItems: NavigationMenuItem[] = allowedNavigation.map(item => ({
        id: item.id,
        name: item.name,
        path: item.path,
        icon: item.icon,
        isActive: item.isActive,
        order: item.order
      }))

      console.log(`🧭 Navegación cargada para rol ${currentUser.role}:`, menuItems.length, 'elementos')
      return menuItems.sort((a, b) => a.order - b.order)
      
    } catch (error) {
      console.error('Error obteniendo navegación para usuario:', error)
      return this.getFallbackNavigation(currentUser.role)
    }
  }

  /**
   * Verificar si el usuario actual puede acceder a una ruta específica
   */
  async canAccessRoute(routePath: string): Promise<boolean> {
    const authStore = useAuthStore()
    const currentUser = authStore.user
    
    if (!currentUser?.role) {
      return false
    }    // Roles administrativos siempre tienen acceso completo
    if (['Superusuario', 'Admin'].includes(currentUser.role)) {
      return true
    }

    try {
      // Cargar configuración si no está disponible
      if (this.navigationConfig.value.length === 0) {
        await this.loadNavigationConfig()
      }

      // Verificar si la ruta está permitida para el rol
      const allowedNavigation = this.getNavigationForRole(currentUser.role)
      return allowedNavigation.some(item => item.path === routePath)
      
    } catch (error) {
      console.error('Error verificando acceso a ruta:', error)
      return false
    }
  }

  /**
   * Obtener navegación de respaldo según el rol
   */
  private getFallbackNavigation(userRole: string): NavigationMenuItem[] {
    const fallbackMenus: Record<string, NavigationMenuItem[]> = {      'Maestro': [
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: '🏠', isActive: true, order: 1 },
        { id: 'clases', name: 'Mis Clases', path: '/clases', icon: '📚', isActive: true, order: 2 },
        { id: 'estudiantes', name: 'Estudiantes', path: '/students', icon: '🎓', isActive: true, order: 3 },
        { id: 'asistencia', name: 'Asistencia', path: '/asistencia', icon: '✅', isActive: true, order: 4 }
      ],'Maestro Avanzado': [
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: '🏠', isActive: true, order: 1 },
        { id: 'clases', name: 'Mis Clases', path: '/clases', icon: '📚', isActive: true, order: 2 },
        { id: 'estudiantes', name: 'Estudiantes', path: '/students', icon: '🎓', isActive: true, order: 3 },
        { id: 'asistencia', name: 'Asistencia', path: '/asistencia', icon: '✅', isActive: true, order: 4 }
      ],      'Director': [
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: '🏠', isActive: true, order: 1 },
        { id: 'estudiantes', name: 'Estudiantes', path: '/students', icon: '🎓', isActive: true, order: 2 },
        { id: 'maestros', name: 'Maestros', path: '/maestros', icon: '👨‍🏫', isActive: true, order: 3 },
        { id: 'clases', name: 'Clases', path: '/clases', icon: '📚', isActive: true, order: 4 },
        { id: 'reportes', name: 'Reportes', path: '/reportes', icon: '📊', isActive: true, order: 5 }
      ],
      'Admin': [
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: '🏠', isActive: true, order: 1 },
        { id: 'usuarios', name: 'Usuarios', path: '/usuarios', icon: '👥', isActive: true, order: 2 },
        { id: 'sistema', name: 'Sistema', path: '/sistema', icon: '⚙️', isActive: true, order: 3 },
        { id: 'configuracion', name: 'Configuración', path: '/configuracion', icon: '🛠️', isActive: true, order: 4 }
      ],
      'Superusuario': [
        { id: 'super-dashboard', name: 'Super Dashboard', path: '/superusuario/dashboard', icon: '🚀', isActive: true, order: 1 },
        { id: 'rbac', name: 'Gestión RBAC', path: '/superusuario/rbac', icon: '🔐', isActive: true, order: 2 },
        { id: 'navigation', name: 'Config. Navegación', path: '/superusuario/navigation', icon: '🧭', isActive: true, order: 3 }
      ]
    }

    return fallbackMenus[userRole] || []
  }
  /**
   * Actualizar configuración de navegación (solo para superusuarios)
   */
  async updateNavigationConfig(updates: Partial<NavigationItem>[], updatedBy: string): Promise<void> {
    const authStore = useAuthStore()
    const currentUser = authStore.user
    
    if (currentUser?.role !== 'Superusuario') {
      throw new Error('Solo los superusuarios pueden modificar la configuración de navegación')
    }

    try {
      // Actualizar elementos de navegación
      updates.forEach(update => {
        const existingItem = this.navigationConfig.value.find((item: NavigationItem) => item.id === update.id)
        if (existingItem && update.id) {
          Object.assign(existingItem, update)
        }
      })
      
      // Guardar cambios usando el servicio de persistencia
      await RBACPersistenceService.saveNavigationConfig(this.navigationConfig.value, updatedBy)
      
      console.log('✅ Configuración de navegación actualizada')
    } catch (error) {
      console.error('Error actualizando configuración de navegación:', error)
      throw error
    }
  }

  /**
   * Obtener todas las rutas disponibles para configuración
   */
  getAllAvailableRoutes(): { path: string; name: string; description: string }[] {
    return [      { path: '/dashboard', name: 'Dashboard', description: 'Panel principal del usuario' },
      { path: '/teacher', name: 'Dashboard Maestro', description: 'Panel principal para maestros' },
      { path: '/clases', name: 'Clases', description: 'Gestión de clases' },
      { path: '/students', name: 'Estudiantes', description: 'Gestión de estudiantes' },
      { path: '/maestros', name: 'Maestros', description: 'Gestión de maestros' },
      { path: '/asistencia', name: 'Asistencia', description: 'Control de asistencia' },
      { path: '/teacher/attendance', name: 'Asistencia Maestro', description: 'Control de asistencia para maestros' },
      { path: '/reportes', name: 'Reportes', description: 'Reportes y estadísticas' },
      { path: '/usuarios', name: 'Usuarios', description: 'Gestión de usuarios del sistema' },
      { path: '/sistema', name: 'Sistema', description: 'Configuración del sistema' },
      { path: '/configuracion', name: 'Configuración', description: 'Configuraciones generales' },
      { path: '/superusuario/dashboard', name: 'Super Dashboard', description: 'Panel de superusuario' },
      { path: '/superusuario/rbac', name: 'Gestión RBAC', description: 'Control de roles y permisos' },
      { path: '/superusuario/navigation', name: 'Config. Navegación', description: 'Configuración de menús' }
    ]
  }
}

// Composable para uso en componentes Vue
export function useNavigation() {
  const navigationService = NavigationService.getInstance()
  const navigationItems = ref<NavigationMenuItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadNavigation = async () => {
    try {
      loading.value = true
      error.value = null
      navigationItems.value = await navigationService.getNavigationForCurrentUser()
    } catch (err) {
      error.value = 'Error cargando navegación'
      console.error('Error loading navigation:', err)
    } finally {
      loading.value = false
    }
  }

  const canAccess = async (routePath: string): Promise<boolean> => {
    try {
      return await navigationService.canAccessRoute(routePath)
    } catch (err) {
      console.error('Error checking route access:', err)
      return false
    }
  }

  const isActiveRoute = computed(() => (routePath: string) => {
    return navigationItems.value.some(item => item.path === routePath && item.isActive)
  })

  return {
    navigationItems,
    loading,
    error,
    loadNavigation,
    canAccess,
    isActiveRoute
  }
}
