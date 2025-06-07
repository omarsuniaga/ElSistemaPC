import { ref, computed } from 'vue';
import { optimizedAttendanceQueries } from '../services/optimizedQueries';
import type { AttendanceDocument } from '../types';

/**
 * Composable para búsquedas optimizadas de asistencia
 */
export function useOptimizedAttendance() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const documents = ref<AttendanceDocument[]>([]);
  const hasMore = ref(false);
  const lastDoc = ref<any>(null);

  /**
   * Busca documentos de asistencia por rango de fechas con paginación
   */
  const searchByDateRange = async (
    startDate: string,
    endDate: string,
    pageSize: number = 50,
    reset: boolean = true
  ) => {
    try {
      console.log('[useOptimizedAttendance] Searching by date range:', { startDate, endDate, pageSize, reset });
      loading.value = true;
      error.value = null;

      if (reset) {
        documents.value = [];
        lastDoc.value = null;
      }

      const result = await optimizedAttendanceQueries.getAttendanceDocumentsPaginated(
        startDate,
        endDate,
        pageSize,
        lastDoc.value
      );

      console.log('[useOptimizedAttendance] Query result:', {
        documentsCount: result.documents.length,
        hasMore: result.hasMore
      });

      if (reset) {
        documents.value = result.documents;
      } else {
        documents.value.push(...result.documents);
      }

      lastDoc.value = result.lastDoc;
      hasMore.value = result.hasMore;

      return result.documents;
    } catch (err: any) {
      console.error('[useOptimizedAttendance] Error in searchByDateRange:', err);
      error.value = `Error al buscar asistencias: ${err.message || err}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Carga más documentos (paginación)
   */
  const loadMore = async (
    startDate: string,
    endDate: string,
    pageSize: number = 50
  ) => {
    if (!hasMore.value || loading.value) return;
    return await searchByDateRange(startDate, endDate, pageSize, false);
  };

  /**
   * Obtiene estadísticas optimizadas
   */
  const getStats = async (
    startDate: string,
    endDate: string,
    classId?: string
  ) => {
    try {
      loading.value = true;
      error.value = null;

      return await optimizedAttendanceQueries.getAttendanceStatsCached(
        startDate,
        endDate,
        classId
      );
    } catch (err: any) {
      error.value = `Error al obtener estadísticas: ${err.message || err}`;
      console.error('Error in getStats:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Encuentra estudiantes con alta ausencia
   */
  const findHighAbsentees = async (
    startDate: string,
    endDate: string,
    minAbsences: number = 3,
    classId?: string
  ) => {
    try {
      loading.value = true;
      error.value = null;

      return await optimizedAttendanceQueries.findHighAbsenteeStudents(
        startDate,
        endDate,
        minAbsences,
        classId
      );
    } catch (err: any) {
      error.value = `Error al buscar estudiantes con alta ausencia: ${err.message || err}`;
      console.error('Error in findHighAbsentees:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  /**
   * Obtiene registros de un estudiante específico del conjunto actual
   */
  const getStudentRecords = computed(() => {
    return (studentId: string) => {
      const records: any[] = [];
      
      documents.value.forEach(doc => {
        // Verificar en presentes
        if (doc.data.presentes?.includes(studentId)) {
          records.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_presente`,
            Fecha: doc.fecha,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: 'Presente',
            createdAt: new Date() // Default since createdAt is not in document structure
          });
        }
        
        // Verificar en ausentes
        if (doc.data.ausentes?.includes(studentId)) {
          const justification = doc.data.justificacion?.find((j: any) => j.id === studentId);
          records.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_ausente`,
            Fecha: doc.fecha,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: justification ? 'Justificado' : 'Ausente',
            justification: justification?.reason,
            createdAt: new Date() // Default since createdAt is not in document structure
          });
        }
        
        // Verificar en tarde
        if (doc.data.tarde?.includes(studentId)) {
          const justification = doc.data.justificacion?.find((j: any) => j.id === studentId);
          records.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_tarde`,
            Fecha: doc.fecha,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: justification ? 'Justificado' : 'Tardanza',
            justification: justification?.reason,
            createdAt: new Date() // Default since createdAt is not in document structure
          });
        }
      });
      
      return records.sort((a: any, b: any) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime());
    };
  });

  /**
   * Limpia los datos
   */
  const reset = () => {
    documents.value = [];
    lastDoc.value = null;
    hasMore.value = false;
    error.value = null;
  };
  /**
   * Verifica si existe un registro de asistencia para una clase y fecha específica
   */
  const checkAttendanceExists = async (classId: string, date: string): Promise<boolean> => {
    try {
      console.log('[useOptimizedAttendance] Checking attendance exists for:', { classId, date });
      
      // Primero buscar en documentos ya cargados
      const existingDoc = documents.value.find(doc => 
        doc.classId === classId && doc.fecha === date
      );
      
      if (existingDoc) {
        console.log('[useOptimizedAttendance] Found existing document:', existingDoc.id);
        return true;
      }
      
      // Si no está en cache, hacer query específico
      const result = await optimizedAttendanceQueries.checkAttendanceExists(classId, date);
      console.log('[useOptimizedAttendance] Query result for attendance exists:', result);
      
      return result;
    } catch (err: any) {
      console.error('[useOptimizedAttendance] Error checking attendance exists:', err);
      return false;
    }
  };

  /**
   * Obtiene registros filtrados por múltiples criterios
   */
  const getFilteredRecords = computed(() => {
    return (filters: {
      classId?: string;
      studentId?: string;
      status?: string;
    }) => {
      let filteredDocs = documents.value;

      if (filters.classId) {
        filteredDocs = filteredDocs.filter((doc: any) => doc.classId === filters.classId);
      }

      const records: any[] = [];
      
      filteredDocs.forEach((doc: any) => {
        // Procesar presentes
        doc.data.presentes?.forEach((studentId: string) => {
          if (!filters.studentId || studentId === filters.studentId) {
            if (!filters.status || 'Presente' === filters.status) {
              records.push({
                id: `${doc.fecha}_${doc.classId}_${studentId}_presente`,
                Fecha: doc.fecha,
                classId: doc.classId,
                studentId,
                status: 'Presente'
              });
            }
          }
        });
        
        // Procesar ausentes
        doc.data.ausentes?.forEach((studentId: string) => {
          const justification = doc.data.justificacion?.find((j: any) => j.id === studentId);
          const status = justification ? 'Justificado' : 'Ausente';
          
          if (!filters.studentId || studentId === filters.studentId) {
            if (!filters.status || status === filters.status) {
              records.push({
                id: `${doc.fecha}_${doc.classId}_${studentId}_ausente`,
                Fecha: doc.fecha,
                classId: doc.classId,
                studentId,
                status,
                justification: justification?.reason
              });
            }
          }
        });
        
        // Procesar tarde
        doc.data.tarde?.forEach((studentId: string) => {
          const justification = doc.data.justificacion?.find((j: any) => j.id === studentId);
          const status = justification ? 'Justificado' : 'Tardanza';
          
          if (!filters.studentId || studentId === filters.studentId) {
            if (!filters.status || status === filters.status) {
              records.push({
                id: `${doc.fecha}_${doc.classId}_${studentId}_tarde`,
                Fecha: doc.fecha,
                classId: doc.classId,
                studentId,
                status,
                justification: justification?.reason
              });
            }
          }
        });
      });
      
      return records.sort((a: any, b: any) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime());
    };
  });
  return {
    // Estado
    loading,
    error,
    documents,
    hasMore,
    
    // Métodos
    searchByDateRange,
    loadMore,
    getStats,
    findHighAbsentees,
    checkAttendanceExists,
    reset,
    
    // Computadas
    getStudentRecords,
    getFilteredRecords
  };
}
