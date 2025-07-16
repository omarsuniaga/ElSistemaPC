// src/modulos/Superusuario/composables/useSuperusuario.ts
import { ref, computed, onMounted, onUnmounted, readonly } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { superusuarioService } from '../services/superusuarioService';
import {
  UserRole,
  ResourceType,
  PermissionAction,
  hasPermission,
} from '@/modulos/Auth/types/permissions';
import {
  SystemConfiguration,
  RoleConfiguration,
  UserRoleAssignment,
  ModuleConfiguration,
  AuditLog,
  SystemMetrics,
  SuperusuarioDashboardData,
  SystemAlert,
  SuperusuarioFilters,
} from '../types';

export function useSuperusuario() {
  const authStore = useAuthStore();

  // ========== ESTADO REACTIVO ==========
  const loading = ref(false);
  const error = ref<string | null>(null);
  const dashboardData = ref<SuperusuarioDashboardData | null>(null);
  const systemConfigurations = ref<SystemConfiguration[]>([]);
  const roleConfigurations = ref<RoleConfiguration[]>([]);
  const userRoleAssignments = ref<UserRoleAssignment[]>([]);
  const moduleConfigurations = ref<ModuleConfiguration[]>([]);
  const auditLogs = ref<AuditLog[]>([]);
  const systemMetrics = ref<SystemMetrics[]>([]);
  const systemAlerts = ref<SystemAlert[]>([]);

  // Estado adicional para operaciones
  const users = ref<any[]>([]);
  const systemModules = ref<any[]>([]);
  const operationInProgress = ref(false);

  // ========== PERMISOS COMPUTADOS ==========
  const currentRole = computed(() => (authStore.user?.role as UserRole) || null);

  const canManageSystem = computed(() =>
    currentRole.value
      ? hasPermission(currentRole.value, ResourceType.SYSTEM_CONFIGURATION, PermissionAction.UPDATE)
      : false,
  );

  const canManageRoles = computed(() =>
    currentRole.value
      ? hasPermission(
        currentRole.value,
        ResourceType.USER_ROLES_MANAGEMENT,
        PermissionAction.UPDATE,
      )
      : false,
  );

  const canManagePermissions = computed(() =>
    currentRole.value
      ? hasPermission(
        currentRole.value,
        ResourceType.PERMISSION_MANAGEMENT,
        PermissionAction.UPDATE,
      )
      : false,
  );

  const canViewAuditLogs = computed(() =>
    currentRole.value
      ? hasPermission(currentRole.value, ResourceType.AUDIT_LOGS, PermissionAction.READ)
      : false,
  );

  const canManageBackups = computed(() =>
    currentRole.value
      ? hasPermission(currentRole.value, ResourceType.BACKUP_RESTORE, PermissionAction.CREATE)
      : false,
  );

  const canConfigureModules = computed(() =>
    currentRole.value
      ? hasPermission(currentRole.value, ResourceType.MODULE_CONFIGURATION, PermissionAction.UPDATE)
      : false,
  );

  const isSuperusuario = computed(() => authStore.user?.role === UserRole.SUPERUSUARIO);

  // ========== MÉTODOS PRINCIPALES ==========

  /**
   * Cargar datos del dashboard principal
   */
  async function loadDashboardData() {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para acceder a esta información';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      dashboardData.value = await superusuarioService.getDashboardData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar datos del dashboard';
      console.error('Error loading dashboard data:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cargar configuraciones del sistema
   */
  async function loadSystemConfigurations() {
    if (!canManageSystem.value) {
      error.value = 'No tienes permisos para ver las configuraciones del sistema';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      systemConfigurations.value = await superusuarioService.getSystemConfigurations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar configuraciones';
      console.error('Error loading system configurations:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualizar configuración del sistema
   */
  async function updateSystemConfiguration(id: string, updates: Partial<SystemConfiguration>) {
    if (!canManageSystem.value) {
      throw new Error('No tienes permisos para actualizar configuraciones del sistema');
    }

    loading.value = true;
    error.value = null;

    try {
      await superusuarioService.updateSystemConfiguration(id, updates);
      await loadSystemConfigurations(); // Recargar datos
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar configuración';
      console.error('Error updating system configuration:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cargar configuraciones de roles
   */
  async function loadRoleConfigurations() {
    if (!canManageRoles.value) {
      error.value = 'No tienes permisos para ver las configuraciones de roles';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      roleConfigurations.value = await superusuarioService.getRoleConfigurations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar configuraciones de roles';
      console.error('Error loading role configurations:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualizar configuración de rol
   */
  async function updateRoleConfiguration(role: UserRole, updates: Partial<RoleConfiguration>) {
    if (!canManageRoles.value) {
      throw new Error('No tienes permisos para actualizar configuraciones de roles');
    }

    loading.value = true;
    error.value = null;

    try {
      await superusuarioService.updateRoleConfiguration(role, updates);
      await loadRoleConfigurations(); // Recargar datos
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar configuración de rol';
      console.error('Error updating role configuration:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cargar asignaciones de roles de usuarios
   */
  async function loadUserRoleAssignments(filters?: SuperusuarioFilters) {
    if (!canManageRoles.value) {
      error.value = 'No tienes permisos para ver las asignaciones de roles';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      userRoleAssignments.value = await superusuarioService.getUserRoleAssignments(filters);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar asignaciones de roles';
      console.error('Error loading user role assignments:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Asignar rol a usuario
   */
  async function assignUserRole(assignment: Omit<UserRoleAssignment, 'assignedAt'>) {
    if (!canManageRoles.value) {
      throw new Error('No tienes permisos para asignar roles');
    }

    loading.value = true;
    error.value = null;

    try {
      await superusuarioService.assignUserRole(assignment);
      await loadUserRoleAssignments(); // Recargar datos
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al asignar rol';
      console.error('Error assigning user role:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cargar configuraciones de módulos
   */
  async function loadModuleConfigurations() {
    if (!canConfigureModules.value) {
      error.value = 'No tienes permisos para ver las configuraciones de módulos';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      moduleConfigurations.value = await superusuarioService.getModuleConfigurations();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error al cargar configuraciones de módulos';
      console.error('Error loading module configurations:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualizar configuración de módulo
   */
  async function updateModuleConfiguration(id: string, updates: Partial<ModuleConfiguration>) {
    if (!canConfigureModules.value) {
      throw new Error('No tienes permisos para actualizar configuraciones de módulos');
    }

    loading.value = true;
    error.value = null;

    try {
      await superusuarioService.updateModuleConfiguration(id, updates);
      await loadModuleConfigurations(); // Recargar datos
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error al actualizar configuración de módulo';
      console.error('Error updating module configuration:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cargar logs de auditoría
   */
  async function loadAuditLogs(filters?: SuperusuarioFilters, pageSize = 50) {
    if (!canViewAuditLogs.value) {
      error.value = 'No tienes permisos para ver los logs de auditoría';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      auditLogs.value = await superusuarioService.getAuditLogs(filters, pageSize);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar logs de auditoría';
      console.error('Error loading audit logs:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cargar métricas del sistema
   */
  async function loadSystemMetrics(hours = 24) {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para ver las métricas del sistema';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      systemMetrics.value = await superusuarioService.getSystemMetrics(hours);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar métricas del sistema';
      console.error('Error loading system metrics:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crear respaldo del sistema
   */
  async function createBackup(collections: string[], description: string): Promise<string> {
    if (!canManageBackups.value) {
      throw new Error('No tienes permisos para crear respaldos');
    }

    loading.value = true;
    error.value = null;

    try {
      const backupId = await superusuarioService.createBackup(collections, description);
      return backupId;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear respaldo';
      console.error('Error creating backup:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cambiar estado de la red (conectar/desconectar)
   */
  async function toggleNetworkStatus(enable: boolean) {
    if (!isSuperusuario.value) {
      throw new Error('No tienes permisos para cambiar el estado de la red');
    }

    loading.value = true;
    error.value = null;

    try {
      await superusuarioService.toggleNetworkStatus(enable);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cambiar estado de la red';
      console.error('Error toggling network status:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ========== MÉTODOS OPERATIVOS ==========

  /**
   * Cargar todos los usuarios para gestión
   */
  async function loadUsers() {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para gestionar usuarios';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      users.value = await superusuarioService.getAllUsers();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar usuarios';
      console.error('Error loading users:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cambiar rol de usuario
   */
  async function changeUserRole(userId: string, newRole: UserRole, reason: string) {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para cambiar roles';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      await superusuarioService.changeUserRole(userId, newRole, reason);

      // Actualizar usuario en la lista local
      const userIndex = users.value.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        users.value[userIndex].role = newRole;
      }

      // Recargar dashboard para reflejar cambios
      await loadDashboardData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cambiar rol de usuario';
      console.error('Error changing user role:', err);
    } finally {
      operationInProgress.value = false;
    }
  }

  /**
   * Activar/desactivar usuario
   */
  async function toggleUserStatus(userId: string, isActive: boolean) {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para cambiar estado de usuarios';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      await superusuarioService.toggleUserStatus(userId, isActive);

      // Actualizar usuario en la lista local
      const userIndex = users.value.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        users.value[userIndex].isActive = isActive;
      }

      // Recargar dashboard para reflejar cambios
      await loadDashboardData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cambiar estado de usuario';
      console.error('Error toggling user status:', err);
    } finally {
      operationInProgress.value = false;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async function createUser(userData: {
    email: string
    role: UserRole
    displayName: string
    password: string
  }) {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para crear usuarios';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      const newUserId = await superusuarioService.createUser(userData);

      // Agregar usuario a la lista local
      users.value.push({
        id: newUserId,
        ...userData,
        isActive: true,
        createdAt: new Date(),
      });

      // Recargar dashboard para reflejar cambios
      await loadDashboardData();

      return newUserId;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear usuario';
      console.error('Error creating user:', err);
      throw err;
    } finally {
      operationInProgress.value = false;
    }
  }

  /**
   * Cargar módulos del sistema
   */
  async function loadSystemModules() {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para ver módulos del sistema';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      systemModules.value = await superusuarioService.getSystemModules();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar módulos del sistema';
      console.error('Error loading system modules:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Habilitar/deshabilitar módulo
   */
  async function toggleModule(moduleId: string, enabled: boolean) {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para configurar módulos';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      await superusuarioService.toggleModule(moduleId, enabled);

      // Actualizar módulo en la lista local
      const moduleIndex = systemModules.value.findIndex((m) => m.id === moduleId);
      if (moduleIndex !== -1) {
        systemModules.value[moduleIndex].enabled = enabled;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al configurar módulo';
      console.error('Error toggling module:', err);
    } finally {
      operationInProgress.value = false;
    }
  }

  /**
   * Ejecutar mantenimiento del sistema
   */
  async function runSystemMaintenance() {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para ejecutar mantenimiento';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      await superusuarioService.runSystemMaintenance();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error durante el mantenimiento';
      console.error('Error running maintenance:', err);
    } finally {
      operationInProgress.value = false;
    }
  }

  /**
   * Exportar datos del sistema
   */
  async function exportSystemData(format: 'json' | 'csv' | 'xlsx') {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para exportar datos';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      const exportId = await superusuarioService.exportSystemData(format);
      return exportId;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error durante la exportación';
      console.error('Error exporting data:', err);
      throw err;
    } finally {
      operationInProgress.value = false;
    }
  }

  /**
   * Crear backup del sistema
   */
  async function createSystemBackup(description: string) {
    if (!isSuperusuario.value) {
      error.value = 'No tienes permisos para crear backups';
      return;
    }

    operationInProgress.value = true;
    error.value = null;

    try {
      const backupId = await superusuarioService.createSystemBackup(description);
      return backupId;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creando backup';
      console.error('Error creating backup:', err);
      throw err;
    } finally {
      operationInProgress.value = false;
    }
  }

  // ========== UTILIDADES ==========

  /**
   * Limpiar errores
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Resetear estado
   */
  function resetState() {
    loading.value = false;
    error.value = null;
    dashboardData.value = null;
    systemConfigurations.value = [];
    roleConfigurations.value = [];
    userRoleAssignments.value = [];
    moduleConfigurations.value = [];
    auditLogs.value = [];
    systemMetrics.value = [];
    systemAlerts.value = [];
  }

  // ========== SUSCRIPCIONES EN TIEMPO REAL ==========
  let alertsUnsubscribe: (() => void) | null = null;

  function subscribeToAlerts() {
    if (alertsUnsubscribe) {
      alertsUnsubscribe();
    }

    alertsUnsubscribe = superusuarioService.subscribeToSystemAlerts((alerts) => {
      systemAlerts.value = alerts;
    });
  }

  // ========== LIFECYCLE ==========
  onMounted(() => {
    if (isSuperusuario.value) {
      subscribeToAlerts();
    }
  });

  onUnmounted(() => {
    if (alertsUnsubscribe) {
      alertsUnsubscribe();
    }
  });
  return {
    // Estado
    loading: readonly(loading),
    error: readonly(error),
    dashboardData: readonly(dashboardData),
    systemConfigurations: readonly(systemConfigurations),
    roleConfigurations: readonly(roleConfigurations),
    userRoleAssignments: readonly(userRoleAssignments),
    moduleConfigurations: readonly(moduleConfigurations),
    auditLogs: readonly(auditLogs),
    systemMetrics: readonly(systemMetrics),
    systemAlerts: readonly(systemAlerts),
    users: readonly(users),
    systemModules: readonly(systemModules),
    operationInProgress: readonly(operationInProgress),

    // Permisos computados
    canManageSystem: readonly(canManageSystem),
    canManageRoles: readonly(canManageRoles),
    canManagePermissions: readonly(canManagePermissions),
    canViewAuditLogs: readonly(canViewAuditLogs),
    canManageBackups: readonly(canManageBackups),
    canConfigureModules: readonly(canConfigureModules),
    isSuperusuario: readonly(isSuperusuario),

    // Métodos principales
    loadDashboardData,
    loadSystemConfigurations,
    updateSystemConfiguration,
    loadRoleConfigurations,
    updateRoleConfiguration,
    loadUserRoleAssignments,
    assignUserRole,
    loadModuleConfigurations,
    updateModuleConfiguration,
    loadAuditLogs,
    loadSystemMetrics,
    createBackup,
    toggleNetworkStatus,
    clearError,
    resetState,
    subscribeToAlerts,

    // Métodos operativos
    loadUsers,
    changeUserRole,
    toggleUserStatus,
    createUser,
    loadSystemModules,
    toggleModule,
    runSystemMaintenance,
    exportSystemData,
    createSystemBackup,
  };
}
