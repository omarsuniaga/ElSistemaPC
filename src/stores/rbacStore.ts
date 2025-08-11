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
    console.log('🔄 [RBAC] Inicializando RBAC para el usuario');
    
    if (!authStore.user?.uid) {
      console.warn('⚠️ [RBAC] No hay usuario autenticado');
      return;
    }
    
    if (initialized.value) {
      console.log('ℹ️ [RBAC] RBAC ya inicializado para este usuario');
      return;
    }

    loading.value = true;
    try {
      const userRole = authStore.user.role || '';
      console.log(`👤 [RBAC] Rol del usuario: ${userRole}`);

      // Resetear valores previos
      userRoles.value = [];
      userPermissions.value = [];

      // Para maestros, asignar permisos basados en RBAC
      if (userRole.toLowerCase() === 'maestro' || userRole.toLowerCase() === 'profesor') {
        console.log('🎓 [RBAC] Configurando permisos para Maestro');
        userRoles.value = ['Maestro'];
        // Permisos por defecto para maestros (solo estudiantes de sus clases)
        userPermissions.value = [
          'Ver Asistencia',
          'Crear Asistencia',
          'Editar Asistencia',
          'Calendario Asistencia',
          'Ver Clases',
          'Ver Estudiantes de Clases Propias',
          'Dashboard Maestro',
        ];
      } 
      // Para roles administrativos
      else if (['Director', 'Admin', 'Superusuario'].includes(userRole)) {
        console.log('👔 [RBAC] Configurando permisos para rol administrativo:', userRole);
        userRoles.value = [userRole];
        
        // Permisos para roles administrativos
        const adminPermissions = [
          // Permisos de asistencia
          'Ver Asistencia',
          'Crear Asistencia',
          'Editar Asistencia',
          
          // Permisos de estudiantes
          'Ver Todos los Estudiantes',
          'Gestionar Estudiantes',
          
          // Permisos de maestros
          'teachers_view',
          'teachers_edit',
          'teachers_create',
          'teachers_delete',
          
          // Permisos de clases
          'Ver Clases',
          'Gestionar Clases',
          
          // Permisos generales de administración
          'admin_dashboard',
          'manage_users',
          'manage_roles',
          'view_reports'
        ];
        
        userPermissions.value = adminPermissions;
        console.log(`✅ [RBAC] Permisos asignados a ${userRole}:`, adminPermissions);
      } else {
        console.warn('⚠️ [RBAC] Rol no reconocido, sin permisos asignados:', userRole);
      }

      initialized.value = true;
      console.log('✅ [RBAC] Inicialización completada');
      console.log('📋 [RBAC] Roles asignados:', userRoles.value);
      console.log('🔑 [RBAC] Permisos asignados:', userPermissions.value);
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
