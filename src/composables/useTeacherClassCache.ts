// src/composables/useTeacherClassCache.ts
import { computed, ref, watch } from 'vue';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useAuthStore } from '../stores/auth';

/**
 * Composable mejorado para manejar el caché de clases del maestro
 * Aborda el punto de fricción #2: Complejidad en el Cache de Clases del Maestro
 */
export function useTeacherClassCache() {
  const classesStore = useClassesStore();
  const authStore = useAuthStore();

  const isRefreshing = ref(false);
  const lastRefresh = ref<Date | null>(null);

  // Estados reactivos para tracking
  const cacheStatus = computed(() => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) return 'no-teacher';

    const cached = classesStore.teacherClassesCache[teacherId];
    if (!cached) return 'empty';

    const now = new Date();
    const timeDiff = now.getTime() - cached.lastSync.getTime();
    const isStale = timeDiff > 5 * 60 * 1000; // 5 minutos

    return isStale ? 'stale' : 'fresh';
  });

  /**
   * Refresca el caché de clases del maestro con manejo de errores mejorado
   */
  const refreshCache = async (teacherId?: string) => {
    const targetTeacherId = teacherId || authStore.user?.uid;
    if (!targetTeacherId) {
      console.warn('No se puede refrescar caché: teacherId no disponible');
      return false;
    }

    try {
      isRefreshing.value = true;
      await classesStore.refreshTeacherClassesCache(targetTeacherId);
      lastRefresh.value = new Date();
      console.log(`✅ Caché de clases refrescado para teacher: ${targetTeacherId}`);
      return true;
    } catch (error) {
      console.error('❌ Error al refrescar caché de clases:', error);
      return false;
    } finally {
      isRefreshing.value = false;
    }
  };

  /**
   * Invalida el caché automáticamente en eventos específicos
   * Soluciona el problema de invalidación inconsistente mencionado en la evaluación
   */
  const invalidateOnEvent = async (event: CacheInvalidationEvent, teacherId?: string) => {
    const targetTeacherId = teacherId || authStore.user?.uid;
    if (!targetTeacherId) return false;

    console.log(`🔄 Invalidando caché por evento: ${event} para teacher: ${targetTeacherId}`);

    const eventRequiresRefresh = [
      'class-assigned',
      'class-removed',
      'assistant-invitation-accepted',
      'assistant-invitation-declined',
      'assistant-removed',
      'class-updated',
      'schedule-changed',
      'permissions-updated',
    ];

    if (eventRequiresRefresh.includes(event)) {
      return await refreshCache(targetTeacherId);
    }

    return false;
  };

  /**
   * Obtiene las clases del maestro con caché inteligente
   */
  const getTeacherClasses = async (teacherId?: string, forceRefresh = false) => {
    const targetTeacherId = teacherId || authStore.user?.uid;
    if (!targetTeacherId) return [];

    // Si se fuerza el refresh o el caché está vacío/desactualizado
    if (forceRefresh || cacheStatus.value !== 'fresh') {
      await refreshCache(targetTeacherId);
    }

    // Usar el getter mejorado del store
    return classesStore.getAllTeacherClasses(targetTeacherId);
  };

  /**
   * Hook automático para invalidar caché cuando el usuario cambia
   */
  const setupAutoInvalidation = () => {
    watch(
      () => authStore.user?.uid,
      (newTeacherId, oldTeacherId) => {
        if (newTeacherId && newTeacherId !== oldTeacherId) {
          console.log('👤 Usuario cambió, limpiando caché anterior...');
          if (oldTeacherId) {
            delete classesStore.teacherClassesCache[oldTeacherId];
          }
          // Cargar datos del nuevo usuario
          refreshCache(newTeacherId);
        }
      },
      { immediate: false },
    );
  };

  /**
   * Limpia el caché completo (útil para logout)
   */
  const clearAllCache = () => {
    classesStore.clearTeacherClassesCache();
    lastRefresh.value = null;
    console.log('🧹 Caché de clases limpiado completamente');
  };

  /**
   * Diagnóstico del estado del caché
   */
  const getCacheDiagnostics = () => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) return null;

    const cache = classesStore.teacherClassesCache[teacherId];
    return {
      teacherId,
      status: cacheStatus.value,
      hasCache: !!cache,
      lastSync: cache?.lastSync || null,
      dataCount: cache?.data?.length || 0,
      lastRefresh: lastRefresh.value,
      isRefreshing: isRefreshing.value,
    };
  };

  return {
    // Estados reactivos
    isRefreshing,
    lastRefresh,
    cacheStatus,

    // Métodos principales
    refreshCache,
    invalidateOnEvent,
    getTeacherClasses,

    // Utilidades
    setupAutoInvalidation,
    clearAllCache,
    getCacheDiagnostics,
  };
}

// Tipos para eventos de invalidación
export type CacheInvalidationEvent =
  | 'class-assigned'
  | 'class-removed'
  | 'assistant-invitation-accepted'
  | 'assistant-invitation-declined'
  | 'assistant-removed'
  | 'class-updated'
  | 'schedule-changed'
  | 'permissions-updated'
  | 'manual-refresh'

// Hook para auto-setup en componentes que manejan colaboración
export function useAutoTeacherCacheInvalidation() {
  const cache = useTeacherClassCache();

  // Auto-setup en mount
  cache.setupAutoInvalidation();

  return cache;
}
