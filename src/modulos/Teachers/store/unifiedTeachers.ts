/**
 * Store Unificado de Maestros
 * Aborda el punto de fricción #1: Duplicación de Stores de Maestros
 *
 * Este store consolida la funcionalidad de:
 * - src/modulos/Teachers/store/teachers.ts
 * - src/modulos/Admin/store/teachers.ts
 * - src/stores/teachers.ts
 *
 * Proporciona una API unificada que mantiene compatibilidad con código existente
 * mientras elimina la duplicación y mejora la consistencia.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../../firebase';

// Tipos
import type { TeacherData, TeacherStatus } from '../types/teachers';
import type { TeacherScheduleSummary } from '../types/teachers';

// Servicios
import {
  addTeacherToFirebase,
  updateTeacherInFirebase,
  deleteTeacherFromFirebase,
  fetchTeachersFromFirebase,
  fetchTeacherByIdFromFirebase,
} from '../services/teachers';

/**
 * Configuración del store unificado
 */
interface UnifiedTeachersConfig {
  enableCache: boolean
  enableMetrics: boolean
  enableAdvancedFeatures: boolean
  cacheTimeout: number // en minutos
}

/**
 * Métricas del store para diagnóstico
 */
interface StoreMetrics {
  totalOperations: number
  cacheHits: number
  cacheMisses: number
  lastSync: Date | null
  averageResponseTime: number
}

/**
 * Filtros avanzados para maestros
 */
interface TeacherFilters {
  searchTerm: string
  status: TeacherStatus | 'all'
  specialty: string
  experience: {min: number; max: number}
  availability: string
  assignedClasses: {min: number; max: number}
}

