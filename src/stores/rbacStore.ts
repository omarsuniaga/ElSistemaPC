// src/stores/rbacStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from '../modulos/Auth/store/auth';
import { rbacService } from '@/services/rbac/rbacService';

export const useRBACStore = defineStore('rbac', () => {
  const authStore = useAuthStore();
  
  // Estado
  const userRoles = ref<string[]>([]);
  const userPermissions = ref<string[]>([]);
  const loading = ref(false);
  const initialized = ref(false);

  // Getters
  const hasRole = computed(() => (roleName: string) => {
    // Dar acceso total a maestros
    if (authStore.user?.role === 'Maestro' || authStore.user?.role === 'maestro') {
      return true;
    }
    return userRoles.value.includes(roleName);
  });

  const hasPermission = computed(() => (permissionName: string) => {
    // Dar acceso total a maestros para permisos de asistencia
    if ((authStore.user?.role === 'Maestro' || authStore.user?.role === 'maestro') && 
        permissionName.startsWith('attendance_')) {
      return true;
    }
    return userPermissions.value.includes(permissionName);
  });

  const canAccess = computed(() => (resource: string, action: string) => {
    // Dar acceso total a maestros para recursos de asistencia
    if ((authStore.user?.role === 'Maestro' || authStore.user?.role === 'maestro') && 
        resource.toLowerCase().includes('attendance')) {
      return true;
    }
    
    const permission = `${resource}_${action}`;
    return hasPermission.value(permission);
  });

  // Acciones
  const initializeUserRBAC = async () => {
    if (!authStore.user?.uid || initialized.value) {
      return;
    }

    loading.value = true;
    try {
      // Para maestros, asignar permisos completos automáticamente
      if (authStore.user.role === 'Maestro' || authStore.user.role === 'maestro') {
        userRoles.value = ['Maestro'];
        userPermissions.value = [
          'attendance_view',
          'attendance_edit', 
          'attendance_justify',
          'attendance_export',
          'attendance_calendar',
          'students_view',
          'classes_view',
          'profile_view',
          'profile_edit'
        ];
        initialized.value = true;
        return;
      }

      // Para otros roles, obtener desde el servicio RBAC
      const roles = await rbacService.getUserRoles(authStore.user.uid);
      const permissions = await rbacService.getUserPermissions(authStore.user.uid);
      
      userRoles.value = roles;
      userPermissions.value = permissions;
      initialized.value = true;
    } catch (error) {
      console.error('Error al inicializar RBAC:', error);
      // En caso de error, dar permisos básicos basados en el rol del usuario
      if (authStore.user?.role) {
        userRoles.value = [authStore.user.role];
        if (authStore.user.role === 'Maestro' || authStore.user.role === 'maestro') {
          userPermissions.value = [
            'attendance_view',
            'attendance_edit',
            'attendance_justify',
            'attendance_export'
          ];
        }
      }
    } finally {
      loading.value = false;
    }
  };

  const resetRBAC = () => {
    userRoles.value = [];
    userPermissions.value = [];
    initialized.value = false;
  };

  const addRole = (roleName: string) => {
    if (!userRoles.value.includes(roleName)) {
      userRoles.value.push(roleName);
    }
  };

  const removeRole = (roleName: string) => {
    const index = userRoles.value.indexOf(roleName);
    if (index > -1) {
      userRoles.value.splice(index, 1);
    }
  };

  const addPermission = (permissionName: string) => {
    if (!userPermissions.value.includes(permissionName)) {
      userPermissions.value.push(permissionName);
    }
  };

  const removePermission = (permissionName: string) => {
    const index = userPermissions.value.indexOf(permissionName);
    if (index > -1) {
      userPermissions.value.splice(index, 1);
    }
  };

  return {
    // Estado
    userRoles,
    userPermissions,
    loading,
    initialized,
    
    // Getters
    hasRole,
    hasPermission,
    canAccess,
    
    // Acciones
    initializeUserRBAC,
    resetRBAC,
    addRole,
    removeRole,
    addPermission,
    removePermission
  };
});
