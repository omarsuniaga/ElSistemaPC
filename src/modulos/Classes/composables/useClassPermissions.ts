// src/modulos/Classes/composables/useClassPermissions.ts

import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useClassesStore } from '../store/classes';

/**
 * Composable para gestionar permisos de clases compartidas
 * Implementa la lógica exacta de permisos:
 * - READ: Solo puede ver el listado de asistencia
 * - WRITE: Puede pasar asistencia, NO recibe notificaciones obligatorias
 * - MANAGE: Todos los permisos + notificaciones + responsabilidad total
 */
export function useClassPermissions(classId: string) {
  const authStore = useAuthStore();
  const classesStore = useClassesStore();
  
  const loading = ref(false);
  const permissionLevel = ref<'none' | 'read' | 'write' | 'manage' | 'owner'>('none');

  // ID del usuario actual
  const currentUserId = computed(() => authStore.user?.uid || '');

  /**
   * Carga el nivel de permiso del usuario actual
   */
  const loadPermissions = async () => {
    if (!currentUserId.value || !classId) return;

    loading.value = true;
    try {
      permissionLevel.value = await classesStore.getTeacherPermissionLevel(classId, currentUserId.value);
    } catch (error) {
      console.error('Error loading permissions:', error);
      permissionLevel.value = 'none';
    } finally {
      loading.value = false;
    }
  };

  // Permisos específicos computados
  const permissions = computed(() => ({
    // Puede ver asistencia (READ, WRITE, MANAGE, OWNER)
    canView: ['read', 'write', 'manage', 'owner'].includes(permissionLevel.value),
    
    // Puede pasar asistencia (WRITE, MANAGE, OWNER)
    canTakeAttendance: ['write', 'manage', 'owner'].includes(permissionLevel.value),
    
    // Debe recibir notificaciones (MANAGE, OWNER)
    shouldReceiveNotifications: ['manage', 'owner'].includes(permissionLevel.value),
    
    // Puede gestionar estudiantes (MANAGE, OWNER)
    canManageStudents: ['manage', 'owner'].includes(permissionLevel.value),
    
    // Puede modificar la clase (MANAGE, OWNER)
    canModifyClass: ['manage', 'owner'].includes(permissionLevel.value),
    
    // Ve estados pendientes (MANAGE, OWNER)
    canViewPendingStates: ['manage', 'owner'].includes(permissionLevel.value),
    
    // Es propietario (OWNER)
    isOwner: permissionLevel.value === 'owner',
    
    // Tiene algún nivel de acceso
    hasAccess: permissionLevel.value !== 'none',
  }));

  // Funciones de verificación específicas (para casos complejos)
  const checkPermission = async (permission: 'read' | 'write' | 'manage'): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.checkSharedClassPermission(classId, currentUserId.value, permission);
  };

  const canViewAttendance = async (): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.canViewAttendance(classId, currentUserId.value);
  };

  const canTakeAttendance = async (): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.canTakeAttendance(classId, currentUserId.value);
  };

  const shouldReceiveNotifications = async (): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.shouldReceiveNotifications(classId, currentUserId.value);
  };

  const canManageStudents = async (): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.canManageStudents(classId, currentUserId.value);
  };

  const canModifyClass = async (): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.canModifyClass(classId, currentUserId.value);
  };

  const canViewPendingStates = async (): Promise<boolean> => {
    if (!currentUserId.value) return false;
    return await classesStore.canViewPendingAttendanceStates(classId, currentUserId.value);
  };

  // Texto descriptivo del nivel de permiso
  const permissionText = computed(() => {
    switch (permissionLevel.value) {
    case 'owner':
      return 'Propietario';
    case 'manage':
      return 'Administrador';
    case 'write':
      return 'Editor';
    case 'read':
      return 'Solo lectura';
    default:
      return 'Sin acceso';
    }
  });

  // Color para badges de permisos
  const permissionColor = computed(() => {
    switch (permissionLevel.value) {
    case 'owner':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
    case 'manage':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    case 'write':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    case 'read':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  });

  return {
    // Estado
    loading,
    permissionLevel,
    currentUserId,

    // Permisos computados (reactivos)
    permissions,
    permissionText,
    permissionColor,

    // Métodos
    loadPermissions,
    checkPermission,
    canViewAttendance,
    canTakeAttendance,
    shouldReceiveNotifications,
    canManageStudents,
    canModifyClass,
    canViewPendingStates,
  };
}