export const useUnifiedTeachersStore = defineStore('unifiedTeachers', () => {
  // === CONFIGURACIÓN ===
  const config = ref<UnifiedTeachersConfig>({
    enableCache: true,
    enableMetrics: true,
    enableAdvancedFeatures: true,
    cacheTimeout: 15, // 15 minutos
  });

  // === ESTADO PRINCIPAL ===
  const teachers = ref<TeacherData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastSync = ref<Date | null>(null);

  // === ESTADO AVANZADO ===
  const metrics = ref<StoreMetrics>({
    totalOperations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastSync: null,
    averageResponseTime: 0,
  });

  const filters = ref<TeacherFilters>({
    searchTerm: '',
    status: 'all',
    specialty: '',
    experience: { min: 0, max: 50 },
    availability: '',
    assignedClasses: { min: 0, max: 100 },
  });

  // === CACHÉ ===
  const cache = ref(new Map<string, {data: any; timestamp: Date}>());

  // === GETTERS BÁSICOS (Compatibilidad) ===
  const items = computed(() => teachers.value);

  const activeTeachers = computed(() =>
    teachers.value.filter((teacher) => teacher.status === 'activo' || teacher.status === 'active'),
  );

  const getTeacherByName = computed(() => (name: string) => {
    return teachers.value.find((teacher) =>
      (teacher.name || '').toLowerCase().includes(name.toLowerCase()),
    );
  });

  const getTeacherById = computed(() => (id: string) => {
    return teachers.value.find((teacher) => teacher.id === id);
  });

  // === GETTERS AVANZADOS ===
  const filteredTeachers = computed(() => {
    let result = [...teachers.value];

    // Aplicar filtros
    if (filters.value.searchTerm) {
      const term = filters.value.searchTerm.toLowerCase();
      result = result.filter(
        (teacher) =>
          (teacher.name || '').toLowerCase().includes(term) ||
          (teacher.email || '').toLowerCase().includes(term) ||
          (teacher.specialty || []).some((s) => s.toLowerCase().includes(term)),
      );
    }

    if (filters.value.status !== 'all') {
      result = result.filter((teacher) => teacher.status === filters.value.status);
    }

    if (filters.value.specialty) {
      result = result.filter((teacher) =>
        (teacher.specialty || []).includes(filters.value.specialty),
      );
    }

    // Filtrar por experiencia
    result = result.filter((teacher) => {
      const exp = teacher.experience || 0;
      return exp >= filters.value.experience.min && exp <= filters.value.experience.max;
    });

    return result;
  });

  const teacherStats = computed(() => ({
    total: teachers.value.length,
    active: activeTeachers.value.length,
    inactive: teachers.value.filter((t) => t.status === 'inactivo' || t.status === 'inactive')
      .length,
    pending: teachers.value.filter((t) => t.status === 'pendiente' || t.status === 'pending')
      .length,
    totalSpecialties: new Set(teachers.value.flatMap((t) => t.specialty || [])).size,
    averageExperience:
      teachers.value.reduce((sum, t) => sum + (t.experience || 0), 0) / teachers.value.length || 0,
  }));

  const topPerformingTeachers = computed(() => {
    return teachers.value
      .filter((t) => t.performance && t.performance.rating)
      .sort((a, b) => (b.performance?.rating || 0) - (a.performance?.rating || 0))
      .slice(0, 5);
  });

  // === UTILIDADES DE CACHÉ ===
  const getCacheKey = (operation: string, params?: any): string => {
    return `${operation}-${params ? JSON.stringify(params) : 'all'}`;
  };

  const getFromCache = <T>(key: string): T | null => {
    if (!config.value.enableCache) return null;

    const cached = cache.value.get(key);
    if (!cached) {
      metrics.value.cacheMisses++;
      return null;
    }

    const isExpired =
      Date.now() - cached.timestamp.getTime() > config.value.cacheTimeout * 60 * 1000;
    if (isExpired) {
      cache.value.delete(key);
      metrics.value.cacheMisses++;
      return null;
    }

    metrics.value.cacheHits++;
    return cached.data as T;
  };

  const setCache = (key: string, data: any): void => {
    if (!config.value.enableCache) return;
    cache.value.set(key, { data, timestamp: new Date() });
  };

  const invalidateCache = (pattern?: string): void => {
    if (pattern) {
      for (const [key] of cache.value) {
        if (key.includes(pattern)) {
          cache.value.delete(key);
        }
      }
    } else {
      cache.value.clear();
    }
  };

  // === UTILIDADES DE RENDIMIENTO ===
  const withLoading = async <T>(operation: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    loading.value = true;
    error.value = null;
    metrics.value.totalOperations++;

    try {
      const result = await operation();

      // Actualizar métricas de rendimiento
      const responseTime = Date.now() - startTime;
      metrics.value.averageResponseTime =
        (metrics.value.averageResponseTime * (metrics.value.totalOperations - 1) + responseTime) /
        metrics.value.totalOperations;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // === ACCIONES PRINCIPALES ===

  /**
   * Obtiene todos los maestros (con caché inteligente)
   */
  const fetchTeachers = async (forceRefresh = false): Promise<TeacherData[]> => {
    return withLoading(async () => {
      const cacheKey = getCacheKey('fetchTeachers');

      if (!forceRefresh) {
        const cached = getFromCache<TeacherData[]>(cacheKey);
        if (cached) return cached;
      }

      const fetchedTeachers = await fetchTeachersFromFirebase();
      const normalizedTeachers = fetchedTeachers.map(normalizeTeacherData);

      teachers.value = normalizedTeachers;
      lastSync.value = new Date();
      metrics.value.lastSync = lastSync.value;

      setCache(cacheKey, normalizedTeachers);
      return normalizedTeachers;
    });
  };

  /**
   * Obtiene un maestro por ID (con caché)
   */
  const fetchTeacherById = async (id: string): Promise<TeacherData | null> => {
    return withLoading(async () => {
      const cacheKey = getCacheKey('fetchTeacherById', { id });

      const cached = getFromCache<TeacherData>(cacheKey);
      if (cached) return cached;

      const teacher = await fetchTeacherByIdFromFirebase(id);
      if (teacher) {
        const normalized = normalizeTeacherData(teacher);
        setCache(cacheKey, normalized);
        return normalized;
      }

      return null;
    });
  };

  /**
   * Agrega un nuevo maestro
   */
  const addTeacher = async (teacherData: Omit<TeacherData, 'id'>): Promise<string> => {
    return withLoading(async () => {
      const id = await addTeacherToFirebase(teacherData);

      // Actualizar estado local
      teachers.value.push({ ...teacherData, id });

      // Invalidar caché relacionado
      invalidateCache('fetchTeachers');

      return id;
    });
  };

  /**
   * Actualiza un maestro existente
   */
  const updateTeacher = async (id: string, updates: Partial<TeacherData>): Promise<void> => {
    return withLoading(async () => {
      await updateTeacherInFirebase(id, updates);

      // Actualizar estado local
      const index = teachers.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        teachers.value[index] = { ...teachers.value[index], ...updates };
      }

      // Invalidar caché relacionado
      invalidateCache('fetchTeachers');
      invalidateCache('fetchTeacherById');
    });
  };

  /**
   * Elimina un maestro
   */
  const deleteTeacher = async (id: string): Promise<void> => {
    return withLoading(async () => {
      await deleteTeacherFromFirebase(id);

      // Actualizar estado local
      teachers.value = teachers.value.filter((t) => t.id !== id);

      // Invalidar caché relacionado
      invalidateCache('fetchTeachers');
      invalidateCache('fetchTeacherById');
    });
  };

  /**
   * Obtiene el maestro actual autenticado
   */
  const getCurrentTeacher = async (): Promise<TeacherData | null> => {
    const { useAuthStore } = await import('../../../stores/auth');
    const authStore = useAuthStore();

    const currentUID = authStore.user?.uid;
    if (!currentUID) return null;

    // Buscar en maestros cargados primero
    const teacherByUID = teachers.value.find((t) => t.uid === currentUID);
    if (teacherByUID) return teacherByUID;

    // Buscar en Firestore
    const q = query(collection(db, 'MAESTROS'), where('uid', '==', currentUID));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const teacherDoc = snapshot.docs[0];
      const teacherData = normalizeTeacherData({ id: teacherDoc.id, ...teacherDoc.data() });

      // Agregar a la lista si no existe
      if (!teachers.value.find((t) => t.id === teacherData.id)) {
        teachers.value.push(teacherData);
      }

      return teacherData;
    }

    return null;
  };

  /**
   * Búsqueda inteligente de maestros
   */
  const searchTeachers = async (
    query: string,
    options?: {
      includeInactive?: boolean
      specialty?: string
      limit?: number
    },
  ): Promise<TeacherData[]> => {
    const cacheKey = getCacheKey('searchTeachers', { query, options });

    const cached = getFromCache<TeacherData[]>(cacheKey);
    if (cached) return cached;

    let results = teachers.value;

    // Filtrar por estado si es necesario
    if (!options?.includeInactive) {
      results = results.filter((t) => t.status === 'activo' || t.status === 'active');
    }

    // Filtrar por especialidad
    if (options?.specialty) {
      results = results.filter((t) => (t.specialty || []).includes(options.specialty!));
    }

    // Búsqueda por texto
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(
        (teacher) =>
          (teacher.name || '').toLowerCase().includes(searchTerm) ||
          (teacher.email || '').toLowerCase().includes(searchTerm) ||
          (teacher.specialty || []).some((s) => s.toLowerCase().includes(searchTerm)),
      );
    }

    // Aplicar límite
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    setCache(cacheKey, results);
    return results;
  };

  // === FUNCIONES DE COMPATIBILIDAD ===

  // Para compatibilidad con el store anterior
  const fetchItems = fetchTeachers;
  const addItem = addTeacher;
  const updateItem = updateTeacher;
  const deleteItem = deleteTeacher;

  // === FILTROS Y CONFIGURACIÓN ===

  /**
   * Actualiza filtros
   */
  const updateFilters = (newFilters: Partial<TeacherFilters>): void => {
    filters.value = { ...filters.value, ...newFilters };
  };

  /**
   * Limpia filtros
   */
  const clearFilters = (): void => {
    filters.value = {
      searchTerm: '',
      status: 'all',
      specialty: '',
      experience: { min: 0, max: 50 },
      availability: '',
      assignedClasses: { min: 0, max: 100 },
    };
  };

  /**
   * Actualiza configuración del store
   */
  const updateConfig = (newConfig: Partial<UnifiedTeachersConfig>): void => {
    config.value = { ...config.value, ...newConfig };

    if (!newConfig.enableCache) {
      cache.value.clear();
    }
  };

  // === UTILIDADES Y DIAGNÓSTICOS ===

  /**
   * Obtiene métricas del store
   */
  const getMetrics = (): StoreMetrics & {cacheSize: number} => ({
    ...metrics.value,
    cacheSize: cache.value.size,
  });

  /**
   * Exporta datos de maestros
   */
  const exportTeachersData = (format: 'csv' | 'json' = 'csv') => {
    if (format === 'json') {
      return teachers.value;
    }

    // CSV export
    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Especialidades', 'Experiencia', 'Estado'];
    const rows = teachers.value.map((teacher) => [
      teacher.id,
      teacher.name || '',
      teacher.email || '',
      teacher.phone || '',
      (teacher.specialty || []).join(', '),
      teacher.experience || 0,
      teacher.status || '',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  /**
   * Reset completo del store
   */
  const $reset = (): void => {
    teachers.value = [];
    loading.value = false;
    error.value = null;
    lastSync.value = null;
    cache.value.clear();
    clearFilters();

    metrics.value = {
      totalOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastSync: null,
      averageResponseTime: 0,
    };
  };

  // === INTEGRACIÓN CON OTROS MÓDULOS ===

  /**
   * Obtiene las clases de un maestro
   */
  const getTeacherClasses = async (teacherId: string) => {
    const { useClassesStore } = await import('../../Classes/store/classes');
    const classesStore = useClassesStore();

    await classesStore.fetchClasses();
    return classesStore.classes.filter((cls) => cls.teacherId === teacherId);
  };

  /**
   * Obtiene el horario de un maestro
   */
  const getTeacherSchedule = async (teacherId: string): Promise<TeacherScheduleSummary> => {
    const { useScheduleStore } = await import('../../Schedules/store/schedule');
    const scheduleStore = useScheduleStore();

    return scheduleStore.getTeacherSchedule(teacherId);
  };

  return {
    // Estado
    teachers,
    loading,
    error,
    lastSync,
    filters,
    config,

    // Getters básicos (compatibilidad)
    items,
    activeTeachers,
    getTeacherByName,
    getTeacherById,

    // Getters avanzados
    filteredTeachers,
    teacherStats,
    topPerformingTeachers,

    // Acciones principales
    fetchTeachers,
    fetchTeacherById,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    getCurrentTeacher,
    searchTeachers,

    // Compatibilidad
    fetchItems,
    addItem,
    updateItem,
    deleteItem,

    // Filtros y configuración
    updateFilters,
    clearFilters,
    updateConfig,

    // Utilidades
    getMetrics,
    exportTeachersData,
    invalidateCache,
    $reset,

    // Integración
    getTeacherClasses,
    getTeacherSchedule,
  };
});

/**
 * Función para normalizar datos de maestros desde Firebase
 */
function normalizeTeacherData(teacher: any): TeacherData {
  return {
    id: teacher.id,
    name: teacher.name || teacher.nombre || '',
    email: teacher.email || '',
    phone: teacher.phone || teacher.telefono || '',
    uid: teacher.uid || '',
    status: normalizeStatus(teacher.status || teacher.estado),
    specialty: Array.isArray(teacher.specialty)
      ? teacher.specialty
      : Array.isArray(teacher.especialidad)
        ? teacher.especialidad
        : typeof teacher.specialty === 'string'
          ? [teacher.specialty]
          : [],
    experience:
      typeof teacher.experience === 'number'
        ? teacher.experience
        : typeof teacher.experiencia === 'number'
          ? teacher.experiencia
          : 0,
    bio: teacher.bio || teacher.biografia || '',
    profileImage: teacher.profileImage || teacher.imagen || '',
    createdAt:
      teacher.createdAt instanceof Date
        ? teacher.createdAt
        : teacher.createdAt?.toDate?.()
          ? teacher.createdAt.toDate()
          : new Date(),
    updatedAt:
      teacher.updatedAt instanceof Date
        ? teacher.updatedAt
        : teacher.updatedAt?.toDate?.()
          ? teacher.updatedAt.toDate()
          : new Date(),
    performance: teacher.performance || null,
    schedule: teacher.schedule || null,
    availability: teacher.availability || [],
    assignedClasses: teacher.assignedClasses || [],
  };
}

/**
 * Normaliza el estado del maestro
 */
function normalizeStatus(status: any): TeacherStatus {
  const statusStr = String(status || '').toLowerCase();

  switch (statusStr) {
  case 'activo':
  case 'active':
    return 'activo';
  case 'inactivo':
  case 'inactive':
    return 'inactivo';
  case 'pendiente':
  case 'pending':
    return 'pendiente';
  default:
    return 'activo';
  }
}

// Alias para migración gradual desde stores existentes
export const useTeachersStore = useUnifiedTeachersStore;
export const useAdminTeachersStore = useUnifiedTeachersStore;

export type { TeacherFilters, UnifiedTeachersConfig, StoreMetrics };
