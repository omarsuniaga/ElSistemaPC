/**
 * Sistema de Diagnósticos del Estado del Sistema
 * Proporciona información detallada sobre el rendimiento y estado
 * de todos los componentes del sistema de gestión académica.
 */

import { ref, computed } from 'vue';

/**
 * Interfaz para métricas de rendimiento
 */
interface PerformanceMetrics {
  responseTime: number
  cacheHitRatio: number
  errorRate: number
  lastUpdated: Date
}

/**
 * Interfaz para estado de un store
 */
interface StoreStatus {
  name: string
  isLoaded: boolean
  itemCount: number
  loading: boolean
  lastError: string | null
  lastSync: Date | null
}

/**
 * Interfaz para diagnóstico completo del sistema
 */
interface SystemDiagnostics {
  overall: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    version: string
  }
  stores: StoreStatus[]
  performance: PerformanceMetrics
  cache: {
    totalSize: number
    hitRatio: number
    invalidations: number
  }
  services: {
    attendanceService: boolean
    teacherCache: boolean
    globalState: boolean
  }
  recommendations: string[]
}

class SystemDiagnosticsManager {
  private startTime = Date.now();
  private metrics = ref<SystemDiagnostics | null>(null);
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia el monitoreo automático
   */
  startMonitoring(intervalMs = 30000) {
    this.updateDiagnostics();

    this.updateInterval = setInterval(() => {
      this.updateDiagnostics();
    }, intervalMs);
  }

  /**
   * Detiene el monitoreo
   */
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Actualiza todos los diagnósticos
   */
  async updateDiagnostics() {
    try {
      const diagnostics = await this.collectDiagnostics();
      this.metrics.value = diagnostics;
    } catch (error) {
      console.error('Error actualizando diagnósticos:', error);
    }
  }

  /**
   * Recopila todos los diagnósticos del sistema
   */
  private async collectDiagnostics(): Promise<SystemDiagnostics> {
    const stores = await this.getStoresStatus();
    const performance = await this.getPerformanceMetrics();
    const cache = await this.getCacheMetrics();
    const services = await this.getServicesStatus();

    const overall = this.calculateOverallStatus(stores, performance, services);
    const recommendations = this.generateRecommendations(stores, performance, cache);

    return {
      overall,
      stores,
      performance,
      cache,
      services,
      recommendations,
    };
  }

  /**
   * Obtiene el estado de todos los stores
   */
  private async getStoresStatus(): Promise<StoreStatus[]> {
    const stores: StoreStatus[] = [];

    try {
      // Store de Asistencia
      const { useAttendanceStore } = await import('../modulos/Attendance/store/attendance');
      const attendanceStore = useAttendanceStore();
      stores.push({
        name: 'Attendance',
        isLoaded: !!attendanceStore.attendanceDocuments,
        itemCount: attendanceStore.attendanceDocuments?.length || 0,
        loading: attendanceStore.loading,
        lastError: attendanceStore.error,
        lastSync: attendanceStore.lastSync,
      });
    } catch (error) {
      stores.push({
        name: 'Attendance',
        isLoaded: false,
        itemCount: 0,
        loading: false,
        lastError: 'Error loading store',
        lastSync: null,
      });
    }

    try {
      // Store de Clases
      const { useClassesStore } = await import('../modulos/Classes/store/classes');
      const classesStore = useClassesStore();
      stores.push({
        name: 'Classes',
        isLoaded: !!classesStore.classes,
        itemCount: classesStore.classes?.length || 0,
        loading: classesStore.loading,
        lastError: classesStore.error,
        lastSync: classesStore.lastSync,
      });
    } catch (error) {
      stores.push({
        name: 'Classes',
        isLoaded: false,
        itemCount: 0,
        loading: false,
        lastError: 'Error loading store',
        lastSync: null,
      });
    }

    try {
      // Store de Estudiantes
      const { useStudentsStore } = await import('../modulos/Students/store/students');
      const studentsStore = useStudentsStore();
      stores.push({
        name: 'Students',
        isLoaded: !!studentsStore.students,
        itemCount: studentsStore.students?.length || 0,
        loading: studentsStore.loading,
        lastError: studentsStore.error,
        lastSync: studentsStore.lastSync,
      });
    } catch (error) {
      stores.push({
        name: 'Students',
        isLoaded: false,
        itemCount: 0,
        loading: false,
        lastError: 'Error loading store',
        lastSync: null,
      });
    }

    try {
      // Store de Maestros (usando proxy si está disponible)
      const { useTeachersStore } = await import('../stores/teachersProxy');
      const teachersStore = useTeachersStore();
      stores.push({
        name: 'Teachers (Unified)',
        isLoaded: !!teachersStore.teachers,
        itemCount: teachersStore.teachers?.value?.length || 0,
        loading: teachersStore.loading?.value || false,
        lastError: teachersStore.error?.value || null,
        lastSync: new Date(),
      });
    } catch (error) {
      // Fallback al store original
      try {
        const { useTeachersStore } = await import('../modulos/Teachers/store/teachers');
        const teachersStore = useTeachersStore();
        stores.push({
          name: 'Teachers (Original)',
          isLoaded: !!teachersStore.teachers,
          itemCount: teachersStore.teachers?.length || 0,
          loading: teachersStore.loading,
          lastError: teachersStore.error,
          lastSync: teachersStore.lastSync,
        });
      } catch (fallbackError) {
        stores.push({
          name: 'Teachers',
          isLoaded: false,
          itemCount: 0,
          loading: false,
          lastError: 'Error loading teachers store',
          lastSync: null,
        });
      }
    }

    return stores;
  }

