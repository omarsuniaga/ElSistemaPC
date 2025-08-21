import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

import type { AttendanceDocument } from '../types';

import { db } from '@/firebase';

/**
 * Servicio optimizado para consultas de asistencia con paginación y caching
 */
class OptimizedAttendanceQueries {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<string, {data: any; timestamp: number}>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene un valor del cache si existe y no ha expirado
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Eliminar entrada expirada
    }
    return null;
  }

  /**
   * Establece un valor en el cache
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtiene documentos de asistencia con paginación optimizada
   */
  async getAttendanceDocumentsPaginated(
    startDate: string,
    endDate: string,
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ): Promise<{
    documents: AttendanceDocument[]
    lastDoc: QueryDocumentSnapshot<DocumentData> | null
    hasMore: boolean
  }> {
    try {
      console.log('[OptimizedQueries] Getting attendance documents:', {
        startDate,
        endDate,
        pageSize,
      });

      let q = query(
        collection(db, 'ASISTENCIAS'),
        where('fecha', '>=', startDate),
        where('fecha', '<=', endDate),
        orderBy('fecha', 'desc'),
        firestoreLimit(pageSize + 1), // +1 para verificar si hay más páginas
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;

      console.log('[OptimizedQueries] Firestore returned docs:', docs.length);

      const hasMore = docs.length > pageSize;
      const documents = docs.slice(0, pageSize);
      const newLastDoc = documents.length > 0 ? documents[documents.length - 1] : null;

      const attendanceDocs: AttendanceDocument[] = documents.map((doc) => ({
        id: doc.id,
        fecha: doc.data().fecha,
        classId: doc.data().classId,
        teacherId: doc.data().teacherId,
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
        data: {
          presentes: doc.data().data?.presentes || [],
          ausentes: doc.data().data?.ausentes || [],
          tarde: doc.data().data?.tarde || [],
          justificacion: doc.data().data?.justificacion || [],
          observations: doc.data().data?.observations || '',
        },
      }));

      console.log('[OptimizedQueries] Processed attendance docs:', attendanceDocs.length);

      return {
        documents: attendanceDocs,
        lastDoc: newLastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('[OptimizedQueries] Error fetching attendance documents:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de asistencia con cache
   */
  async getAttendanceStatsCached(
    startDate: string,
    endDate: string,
    classId?: string,
  ): Promise<{
    totalSessions: number
    totalStudents: number
    averageAttendance: number
    topAbsentees: Array<{studentId: string; absences: number}>
  }> {
    const cacheKey = `stats_${startDate}_${endDate}_${classId || 'all'}`;

    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      let q = query(
        collection(db, 'ASISTENCIAS'),
        where('fecha', '>=', startDate),
        where('fecha', '<=', endDate),
      );

      if (classId) {
        q = query(q, where('classId', '==', classId));
      }

      const querySnapshot = await getDocs(q);

      let totalSessions = 0;
      const studentAttendanceMap = new Map<string, {present: number; absent: number}>();
      const absenteeMap = new Map<string, number>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalSessions++;

        // Procesar presentes
        data.data?.presentes?.forEach((studentId: string) => {
          const current = studentAttendanceMap.get(studentId) || { present: 0, absent: 0 };
          studentAttendanceMap.set(studentId, { ...current, present: current.present + 1 });
        });

        // Procesar ausentes
        data.data?.ausentes?.forEach((studentId: string) => {
          const current = studentAttendanceMap.get(studentId) || { present: 0, absent: 0 };
          studentAttendanceMap.set(studentId, { ...current, absent: current.absent + 1 });

          const absences = absenteeMap.get(studentId) || 0;
          absenteeMap.set(studentId, absences + 1);
        });

        // Procesar tardanzas (contar como presentes para el promedio)
        data.data?.tarde?.forEach((studentId: string) => {
          const current = studentAttendanceMap.get(studentId) || { present: 0, absent: 0 };
          studentAttendanceMap.set(studentId, { ...current, present: current.present + 1 });
        });
      });

      const totalStudents = studentAttendanceMap.size;
      let totalPresentSessions = 0;
      let totalPossibleSessions = 0;

      studentAttendanceMap.forEach((stats) => {
        totalPresentSessions += stats.present;
        totalPossibleSessions += stats.present + stats.absent;
      });

      const averageAttendance =
        totalPossibleSessions > 0 ? (totalPresentSessions / totalPossibleSessions) * 100 : 0;

      // Top 10 absentees
      const topAbsentees = Array.from(absenteeMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([studentId, absences]) => ({ studentId, absences }));

      const result = {
        totalSessions,
        totalStudents,
        averageAttendance,
        topAbsentees,
      };

      // Guardar en cache
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Error in getAttendanceStatsCached:', error);
      throw error;
    }
  }

  /**
   * Busca estudiantes específicos con alta cantidad de ausencias
   */
  async findHighAbsenteeStudents(
    startDate: string,
    endDate: string,
    minAbsences: number = 3,
    classId?: string,
  ): Promise<Array<{studentId: string; absences: number; dates: string[]}>> {
    try {
      let q = query(
        collection(db, 'ASISTENCIAS'),
        where('fecha', '>=', startDate),
        where('fecha', '<=', endDate),
      );

      if (classId) {
        q = query(q, where('classId', '==', classId));
      }

      const querySnapshot = await getDocs(q);
      const absenteeMap = new Map<string, {count: number; dates: string[]}>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fecha = data.fecha;

        data.data?.ausentes?.forEach((studentId: string) => {
          const current = absenteeMap.get(studentId) || { count: 0, dates: [] };
          absenteeMap.set(studentId, {
            count: current.count + 1,
            dates: [...current.dates, fecha],
          });
        });
      });

      return Array.from(absenteeMap.entries())
        .filter(([, data]) => data.count >= minAbsences)
        .map(([studentId, data]) => ({
          studentId,
          absences: data.count,
          dates: data.dates.sort(),
        }))
        .sort((a, b) => b.absences - a.absences);
    } catch (error) {
      console.error('Error in findHighAbsenteeStudents:', error);
      throw error;
    }
  }

  /**
   * Busca registros de asistencia por múltiples criterios
   */
  async searchAttendance(criteria: Record<string, unknown>): Promise<AttendanceDocument[]> {
    try {
      console.log('[OptimizedQueries] Searching attendance with criteria:', criteria);

      const cacheKey = `search_${JSON.stringify(criteria)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[OptimizedQueries] Cache hit for search criteria');
        return cached;
      }

      let q = query(collection(db, 'ASISTENCIAS'));

      // Aplicar filtros basados en los criterios
      if (criteria.startDate) {
        q = query(q, where('fecha', '>=', criteria.startDate as string));
      }
      if (criteria.endDate) {
        q = query(q, where('fecha', '<=', criteria.endDate as string));
      }
      if (criteria.classId) {
        q = query(q, where('classId', '==', criteria.classId as string));
      }
      if (criteria.teacherId) {
        q = query(q, where('teacherId', '==', criteria.teacherId as string));
      }

      // Ordenar por fecha descendente
      q = query(q, orderBy('fecha', 'desc'));

      // Aplicar límite si se especifica
      if (criteria.limit) {
        q = query(q, firestoreLimit(criteria.limit as number));
      }

      const querySnapshot = await getDocs(q);
      console.log('[OptimizedQueries] Search returned docs:', querySnapshot.docs.length);

      const attendanceDocs: AttendanceDocument[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        fecha: doc.data().fecha,
        classId: doc.data().classId,
        data: {
          presentes: doc.data().data?.presentes || [],
          ausentes: doc.data().data?.ausentes || [],
          tarde: doc.data().data?.tarde || [],
          justificacion: doc.data().data?.justificacion || [],
        },
        observations: doc.data().observations || [],
      }));

      console.log('[OptimizedQueries] Processed search results:', attendanceDocs.length);

      // Cache el resultado
      this.setCache(cacheKey, attendanceDocs);

      return attendanceDocs;
    } catch (error) {
      console.error('[OptimizedQueries] Error searching attendance:', error);
      throw error;
    }
  }

  /**
   * Obtiene registros de asistencia para un estudiante específico
   */
  async getStudentAttendance(
    studentId: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
  ): Promise<AttendanceDocument[]> {
    try {
      console.log('[OptimizedQueries] Getting student attendance:', {
        studentId,
        startDate,
        endDate,
        limit,
      });

      const cacheKey = `student_${studentId}_${startDate || ''}_${endDate || ''}_${limit || ''}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[OptimizedQueries] Cache hit for student attendance');
        return cached;
      }

      let q = query(collection(db, 'ASISTENCIAS'));

      // Agregar filtros de fecha si se proporcionan
      if (startDate) {
        q = query(q, where('fecha', '>=', startDate));
      }
      if (endDate) {
        q = query(q, where('fecha', '<=', endDate));
      }

      // Ordenar por fecha descendente
      q = query(q, orderBy('fecha', 'desc'));

      // Agregar límite si se proporciona
      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      console.log('[OptimizedQueries] Firestore returned docs for student:', querySnapshot.docs.length);

      // Filtrar documentos que contengan al estudiante
      const attendanceDocs: AttendanceDocument[] = [];
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const presentes = data.data?.presentes || [];
        const ausentes = data.data?.ausentes || [];
        const tarde = data.data?.tarde || [];
        const justificacion = data.data?.justificacion || [];

        // Verificar si el estudiante está en alguna de las listas
        if (
          presentes.includes(studentId) ||
          ausentes.includes(studentId) ||
          tarde.includes(studentId) ||
          justificacion.includes(studentId)
        ) {
          attendanceDocs.push({
            id: doc.id,
            fecha: data.fecha,
            classId: data.classId,
            data: {
              presentes: presentes,
              ausentes: ausentes,
              tarde: tarde,
              justificacion: justificacion,
            },
            observations: data.observations || [],
          });
        }
      });

      console.log('[OptimizedQueries] Processed student attendance docs:', attendanceDocs.length);

      // Cache el resultado
      this.setCache(cacheKey, attendanceDocs);

      return attendanceDocs;
    } catch (error) {
      console.error('[OptimizedQueries] Error fetching student attendance:', error);
      throw error;
    }
  }

  /**
   * Verifica si existe un registro de asistencia para una clase y fecha específica
   */
  async checkAttendanceExists(classId: string, date: string): Promise<boolean> {
    try {
      console.log('[OptimizedQueries] Checking attendance exists:', { classId, date });

      const cacheKey = `exists_${classId}_${date}`;
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        console.log('[OptimizedQueries] Cache hit for exists check');
        return cached;
      }

      const q = query(
        collection(db, 'ASISTENCIAS'),
        where('classId', '==', classId),
        where('fecha', '==', date),
        firestoreLimit(1),
      );

      const querySnapshot = await getDocs(q);
      const exists = !querySnapshot.empty;

      console.log('[OptimizedQueries] Attendance exists result:', exists);

      // Cache el resultado por 5 minutos
      this.setCache(cacheKey, exists);

      return exists;
    } catch (error) {
      console.error('Error checking attendance exists:', error);
      return false;
    }
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Limpia entradas de cache expiradas
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia singleton
export const optimizedAttendanceQueries = new OptimizedAttendanceQueries();

// Limpiar cache expirado cada 10 minutos
setInterval(
  () => {
    optimizedAttendanceQueries.cleanExpiredCache();
  },
  10 * 60 * 1000,
);
