// src/composables/useRBACManagement.ts

import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { RBACPersistenceService, type NavigationItem } from '@/services/rbac/rbacPersistenceService'

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt?: any
  updatedAt?: any
}

export interface Permission {
  id: string
  name: string
  description: string
  module: string
  action: string
  resource: string
}

export function useRBACManagement() {
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const navigationConfig = ref<NavigationItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cargar roles desde Firestore usando persistencia
  const loadRoles = async () => {
    try {
      loading.value = true
      console.log('🔄 Cargando roles desde Firestore...')
      const savedRoles = await RBACPersistenceService.getRoles()
      roles.value = savedRoles
      console.log(`✅ ${savedRoles.length} roles cargados`)
    } catch (err) {
      error.value = 'Error al cargar roles'
      console.error('Error loading roles:', err)
    } finally {
      loading.value = false
    }
  }

  // Cargar permisos desde Firestore usando persistencia
  const loadPermissions = async () => {
    try {
      loading.value = true
      console.log('🔄 Cargando permisos desde Firestore...')
      const savedPermissions = await RBACPersistenceService.getPermissions()
      permissions.value = savedPermissions
      console.log(`✅ ${savedPermissions.length} permisos cargados`)
    } catch (err) {
      error.value = 'Error al cargar permisos'
      console.error('Error loading permissions:', err)
    } finally {
      loading.value = false
    }
  }

  // Cargar configuración de navegación
  const loadNavigationConfig = async () => {
    try {
      loading.value = true
      console.log('🔄 Cargando configuración de navegación desde Firestore...')
      const savedNavigation = await RBACPersistenceService.getNavigationConfig()
      navigationConfig.value = savedNavigation
      console.log(`✅ ${savedNavigation.length} elementos de navegación cargados`)
    } catch (err) {
      error.value = 'Error al cargar configuración de navegación'
      console.error('Error loading navigation config:', err)
    } finally {
      loading.value = false
    }
  }

  // Función para forzar la inicialización de datos RBAC usando persistencia
  const forceInitializeRBAC = async () => {
    try {
      loading.value = true
      console.log('🔄 Inicializando datos RBAC por defecto...')
      
      // Usar el servicio de persistencia para inicializar
      await RBACPersistenceService.initializeDefaultConfig('system-init')
      
      // Recargar todos los datos
      await loadPermissions()
      await loadRoles()
      await loadNavigationConfig()
      
      console.log('✅ Inicialización RBAC completada!')
    } catch (err) {
      error.value = 'Error al forzar inicialización RBAC'
      console.error('Error forcing RBAC initialization:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Función para guardar cambios en roles
  const saveRoles = async (updatedBy: string = 'system') => {
    try {
      loading.value = true
      console.log('💾 Guardando roles en Firestore...')
      await RBACPersistenceService.saveRoles(roles.value, updatedBy)
      console.log('✅ Roles guardados correctamente')
    } catch (err) {
      error.value = 'Error al guardar roles'
      console.error('Error saving roles:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Función para guardar cambios en permisos
  const savePermissions = async (updatedBy: string = 'system') => {
    try {
      loading.value = true
      console.log('💾 Guardando permisos en Firestore...')
      await RBACPersistenceService.savePermissions(permissions.value, updatedBy)
      console.log('✅ Permisos guardados correctamente')
    } catch (err) {
      error.value = 'Error al guardar permisos'
      console.error('Error saving permissions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Función para guardar configuración de navegación
  const saveNavigationConfig = async (updatedBy: string = 'system') => {
    try {
      loading.value = true
      console.log('💾 Guardando configuración de navegación en Firestore...')
      await RBACPersistenceService.saveNavigationConfig(navigationConfig.value, updatedBy)
      console.log('✅ Configuración de navegación guardada correctamente')
    } catch (err) {
      error.value = 'Error al guardar configuración de navegación'
      console.error('Error saving navigation config:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actualizar permiso específico de un maestro para ver estudiantes
  const updateTeacherStudentViewPermission = async (teacherId: string, canViewAll: boolean) => {
    try {
      loading.value = true
      console.log(`🔄 Actualizando permiso de estudiantes para maestro ${teacherId}...`)
      
      const authStore = useAuthStore()
      const currentUser = authStore.user
      
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      // Encontrar el rol del maestro y actualizarlo
      const teacherRole = roles.value.find(role => role.name === 'Maestro' || role.name === 'Maestro Avanzado')
      
      if (teacherRole) {
        const updatedPermissions = [...teacherRole.permissions]
        
        if (canViewAll) {
          // Agregar permiso para ver todos los estudiantes
          if (!updatedPermissions.includes('Ver Todos los Estudiantes')) {
            updatedPermissions.push('Ver Todos los Estudiantes')
          }
          // Remover permiso limitado si existe
          const limitedIndex = updatedPermissions.indexOf('Ver Estudiantes de Clases Propias')
          if (limitedIndex > -1) {
            updatedPermissions.splice(limitedIndex, 1)
          }
        } else {
          // Remover permiso de ver todos los estudiantes
          const allStudentsIndex = updatedPermissions.indexOf('Ver Todos los Estudiantes')
          if (allStudentsIndex > -1) {
            updatedPermissions.splice(allStudentsIndex, 1)
          }
          // Agregar permiso limitado si no existe
          if (!updatedPermissions.includes('Ver Estudiantes de Clases Propias')) {
            updatedPermissions.push('Ver Estudiantes de Clases Propias')
          }
        }

        // Actualizar el rol
        teacherRole.permissions = updatedPermissions
        await saveRoles(currentUser.uid)
      }
      
      console.log('✅ Permiso de estudiantes actualizado correctamente')
    } catch (err) {
      error.value = 'Error al actualizar permiso de estudiantes'
      console.error('Error updating teacher student view permission:', err)
      throw err
    } finally {
      loading.value = false
    }  
  }

  // Verificar si un maestro puede ver todos los estudiantes
  const getTeacherStudentViewPermission = async (teacherId: string): Promise<boolean> => {
    try {
      // Buscar en los roles si el maestro tiene el permiso
      const teacherRole = roles.value.find(role => role.name === 'Maestro' || role.name === 'Maestro Avanzado')
      const permissions = teacherRole?.permissions || []
      
      // Si tiene el permiso de ver todos los estudiantes, retornar true
      return permissions.includes('Ver Todos los Estudiantes')
    } catch (err) {
      console.error('Error getting teacher permissions:', err)
      return false
    }
  }

  // Verificar si un usuario tiene un permiso específico
  const hasPermission = (userRole: string, permissionName: string): boolean => {
    const role = roles.value.find(r => r.name.toLowerCase() === userRole.toLowerCase())
    return role ? role.permissions.includes(permissionName) : false
  }

  // Obtener configuración de navegación para un rol específico
  const getNavigationForRole = (userRole: string): NavigationItem[] => {
    return navigationConfig.value.filter(item => 
      item.isActive && item.roles.includes(userRole)
    ).sort((a, b) => a.order - b.order)
  }

  // Verificar si un usuario puede acceder a una ruta específica
  const canAccessRoute = (userRole: string, routePath: string): boolean => {
    const allowedNavigation = getNavigationForRole(userRole)
    return allowedNavigation.some(item => item.path === routePath)
  }

  // Actualizar configuración de navegación para un rol
  const updateNavigationForRole = async (roleName: string, updates: Partial<NavigationItem>[], updatedBy: string) => {
    try {
      loading.value = true
      console.log(`🔄 Actualizando navegación para rol ${roleName}...`)
      
      // Actualizar elementos de navegación
      updates.forEach(update => {
        const existingItem = navigationConfig.value.find(item => item.id === update.id)
        if (existingItem) {
          Object.assign(existingItem, update)
        }
      })
      
      // Guardar cambios
      await saveNavigationConfig(updatedBy)
      
      console.log('✅ Navegación actualizada correctamente')
    } catch (err) {
      error.value = 'Error al actualizar navegación'
      console.error('Error updating navigation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Obtener permisos por módulo
  const getPermissionsByModule = computed(() => {
    const grouped: Record<string, Permission[]> = {}
    permissions.value.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = []
      }
      grouped[permission.module].push(permission)
    })
    return grouped
  })

  // Función para inicializar datos por defecto si no existen
  const initializeDefaultData = async () => {
    await forceInitializeRBAC()
  }

  onMounted(async () => {
    await loadRoles()
    await loadPermissions()
    await loadNavigationConfig()
    
    // Si no hay datos, inicializar automáticamente
    if (roles.value.length === 0 || permissions.value.length === 0) {
      await forceInitializeRBAC()
    }
  })

  return {
    roles,
    permissions,
    navigationConfig,
    loading,
    error,
    loadRoles,
    loadPermissions,
    loadNavigationConfig,
    forceInitializeRBAC,
    saveRoles,
    savePermissions,
    saveNavigationConfig,
    updateTeacherStudentViewPermission,
    getTeacherStudentViewPermission,
    hasPermission,
    getNavigationForRole,
    canAccessRoute,
    updateNavigationForRole,
    getPermissionsByModule,
    initializeDefaultData
  }
}