  /**
   * Obtiene métricas de rendimiento
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Simular métricas de rendimiento básicas
    // En una implementación real, estas vendrían de un sistema de monitoreo

    const startTime = performance.now();

    // Simular operación para medir tiempo de respuesta
    await new Promise((resolve) => setTimeout(resolve, 1));

    const responseTime = performance.now() - startTime;

    return {
      responseTime,
      cacheHitRatio: 0.85, // 85% hit ratio simulado
      errorRate: 0.02, // 2% error rate simulado
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtiene métricas de caché
   */
  private async getCacheMetrics() {
    let cacheInfo = {
      totalSize: 0,
      hitRatio: 0,
      invalidations: 0,
    };

    try {
      // Intentar obtener métricas del caché de maestros
      const { useTeacherClassCache } = await import('../composables/useTeacherClassCache');
      const cache = useTeacherClassCache();
      const diagnostics = cache.getDiagnostics();

      cacheInfo = {
        totalSize: diagnostics.cacheSize,
        hitRatio: diagnostics.hitRate,
        invalidations: diagnostics.invalidationCount,
      };
    } catch (error) {
      console.warn('No se pudieron obtener métricas de caché:', error);
    }

    return cacheInfo;
  }

  /**
   * Obtiene el estado de los servicios
   */
  private async getServicesStatus() {
    const services = {
      attendanceService: false,
      teacherCache: false,
      globalState: false,
    };

    // Verificar servicio unificado de asistencia
    try {
      const { attendanceService } = await import('../modulos/Attendance/service/attendanceUnified');
      services.attendanceService = !!attendanceService;
    } catch (error) {
      console.warn('Servicio de asistencia unificado no disponible');
    }

    // Verificar caché de maestros
    try {
      const { useTeacherClassCache } = await import('../composables/useTeacherClassCache');
      const cache = useTeacherClassCache();
      services.teacherCache = !!cache;
    } catch (error) {
      console.warn('Caché de maestros no disponible');
    }

    // Verificar estado global
    try {
      const { useGlobalState } = await import('../composables/useGlobalState');
      const globalState = useGlobalState();
      services.globalState = !!globalState;
    } catch (error) {
      console.warn('Estado global no disponible');
    }

    return services;
  }

