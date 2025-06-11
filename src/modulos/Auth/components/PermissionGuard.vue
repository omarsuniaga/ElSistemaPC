// src/modulos/Auth/components/PermissionGuard.vue

<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  <div v-else-if="showFallback">
    <slot name="fallback">
      <div class="permission-denied">
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Acceso Restringido
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ fallbackMessage || 'No tienes permisos para acceder a esta función.' }}
          </p>
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { usePermissions } from '../composables/usePermissions';
import { ResourceType, PermissionAction } from '../types/permissions';

interface Props {
  // Verificación por recurso y acción
  resource?: ResourceType;
  action?: PermissionAction;
  scope?: 'own' | 'class' | 'all';
  
  // Verificación por rol
  roles?: string[];
  
  // Verificación por función específica
  requires?: string;
  
  // Contexto para verificaciones
  context?: {
    teacherId?: string;
    classId?: string;
  };
  
  // Configuración de visualización
  showFallback?: boolean;
  fallbackMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showFallback: true,
  fallbackMessage: ''
});

const { hasPermission, currentRole, isMaestro, isDirector, isAdministrador } = usePermissions();

const hasAccess = computed(() => {
  // Verificación por recurso y acción
  if (props.resource && props.action) {
    const result = hasPermission(props.action, props.resource, props.scope);
    console.log(`[PermissionGuard] Verificando permiso: ${props.action} en ${props.resource} con scope ${props.scope}. Resultado: ${result}`);
    console.log(`[PermissionGuard] Rol actual: ${currentRole.value}`);
    return result;
  }
  
  // Verificación por roles
  if (props.roles && props.roles.length > 0) {
    return props.roles.includes(currentRole.value || '');
  }
  
  // Verificación por función específica
  if (props.requires) {
    return checkSpecificRequirement(props.requires);
  }
  
  // Si no se especifica nada, denegar acceso por seguridad
  return false;
});

const checkSpecificRequirement = (requirement: string): boolean => {
  switch (requirement) {
    // Permisos de maestro
    case 'teacher.recordAttendance':
    case 'teacher.editAttendance':
    case 'teacher.addObservations':
    case 'teacher.editMontaje':
    case 'teacher.manageStudents':
    case 'teacher.evaluateStudents':
    case 'teacher.editProfile':
    case 'teacher.viewStudentMetrics':
      return isMaestro.value || isDirector.value || isAdministrador.value;
    
    // Permisos de director
    case 'director.manageRepertorios':
    case 'director.manageObras':
    case 'director.manageAllStudents':
    case 'director.viewConfidentialInfo':
    case 'director.manageClasses':
    case 'director.evaluateTeachers':
    case 'director.generateReports':
    case 'director.generatePDFs':
    case 'director.viewGlobalMetrics':
    case 'director.manageEmergencyClasses':
      return isDirector.value || isAdministrador.value;
    
    // Verificaciones de rol
    case 'role.maestro':
      return isMaestro.value;
    case 'role.director':
      return isDirector.value;
    case 'role.administrador':
      return isAdministrador.value;
    case 'role.directorOrAdmin':
      return isDirector.value || isAdministrador.value;
    
    default:
      console.warn(`Requisito no reconocido: ${requirement}`);
      return false;
  }
};
</script>

<style scoped>
.permission-denied {
  @apply bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg;
}
</style>
