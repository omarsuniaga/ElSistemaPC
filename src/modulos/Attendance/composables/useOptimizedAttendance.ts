import type { DocumentData, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, computed } from 'vue';

import { optimizedAttendanceQueries } from '../services/optimizedQueries';
import type { AttendanceDocument } from '../types/attendance';

// Definir tipos para los parámetros de búsqueda
interface ISearchCriteria {
  [key: string]: unknown;
}

interface IAttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface IPaginatedResult<T> {
  documents: T[];
  hasMore: boolean;
  lastDoc: DocumentReference<DocumentData> | null;
  error?: string;
}

/**
 * Composable para búsquedas optimizadas de asistencia
 * useOptimizedAttendance.ts
*/
export function useOptimizedAttendance() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const documents = ref<AttendanceDocument[]>([]);
  const hasMore = ref(false);
  const lastDoc = ref<DocumentReference<DocumentData> | null>(null);

  /**
   * Busca documentos de asistencia por rango de fechas con paginación
   */
  const searchByDateRange = async (
    startDate: string,
    endDate: string,
    pageSize = 50,
    reset = true,
  ): Promise<IPaginatedResult<AttendanceDocument>> => {
    try {
      console.log('[useOptimizedAttendance] Searching by date range:', {
        startDate,
        endDate,
        pageSize,
        reset,
      });
      loading.value = true;
      error.value = null;

      if (reset) {
        documents.value = [];
        lastDoc.value = null;
      }

      // Asegurarse de que lastDoc.value sea del tipo correcto
      const lastDocValue = lastDoc.value as unknown as QueryDocumentSnapshot<DocumentData> | undefined;
      
      const result = await optimizedAttendanceQueries.getAttendanceDocumentsPaginated(
        startDate,
        endDate,
        pageSize,
        lastDocValue,
      );

      console.log('[useOptimizedAttendance] Query result:', {
        documentsCount: result.documents.length,
        hasMore: result.hasMore,
      });

      documents.value = [...documents.value, ...result.documents];
      hasMore.value = result.hasMore;
      lastDoc.value = result.lastDoc;

      return {
        documents: result.documents,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al buscar por rango de fechas';
      console.error('[useOptimizedAttendance] Error searching by date range:', err);
      error.value = errorMessage;
      return {
        documents: [],
        hasMore: false,
        lastDoc: null,
        error: error.value,
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Obtiene los registros de asistencia de un estudiante específico
   */
  const getStudentRecords = async (
    studentId: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ) => {
    try {
      loading.value = true;
      error.value = null;

      const result = await optimizedAttendanceQueries.getStudentAttendance(
        studentId,
        options.startDate as string | undefined,
        options.endDate as string | undefined,
        options.limit as number | undefined,
      );

      documents.value = result;
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener registros del estudiante';
      console.error('[useOptimizedAttendance] Error getting student records:', err);
      error.value = errorMessage;
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Busca asistencias por múltiples criterios
   */
  const searchByCriteria = async (criteria: ISearchCriteria): Promise<AttendanceDocument[]> => {
    try {
      loading.value = true;
      error.value = null;

      const result = await optimizedAttendanceQueries.searchAttendance(criteria as Record<string, unknown>);
      documents.value = result;
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al buscar por criterios';
      console.error('[useOptimizedAttendance] Error searching by criteria:', err);
      error.value = errorMessage;
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Obtiene estadísticas de asistencia
   */
  const getAttendanceStats = async (filters: ISearchCriteria = {}): Promise<IAttendanceStats | null> => {
    try {
      loading.value = true;
      error.value = null;

      return await optimizedAttendanceQueries.getAttendanceStatsCached(filters);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener estadísticas';
      console.error('[useOptimizedAttendance] Error getting attendance stats:', err);
      error.value = errorMessage;
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Propiedades computadas
  const totalRecords = computed(() => documents.value.length);
  const hasError = computed(() => error.value !== null);

  // Limpiar el estado
  const reset = () => {
    documents.value = [];
    error.value = null;
    hasMore.value = false;
    lastDoc.value = null;
  };

  return {
    // State
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    documents: computed(() => documents.value),
    totalRecords,
    hasMore: computed(() => hasMore.value),
    hasError,

    // Methods
    searchByDateRange,
    getStudentRecords,
    searchByCriteria,
    getAttendanceStats,
    reset,
  };
}
