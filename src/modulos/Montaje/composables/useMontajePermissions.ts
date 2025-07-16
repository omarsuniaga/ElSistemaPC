import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { MontajePermission } from '../types/permissions'; // Asegúrate de que esta ruta sea correcta

export function useMontajePermissions() {
  const authStore = useAuthStore();

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (resource: MontajePermission['resource'], action: MontajePermission['actions'][number]): boolean => {
    // Si el usuario es director o superusuario, tiene todos los permisos
    if (authStore.isDirector || authStore.isSuperusuario) {
      return true;
    }

    // Si no hay usuario o no tiene permisos definidos, denegar
    if (!authStore.user || !authStore.user.userRoles) {
      return false;
    }

    // Asumiendo que los permisos específicos de Montaje están en user.userRoles o en una propiedad similar
    // Por ahora, usaremos una lógica simplificada. Idealmente, los permisos deberían cargarse
    // de forma más granular para el módulo Montaje.
    // TODO: Implementar la lógica real de permisos de Montaje basada en el rol y los permisos asignados.
    
    // Ejemplo de lógica placeholder:
    if (authStore.isTeacher) {
      // Los maestros pueden leer obras y crear/actualizar observaciones/evaluaciones
      if (resource === 'works' && action === 'read') return true;
      if (resource === 'evaluations' && (action === 'create' || action === 'update' || action === 'read')) return true;
      if (resource === 'reports' && action === 'read') return true;
      if (resource === 'members' && action === 'read') return true;
      if (resource === 'settings' && action === 'read') return true;
      if (resource === 'works' && action === 'update') return true; // Para actualizar progreso de compases
    }

    return false;
  };

  // Permisos comunes para la vista del maestro
  const canReadWorks = computed(() => hasPermission('works', 'read'));
  const canCreateEvaluations = computed(() => hasPermission('evaluations', 'create'));
  const canUpdateEvaluations = computed(() => hasPermission('evaluations', 'update'));
  const canReadEvaluations = computed(() => hasPermission('evaluations', 'read'));
  const canReadReports = computed(() => hasPermission('reports', 'read'));
  const canUpdateWorkProgress = computed(() => hasPermission('works', 'update'));

  return {
    hasPermission,
    canReadWorks,
    canCreateEvaluations,
    canUpdateEvaluations,
    canReadEvaluations,
    canReadReports,
    canUpdateWorkProgress,
  };
}
