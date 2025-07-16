// src/modulos/Attendance/service/attendanceUnified.ts
/**
 * Servicio Unificado de Asistencia
 * Aborda el punto de fricción #3: Fragmentación de Servicios de Asistencia
 *
 * Este servicio consolida toda la lógica de asistencia en una API única y segura,
 * garantizando que todas las operaciones incluyan las validaciones necesarias.
 */

import {
  addDoc,
  updateDoc,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  AttendanceRecord,
  AttendanceDocument,
  AttendanceStatus,
  JustificationData,
  ClassObservationData,
} from '../types/attendance';

// Importaciones internas del módulo
import { ATTENDANCE_COLLECTION } from './attendance';

// Tipos para el servicio unificado
interface AttendanceOperationResult {
  success: boolean
  data?: any
  error?: string
  requiresPermission?: string
}

interface AttendanceServiceConfig {
  enforcePermissions: boolean
  enableOfflineMode: boolean
  autoInvalidateCache: boolean
}

/**
 * Clase principal del servicio unificado de asistencia
 */
export class UnifiedAttendanceService {
  private config: AttendanceServiceConfig;
  private permissions: Map<string, boolean> = new Map();

  constructor(config: Partial<AttendanceServiceConfig> = {}) {
    this.config = {
      enforcePermissions: true,
      enableOfflineMode: false,
      autoInvalidateCache: true,
      ...config,
    };
  }

  /**
   * Valida permisos de maestro antes de cualquier operación
   */
  private async validatePermissions(
    classId: string,
    teacherId: string,
    action: 'attendance' | 'observation' | 'history',
  ): Promise<boolean> {
    if (!this.config.enforcePermissions) return true;

    const cacheKey = `${classId}-${teacherId}-${action}`;

    // Usar caché de permisos para mejorar rendimiento
    if (this.permissions.has(cacheKey)) {
      return this.permissions.get(cacheKey)!;
    }

    try {
      // Importar dinámicamente para evitar dependencias circulares
      const {
        canTeacherRecordAttendance,
        canTeacherAddObservations,
        canTeacherViewAttendanceHistory,
      } = await import('../../Classes/service/classes');

      let hasPermission = false;

      switch (action) {
      case 'attendance':
        hasPermission = await canTeacherRecordAttendance(classId, teacherId);
        break;
      case 'observation':
        hasPermission = await canTeacherAddObservations(classId, teacherId);
        break;
      case 'history':
        hasPermission = await canTeacherViewAttendanceHistory(classId, teacherId);
        break;
      }

      // Cachear resultado por 5 minutos
      this.permissions.set(cacheKey, hasPermission);
      setTimeout(() => this.permissions.delete(cacheKey), 5 * 60 * 1000);

      return hasPermission;
    } catch (error) {
      console.error(`Error validating permissions for ${action}:`, error);
      return false;
    }
  }

  /**
   * Registra asistencia con validación de permisos integrada
   */
  async recordAttendance(
    classId: string,
    teacherId: string,
    attendanceData: Omit<AttendanceRecord, 'id' | 'recordedAt' | 'recordedBy'>,
  ): Promise<AttendanceOperationResult> {
    try {
      // Validar permisos primero
      const hasPermission = await this.validatePermissions(classId, teacherId, 'attendance');

      if (!hasPermission) {
        return {
          success: false,
          error: 'Sin permisos para registrar asistencia en esta clase',
          requiresPermission: 'attendance',
        };
      }

      // Crear el registro con metadatos
      const record: AttendanceRecord = {
        ...attendanceData,
        id: '', // Se generará automáticamente
        recordedAt: serverTimestamp() as Timestamp,
        recordedBy: teacherId,
        version: 1,
        metadata: {
          source: 'unified-service',
          permissions: 'validated',
          ...attendanceData.metadata,
        },
      };

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), record);

      // Invalidar caché si está habilitado
      if (this.config.autoInvalidateCache) {
        await this.invalidateCache(classId, attendanceData.date);
      }

