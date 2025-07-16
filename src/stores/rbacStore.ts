// src/stores/rbacStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';

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
    if (
      (authStore.user?.role === 'Maestro' || authStore.user?.role === 'maestro') &&
      permissionName.startsWith('attendance_')
    ) {
      return true;
    }
    return userPermissions.value.includes(permissionName);
  });
  const canAccess = computed(() => (resource: string, action: string) => {
    // Dar acceso total a maestros para recursos de asistencia
    if (
      (authStore.user?.role === 'Maestro' || authStore.user?.role === 'maestro') &&
      resource.toLowerCase().includes('attendance')
    ) {
      return true;
    }

    const permission = `${resource}_${action}`;
    return hasPermission.value(permission);
  });
  // Método específico para verificar permisos de estudiantes
  const canViewAllStudents = computed(() => () => {
    // Superusuario, Admin y Director siempre pueden ver todos los estudiantes
    if (['Superusuario', 'Admin', 'Director'].includes(authStore.user?.role || '')) {
      return true;
    }

    // Para maestros, verificar si tienen el permiso específico
    return hasPermission.value('Ver Todos los Estudiantes');
  });

  const canViewOwnClassStudents = computed(() => () => {
    // Todos los maestros pueden ver estudiantes de sus propias clases
    if (authStore.user?.role === 'Maestro' || authStore.user?.role === 'maestro') {
      return true;
    }

    return hasPermission.value('Ver Estudiantes de Clases Propias');
  });
  // Acciones
  const initializeUserRBAC = async () => {
    if (!authStore.user?.uid || initialized.value) {
      return;
    }

    loading.value = true;
    try {
      const userRole = authStore.user.role || '';

      // Para maestros, asignar permisos basados en RBAC
      if (userRole === 'Maestro' || userRole === 'maestro') {
        userRoles.value = ['Maestro'];
        // Permisos por defecto para maestros (solo estudiantes de sus clases)
        userPermissions.value = [
          'Ver Asistencia',
          'Crear Asistencia',
          'Editar Asistencia',
          'Calendario Asistencia',
          'Ver Clases',
          'Ver Estudiantes de Clases Propias', // Por defecto solo sus estudiantes
          'Dashboard Maestro',
        ];
      } else if (['Director', 'Admin', 'Superusuario'].includes(userRole)) {
        userRoles.value = [userRole];
        // Estos roles siempre pueden ver todos los estudiantes
        userPermissions.value = [
          'Ver Asistencia',
          'Crear Asistencia',
          'Editar Asistencia',
          'Ver Todos los Estudiantes',
          'Gestionar Estudiantes',
        ];
      }

      initialized.value = true;
    } catch (error) {
      console.error('Error al inicializar RBAC:', error);
      // En caso de error, dar permisos básicos basados en el rol del usuario
      if (authStore.user?.role) {
        userRoles.value = [authStore.user.role];
        if (authStore.user.role === 'Maestro' || authStore.user.role === 'maestro') {
          userPermissions.value = [
            'Ver Asistencia',
            'Crear Asistencia',
            'Editar Asistencia',
            'Ver Estudiantes de Clases Propias',
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
    canViewAllStudents,
    canViewOwnClassStudents,

    // Acciones
    initializeUserRBAC,
    resetRBAC,
    addRole,
    removeRole,
    addPermission,
    removePermission,
  };
});
