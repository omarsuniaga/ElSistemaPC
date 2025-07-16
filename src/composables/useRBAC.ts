// src/composables/useRBAC.ts

import { ref, computed, onMounted } from 'vue';
import {
  rbacService,
  type Role,
  type Permission,
  type ModuleAccess,
} from '@/services/rbac/rbacService';
import { useAuth } from '@/modulos/Auth/composables/useAuth';

export function useRBAC() {
  const { user } = useAuth();

  const roles = ref<Role[]>([]);
  const permissions = ref<Permission[]>([]);
  const moduleAccess = ref<ModuleAccess[]>([]);
  const userRoles = ref<string[]>([]);
  const loading = ref(false);

  // ===== COMPUTED =====

  const userPermissions = computed(() => {
    if (!user.value) return [];

    const userRoleObjects = roles.value.filter(
      (role) => userRoles.value.includes(role.id) && role.isActive,
    );

    const permissionIds = new Set<string>();
    userRoleObjects.forEach((role) => {
      role.permissions.forEach((permId) => permissionIds.add(permId));
    });

    return permissions.value.filter((perm) => permissionIds.has(perm.id));
  });

  const availableModules = computed(() => {
    if (!user.value) return [];

    return moduleAccess.value.filter(
      (module) =>
        module.isEnabled && module.allowedRoles.some((roleId) => userRoles.value.includes(roleId)),
    );
  });

  // ===== MÉTODOS =====

  const loadRBAC = async () => {
    if (!user.value) return;

    loading.value = true;
    try {
      const [rolesData, permissionsData, moduleAccessData, userRolesData] = await Promise.all([
        rbacService.getAllRoles(),
        rbacService.getAllPermissions(),
        rbacService.getAllModuleAccess(),
        rbacService.getUserRoles(user.value.uid),
      ]);

      roles.value = rolesData;
      permissions.value = permissionsData;
      moduleAccess.value = moduleAccessData;
      userRoles.value = userRolesData;
    } catch (error) {
      console.error('Error loading RBAC data:', error);
    } finally {
      loading.value = false;
    }
  };

  const hasPermission = async (permissionName: string): Promise<boolean> => {
    if (!user.value) return false;
    return await rbacService.checkUserPermission(user.value.uid, permissionName);
  };

  const hasModuleAccess = async (moduleId: string): Promise<boolean> => {
    if (!user.value) return false;
    return await rbacService.checkUserModuleAccess(user.value.uid, moduleId);
  };

  const hasRouteAccess = async (routePath: string): Promise<boolean> => {
    if (!user.value) return false;
    return await rbacService.checkUserRouteAccess(user.value.uid, routePath);
  };

  const canAccessComponent = (componentId: string, moduleId: string): boolean => {
    const module = moduleAccess.value.find((m) => m.moduleId === moduleId);
    if (!module || !module.isEnabled) return false;

    const component = module.components.find((c) => c.componentId === componentId);
    if (!component || !component.isVisible) return false;

    return component.allowedRoles.some((roleId) => userRoles.value.includes(roleId));
  };

  const refreshRBAC = async () => {
    await rbacService.refreshCache();
    await loadRBAC();
  };

  // ===== LIFECYCLE =====

  onMounted(() => {
    if (user.value) {
      loadRBAC();
    }
  });

  return {
    // Estado
    roles,
    permissions,
    moduleAccess,
    userRoles,
    userPermissions,
    availableModules,
    loading,

    // Métodos
    loadRBAC,
    hasPermission,
    hasModuleAccess,
    hasRouteAccess,
    canAccessComponent,
    refreshRBAC,
  };
}
