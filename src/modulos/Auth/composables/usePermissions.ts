import {computed} from "vue"
import {useAuthStore} from "@/stores/auth"
import {
  UserRole,
  PermissionAction,
  ResourceType,
  ROLE_PERMISSIONS,
  hasPermission as staticHasPermission,
  type Permission,
} from "../types/permissions"

export function usePermissions() {
  const authStore = useAuthStore()

  // Computed properties para información del usuario
  const currentUser = computed(() => authStore.user)
  const currentRole = computed(() => {
    if (!authStore.user?.role) return null
    // Mapear los roles del sistema existente a los nuevos enums
    const roleMapping: Record<string, UserRole> = {
      Maestro: UserRole.MAESTRO,
      Director: UserRole.DIRECTOR,
      Admin: UserRole.ADMINISTRADOR,
      Administrador: UserRole.ADMINISTRADOR,
      Superusuario: UserRole.SUPERUSUARIO,
      Colaborador: UserRole.COLABORADOR,
      Monitor: UserRole.MONITOR,
    }
    return roleMapping[authStore.user.role] || null
  })
  const isAuthenticated = computed(() => authStore.isLoggedIn)

  // Helpers para roles específicos
  const isMaestro = computed(() => currentRole.value === UserRole.MAESTRO)
  const isDirector = computed(() => currentRole.value === UserRole.DIRECTOR)
  const isAdministrador = computed(() => currentRole.value === UserRole.ADMINISTRADOR)
  const isSuperusuario = computed(() => currentRole.value === UserRole.SUPERUSUARIO)
  const isColaborador = computed(() => currentRole.value === UserRole.COLABORADOR)
  const isMonitor = computed(() => currentRole.value === UserRole.MONITOR)

  // Función principal para verificar permisos
  const hasPermission = (
    action: PermissionAction,
    resource: ResourceType,
    scope?: "own" | "class" | "all"
  ): boolean => {
    // Verificar autenticación
    if (!isAuthenticated.value || !currentRole.value) {
      return false
    }

    // Usar la función estática de validación de permisos
    return staticHasPermission(currentRole.value, resource, action, scope)
  }

  // Verificar múltiples permisos
  const hasAnyPermission = (
    permissions: Array<{action: PermissionAction; resource: ResourceType; scope?: string}>
  ): boolean => {
    return permissions.some((p) => hasPermission(p.action, p.resource, p.scope as any))
  }

  const hasAllPermissions = (
    permissions: Array<{action: PermissionAction; resource: ResourceType; scope?: string}>
  ): boolean => {
    return permissions.every((p) => hasPermission(p.action, p.resource, p.scope as any))
  }

  // Obtener todos los permisos de un rol
  const getRolePermissions = (role: UserRole): Permission[] => {
    return ROLE_PERMISSIONS[role] || []
  }

  // Obtener recursos accesibles para una acción específica
  const getAccessibleResources = (action: PermissionAction): ResourceType[] => {
    if (!currentRole.value) return []

    const rolePermissions = ROLE_PERMISSIONS[currentRole.value] || []
    return rolePermissions.filter((p) => p.action === action).map((p) => p.resource)
  }
  // Verificar acceso a módulos específicos usando el sistema existente
  const canAccessModule = (module: string): boolean => {
    if (!authStore.user?.role) return false
    return Boolean(authStore.canAccessModule(module))
  }

  // Verificar acceso a funcionalidades específicas del Superusuario
  const canAccessSuperusuarioFeature = (feature: ResourceType): boolean => {
    if (!isSuperusuario.value) return false
    return hasPermission(PermissionAction.READ, feature)
  }

  // Helpers para acciones comunes
  const canRead = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.READ, resource, scope)

  const canCreate = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.CREATE, resource, scope)

  const canUpdate = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.UPDATE, resource, scope)

  const canDelete = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.DELETE, resource, scope)

  const canAssign = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.ASSIGN, resource, scope)

  const canApprove = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.APPROVE, resource, scope)

  const canSupervise = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.SUPERVISE, resource, scope)

  const canExport = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.EXPORT, resource, scope)

  const canGenerateReports = (resource: ResourceType, scope?: "own" | "class" | "all") =>
    hasPermission(PermissionAction.GENERATE_REPORTS, resource, scope)

  // Funciones específicas para verificar permisos comunes
  const canManageAttendance = () =>
    canCreate(ResourceType.DAILY_ATTENDANCE) || canUpdate(ResourceType.DAILY_ATTENDANCE)
  const canViewReports = () =>
    canRead(ResourceType.ATTENDANCE_REPORTS) || canRead(ResourceType.GENERAL_REPORTS)
  const canManageStudents = () =>
    canCreate(ResourceType.CLASS_STUDENTS) || canUpdate(ResourceType.CLASS_STUDENTS)
  const canManageClasses = () =>
    canCreate(ResourceType.MANAGE_CLASSES) || canUpdate(ResourceType.MANAGE_CLASSES)
  const canAccessConfidentialInfo = () => canRead(ResourceType.CONFIDENTIAL_INFO)
  const canManageSystem = () => canRead(ResourceType.SYSTEM_CONFIGURATION)

  return {
    // Estado
    currentUser,
    currentRole,
    isAuthenticated,

    // Helpers de roles
    isMaestro,
    isDirector,
    isAdministrador,
    isSuperusuario,
    isColaborador,
    isMonitor,

    // Funciones principales de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Helpers de permisos por acción
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canAssign,
    canApprove,
    canSupervise,
    canExport,
    canGenerateReports,

    // Funciones de acceso específicas
    canAccessModule,
    canAccessSuperusuarioFeature,
    getRolePermissions,
    getAccessibleResources,

    // Funciones de conveniencia para permisos comunes
    canManageAttendance,
    canViewReports,
    canManageStudents,
    canManageClasses,
    canAccessConfidentialInfo,
    canManageSystem,
  }
}