  /**
   * Calcula el estado general del sistema
   */
  private calculateOverallStatus(
    stores: StoreStatus[],
    performance: PerformanceMetrics,
    services: any,
  ) {
    const storesLoaded = stores.filter((s) => s.isLoaded).length;
    const totalStores = stores.length;
    const loadRatio = storesLoaded / totalStores;

    const hasErrors = stores.some((s) => s.lastError);
    const servicesAvailable = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (loadRatio < 0.5 || hasErrors || servicesAvailable < totalServices / 2) {
      status = 'critical';
    } else if (loadRatio < 0.8 || performance.errorRate > 0.05) {
      status = 'warning';
    }

    return {
      status,
      uptime: Date.now() - this.startTime,
      version: '2.0.0-consolidated',
    };
  }

  /**
   * Genera recomendaciones basadas en el estado del sistema
   */
  private generateRecommendations(
    stores: StoreStatus[],
    performance: PerformanceMetrics,
    cache: any,
  ): string[] {
    const recommendations: string[] = [];

    // Verificar stores con errores
    const storesWithErrors = stores.filter((s) => s.lastError);
    if (storesWithErrors.length > 0) {
      recommendations.push(
        `Resolver errores en stores: ${storesWithErrors.map((s) => s.name).join(', ')}`,
      );
    }

    // Verificar rendimiento
    if (performance.responseTime > 100) {
      recommendations.push('Optimizar tiempo de respuesta del sistema');
    }

    if (performance.errorRate > 0.05) {
      recommendations.push('Reducir tasa de errores del sistema');
    }

    // Verificar caché
    if (cache.hitRatio < 0.8) {
      recommendations.push('Mejorar estrategia de caché para mejor rendimiento');
    }

    // Verificar stores no cargados
    const unloadedStores = stores.filter((s) => !s.isLoaded);
    if (unloadedStores.length > 0) {
      recommendations.push(
        `Cargar stores pendientes: ${unloadedStores.map((s) => s.name).join(', ')}`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistema funcionando correctamente');
    }

    return recommendations;
  }

  /**
   * Obtiene las métricas actuales
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Fuerza una actualización inmediata
   */
  async refresh() {
    await this.updateDiagnostics();
  }
}

// Instancia singleton
const systemDiagnostics = new SystemDiagnosticsManager();

/**
 * Composable para diagnósticos del sistema
 */
export function useSystemDiagnostics() {
  // Iniciar monitoreo automáticamente
  if (!systemDiagnostics.getMetrics().value) {
    systemDiagnostics.startMonitoring();
  }

  const metrics = computed(() => systemDiagnostics.getMetrics().value);

  const isHealthy = computed(() => metrics.value?.overall.status === 'healthy');
  const hasWarnings = computed(() => metrics.value?.overall.status === 'warning');
  const isCritical = computed(() => metrics.value?.overall.status === 'critical');

  return {
    // Estado
    metrics,
    isHealthy,
    hasWarnings,
    isCritical,

    // Acciones
    refresh: () => systemDiagnostics.refresh(),
    startMonitoring: (interval?: number) => systemDiagnostics.startMonitoring(interval),
    stopMonitoring: () => systemDiagnostics.stopMonitoring(),

    // Utilidades
    getStoreStatus: (storeName: string) => metrics.value?.stores.find((s) => s.name === storeName),

    getRecommendations: () => metrics.value?.recommendations || [],

    exportDiagnostics: () => JSON.stringify(metrics.value, null, 2),
  };
}

// Función de conveniencia para obtener estado rápido
export async function getSystemHealthSummary() {
  await systemDiagnostics.refresh();
  const metrics = systemDiagnostics.getMetrics().value;

  return {
    status: metrics?.overall.status || 'unknown',
    storesLoaded: metrics?.stores.filter((s) => s.isLoaded).length || 0,
    totalStores: metrics?.stores.length || 0,
    servicesActive: metrics ? Object.values(metrics.services).filter(Boolean).length : 0,
    recommendations: metrics?.recommendations.length || 0,
  };
}

export type { SystemDiagnostics, StoreStatus, PerformanceMetrics };