      return {
        success: true,
        data: { id: docRef.id, ...record },
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Actualiza un registro de asistencia existente
   */
  async updateAttendance(
    attendanceId: string,
    classId: string,
    teacherId: string,
    updates: Partial<AttendanceRecord>,
  ): Promise<AttendanceOperationResult> {
    try {
      const hasPermission = await this.validatePermissions(classId, teacherId, 'attendance');

      if (!hasPermission) {
        return {
          success: false,
          error: 'Sin permisos para actualizar asistencia en esta clase',
          requiresPermission: 'attendance',
        };
      }

      const updateData = {
        ...updates,
        lastModifiedAt: serverTimestamp(),
        lastModifiedBy: teacherId,
        version: (updates.version || 1) + 1,
      };

      await updateDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId), updateData);

      if (this.config.autoInvalidateCache) {
        await this.invalidateCache(classId, updates.date || '');
      }

      return {
        success: true,
        data: { id: attendanceId, ...updateData },
      };
    } catch (error) {
      console.error('Error updating attendance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene el historial de asistencia con validación de permisos
   */
  async getAttendanceHistory(
    classId: string,
    teacherId: string,
    options: {
      startDate?: string
      endDate?: string
      studentId?: string
      limit?: number
    } = {},
  ): Promise<AttendanceOperationResult> {
    try {
      const hasPermission = await this.validatePermissions(classId, teacherId, 'history');

      if (!hasPermission) {
        return {
          success: false,
          error: 'Sin permisos para ver historial de asistencia',
          requiresPermission: 'history',
        };
      }

      let attendanceQuery = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('classId', '==', classId),
      );

      // Aplicar filtros opcionales
      if (options.startDate) {
        attendanceQuery = query(attendanceQuery, where('date', '>=', options.startDate));
      }

      if (options.endDate) {
        attendanceQuery = query(attendanceQuery, where('date', '<=', options.endDate));
      }

      if (options.studentId) {
        attendanceQuery = query(attendanceQuery, where('studentId', '==', options.studentId));
      }

      // Ordenar por fecha descendente
      attendanceQuery = query(attendanceQuery, orderBy('date', 'desc'));

      if (options.limit) {
        attendanceQuery = query(attendanceQuery, limit(options.limit));
      }

      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceRecord[];

      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Agrega una observación a la clase con validación
   */
  async addClassObservation(
    classId: string,
    teacherId: string,
    observationData: Omit<ClassObservationData, 'id' | 'createdAt' | 'authorId'>,
  ): Promise<AttendanceOperationResult> {
    try {
      const hasPermission = await this.validatePermissions(classId, teacherId, 'observation');

      if (!hasPermission) {
        return {
          success: false,
          error: 'Sin permisos para agregar observaciones a esta clase',
          requiresPermission: 'observation',
        };
      }

      const observation: ClassObservationData = {
        ...observationData,
        id: '',
        createdAt: serverTimestamp() as Timestamp,
        authorId: teacherId,
        classId,
      };

      const docRef = await addDoc(collection(db, 'observations'), observation);

      return {
        success: true,
        data: { id: docRef.id, ...observation },
      };
    } catch (error) {
      console.error('Error adding observation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Elimina un registro de asistencia
   */
  async deleteAttendance(
    attendanceId: string,
    classId: string,
    teacherId: string,
  ): Promise<AttendanceOperationResult> {
    try {
      const hasPermission = await this.validatePermissions(classId, teacherId, 'attendance');

      if (!hasPermission) {
        return {
          success: false,
          error: 'Sin permisos para eliminar registros de asistencia',
          requiresPermission: 'attendance',
        };
      }

      await deleteDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId));

      if (this.config.autoInvalidateCache) {
        await this.invalidateCache(classId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Invalida el caché de asistencia (para integración con otros sistemas)
   */
  private async invalidateCache(classId: string, date?: string): Promise<void> {
    try {
      // Importar dinámicamente el composable de caché si existe
      const { useTeacherClassCache } = await import('../../../composables/useTeacherClassCache');
      const cache = useTeacherClassCache();

      // Invalidar caché relacionado con la clase
      await cache.invalidateOnEvent('class-updated');

      console.log(`🔄 Caché invalidado para clase ${classId}${date ? ` en fecha ${date}` : ''}`);
    } catch (error) {
      // Si no existe el composable de caché, simplemente log
      console.log('Cache invalidation skipped - no cache system available');
    }
  }

  /**
   * Limpia el caché de permisos
   */
  clearPermissionsCache(): void {
    this.permissions.clear();
    console.log('🧹 Caché de permisos limpiado');
  }

  /**
   * Obtiene diagnósticos del servicio
   */
  getDiagnostics() {
    return {
      config: this.config,
      cachedPermissions: this.permissions.size,
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString(),
    };
  }
}

// Instancia singleton del servicio
export const attendanceService = new UnifiedAttendanceService();

// Funciones de conveniencia que usan el servicio unificado
export const recordAttendance = (
  classId: string,
  teacherId: string,
  attendanceData: Omit<AttendanceRecord, 'id' | 'recordedAt' | 'recordedBy'>,
) => attendanceService.recordAttendance(classId, teacherId, attendanceData);

export const updateAttendance = (
  attendanceId: string,
  classId: string,
  teacherId: string,
  updates: Partial<AttendanceRecord>,
) => attendanceService.updateAttendance(attendanceId, classId, teacherId, updates);

export const getAttendanceHistory = (
  classId: string,
  teacherId: string,
  options?: Parameters<UnifiedAttendanceService['getAttendanceHistory']>[2],
) => attendanceService.getAttendanceHistory(classId, teacherId, options);

export const addClassObservation = (
  classId: string,
  teacherId: string,
  observationData: Omit<ClassObservationData, 'id' | 'createdAt' | 'authorId'>,
) => attendanceService.addClassObservation(classId, teacherId, observationData);

export const deleteAttendance = (attendanceId: string, classId: string, teacherId: string) =>
  attendanceService.deleteAttendance(attendanceId, classId, teacherId);

// Exportar tipos útiles
export type { AttendanceOperationResult, AttendanceServiceConfig };
