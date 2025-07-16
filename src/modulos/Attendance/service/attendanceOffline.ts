// src/modulos/Attendance/service/attendanceOffline.ts
import { CacheManager } from '../../../utils/cacheManager';
import { BackgroundSync } from '../../../utils/backgroundSync';
import { OfflineMode } from '../../../utils/offlineMode';
import {
  getAttendanceDocumentFirebase,
  saveAttendanceDocumentFirebase,
  getAllAttendanceDocumentsFirebase,
  updateObservationsFirebase,
} from './attendance';
import type { AttendanceDocument, JustificationData } from '../types/attendance';
import { format, parseISO } from 'date-fns';
import { serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../stores/auth';

// Constantes para claves de caché
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const CACHE_PREFIX = {
  ALL_ATTENDANCE: 'attendance_all',
  SINGLE_ATTENDANCE: 'attendance_doc',
  OBSERVATIONS: 'attendance_observations',
};

/**
 * Obtiene un documento de asistencia con soporte offline
 */
export const getAttendanceDocumentOffline = async (
  fecha: string,
  classId: string,
): Promise<AttendanceDocument | null> => {
  try {
    // Generar clave de caché específica para este documento
    const params = { fecha, classId };

    // Intentar obtener del caché primero
    const cachedDoc = CacheManager.getFromCache<AttendanceDocument>(
      CACHE_PREFIX.SINGLE_ATTENDANCE,
      params,
    );

    // Si está en caché y no estamos forzando recarga, usar caché
    if (cachedDoc) {
      console.log(`[Offline] Usando documento en caché para ${fecha}_${classId}`);
      return cachedDoc;
    }

    // Si estamos offline, no podemos obtener datos nuevos
    if (OfflineMode.isOfflineMode()) {
      console.log(`[Offline] En modo offline, sin datos en caché para ${fecha}_${classId}`);
      return null;
    }

    // Intentar obtener de Firestore
    const doc = await getAttendanceDocumentFirebase(fecha, classId);

    // Si se obtiene correctamente, guardar en caché
    if (doc) {
      CacheManager.saveToCache(CACHE_PREFIX.SINGLE_ATTENDANCE, doc, params);
    }

    return doc;
  } catch (error) {
    console.error('[Offline] Error al obtener documento de asistencia:', error);
    throw error;
  }
};

/**
 * Guarda un documento de asistencia con soporte offline
 */
export const saveAttendanceDocumentOffline = async (
  attendanceDoc: AttendanceDocument,
): Promise<string> => {
  try {
    // Normalizar formato de fecha
    const normalizedDate = format(parseISO(attendanceDoc.fecha), 'yyyy-MM-dd');

    // Asegurar que tiene teacherId
    const authStore = useAuthStore();
    if (!attendanceDoc.teacherId) {
      attendanceDoc.teacherId = authStore.user?.uid || '';
    }

    // Generar un ID de documento consistente
    const docId = `${normalizedDate}_${attendanceDoc.classId}`;

    // Guardar en caché inmediatamente para UI reactiva
    const params = { fecha: normalizedDate, classId: attendanceDoc.classId };
    CacheManager.saveToCache(CACHE_PREFIX.SINGLE_ATTENDANCE, attendanceDoc, params);

    // Si estamos offline, guardar para sincronización posterior
    if (OfflineMode.isOfflineMode()) {
      console.log(`[Offline] Guardando cambios offline para sincronización posterior: ${docId}`);

      // Agregar timestamp para ordenar operaciones correctamente
      const dataWithTimestamp = {
        ...attendanceDoc,
        updatedOfflineAt: Date.now(),
        pendingSync: true,
      };

      // Guardar para sincronización posterior
      OfflineMode.saveForLater('update', ATTENDANCE_COLLECTION, {
        id: docId,
        data: dataWithTimestamp,
      });

      // Marcar nueva versión en caché
      CacheManager.generateNewVersion();

      return docId;
    }

    // Si estamos online, guardar directamente
    const result = await saveAttendanceDocumentFirebase(attendanceDoc);

    // Invalidar caché después de guardar exitosamente
    CacheManager.invalidateCache();

    return result;
  } catch (error) {
    console.error('[Offline] Error al guardar documento de asistencia:', error);
    throw error;
  }
};

/**
 * Obtiene todos los documentos de asistencia con soporte offline
 */
export const getAllAttendanceDocumentsOffline = async (): Promise<AttendanceDocument[]> => {
  try {
    // Intentar obtener del caché primero
    const cachedDocs = CacheManager.getFromCache<AttendanceDocument[]>(CACHE_PREFIX.ALL_ATTENDANCE);

    // Verificar si hay cambios pendientes que afecten esta colección
    const hasPendingChanges = OfflineMode.hasCollectionPendingChanges(ATTENDANCE_COLLECTION);

    // Si está en caché y no hay cambios pendientes, usar caché
    if (cachedDocs && !hasPendingChanges) {
      console.log(`[Offline] Usando ${cachedDocs.length} documentos de asistencia desde caché`);
      return cachedDocs;
    }

    // Si estamos offline, usar caché aunque haya cambios pendientes
    // (es lo mejor que podemos hacer offline)
    if (OfflineMode.isOfflineMode()) {
      console.log(
        `[Offline] En modo offline, usando datos en caché${hasPendingChanges ? ' (con cambios pendientes)' : ''}`,
      );
      return cachedDocs || [];
    }

    // Intentar obtener de Firestore
    const docs = await getAllAttendanceDocumentsFirebase();

    // Guardar en caché
    CacheManager.saveToCache(CACHE_PREFIX.ALL_ATTENDANCE, docs);

    return docs;
  } catch (error) {
    console.error('[Offline] Error al obtener documentos de asistencia:', error);

    // Si hay error, intentar usar caché como fallback
    const cachedDocs = CacheManager.getFromCache<AttendanceDocument[]>(CACHE_PREFIX.ALL_ATTENDANCE);

    return cachedDocs || [];
  }
};

/**
 * Actualiza observaciones con soporte offline
 */
export const updateObservationsOffline = async (
  fecha: string,
  classId: string,
  observations: string,
): Promise<string> => {
  try {
    // Normalizar formato de fecha
    const normalizedDate = format(parseISO(fecha), 'yyyy-MM-dd');
    const docId = `${normalizedDate}_${classId}`;

    // Generar clave de caché
    const params = { fecha: normalizedDate, classId };

    // Actualizar caché local inmediatamente
    const cachedDoc = CacheManager.getFromCache<AttendanceDocument>(
      CACHE_PREFIX.SINGLE_ATTENDANCE,
      params,
    );

    if (cachedDoc) {
      // Actualizar versión en caché
      if (!cachedDoc.data) {
        cachedDoc.data = {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: '',
        };
      }

      cachedDoc.data.observations = observations;
      CacheManager.saveToCache(CACHE_PREFIX.SINGLE_ATTENDANCE, cachedDoc, params);
    }

    // Si estamos offline, guardar para sincronización posterior
    if (OfflineMode.isOfflineMode()) {
      console.log(
        `[Offline] Guardando observaciones offline para sincronización posterior: ${docId}`,
      );

      OfflineMode.saveForLater('update', ATTENDANCE_COLLECTION, {
        id: docId,
        observations,
        operation: 'updateObservations',
        fecha: normalizedDate,
        classId,
      });

      return docId;
    }

    // Si estamos online, actualizar directamente
    const result = await updateObservationsFirebase(normalizedDate, classId, observations);

    // Invalidar caché si es necesario
    CacheManager.invalidateCache();

    return result;
  } catch (error) {
    console.error('[Offline] Error al actualizar observaciones:', error);
    throw error;
  }
};

/**
 * Añade una justificación con soporte offline
 */
export const addJustificationOffline = async (
  fecha: string,
  classId: string,
  justification: JustificationData,
  documentURL?: string,
): Promise<string> => {
  try {
    // Normalizar formato de fecha
    const normalizedDate = format(parseISO(fecha), 'yyyy-MM-dd');
    const docId = `${normalizedDate}_${classId}`;

    // Preparar datos para actualización
    const justificationData = {
      ...justification,
      documentURL: documentURL || justification.documentURL,
    };

    // Actualizar caché inmediatamente
    const params = { fecha: normalizedDate, classId };
    const cachedDoc = CacheManager.getFromCache<AttendanceDocument>(
      CACHE_PREFIX.SINGLE_ATTENDANCE,
      params,
    );

    if (cachedDoc) {
      // Asegurar estructura correcta
      if (!cachedDoc.data) {
        cachedDoc.data = {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: '',
        };
      }

      if (!cachedDoc.data.justificacion) {
        cachedDoc.data.justificacion = [];
      }

      // Actualizar o añadir justificación
      const justIndex = cachedDoc.data.justificacion.findIndex((j) => j.id === justification.id);
      if (justIndex !== -1) {
        cachedDoc.data.justificacion[justIndex] = justificationData;
      } else {
        cachedDoc.data.justificacion.push(justificationData);
      }

      // Asegurarse de que el estudiante está en el array de tarde (justificados)
      if (!cachedDoc.data.tarde.includes(justification.id)) {
        cachedDoc.data.tarde.push(justification.id);
      }

      // Quitar de presentes si está ahí
      cachedDoc.data.presentes = cachedDoc.data.presentes.filter((id) => id !== justification.id);

      // Guardar en caché
      CacheManager.saveToCache(CACHE_PREFIX.SINGLE_ATTENDANCE, cachedDoc, params);
    }

    // Si estamos offline, guardar para sincronización posterior
    if (OfflineMode.isOfflineMode()) {
      console.log(
        `[Offline] Guardando justificación offline para sincronización posterior: ${docId}`,
      );

      OfflineMode.saveForLater('update', ATTENDANCE_COLLECTION, {
        id: docId,
        justification: justificationData,
        operation: 'addJustification',
        fecha: normalizedDate,
        classId,
      });

      return docId;
    }

    // Si hay archivo, necesitamos esperar a estar online
    if (justification.documentURL && OfflineMode.isOfflineMode()) {
      console.warn('[Offline] No se puede subir archivo en modo offline');
    }

    // En una implementación real, se manejaría la subida del archivo
    // cuando se recupere la conexión

    // Actualizar caché para reflejar los cambios
    CacheManager.invalidateCache();

    return docId;
  } catch (error) {
    console.error('[Offline] Error al añadir justificación:', error);
    throw error;
  }
};
