// src/service/attendance.ts
/**
 * Servicio centralizado para comunicación con Firebase - Attendance Module
 * Este archivo se encarga de todas las operaciones con Firestore relacionadas con asistencia
 * Estructura del documento: YYYY-MM-DD_ClassId en colección "ASISTENCIAS"
 */

import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  Query,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import type { 
  AttendanceDocument, 
  JustificationData
} from '../modulos/Attendance/types/attendance';

// Constantes
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';

/**
 * Genera un ID de documento consistente: YYYY-MM-DD_ClassId
 */
const getAttendanceDocId = (fecha: string, classId: string): string => `${fecha}_${classId}`;

/**
 * Valida si una cadena es un ID de Firestore (no una fecha)
 */
const isFirestoreId = (str: string): boolean => {
  // Los IDs de Firestore son alfanuméricos y suelen tener 20-28 caracteres
  return /^[a-zA-Z0-9]{20,}$/.test(str) && !/^\d{4}-\d{2}-\d{2}$/.test(str) && !/^\d{8}$/.test(str);
};

/**
 * Normaliza fecha al formato YYYY-MM-DD
 */
const normalizeDate = (date: string): string => {
  if (!date || typeof date !== 'string') {
    throw new Error(`Formato de fecha inválido: ${date}`);
  }

  // Verificar si es un ID de Firestore y no una fecha
  if (isFirestoreId(date)) {
    throw new Error(`Se esperaba una fecha pero se recibió un ID: ${date}`);
  }

  // Si ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  // Si está en formato YYYYMMDD
  if (/^\d{8}$/.test(date)) {
    return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
  }
  // Si es una fecha válida, formatearla
  const dateObj = new Date(date);
  if (!isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  throw new Error(`Formato de fecha inválido: ${date}`);
};

/**
 * Obtiene un documento de asistencia por fecha, clase y profesor
 * ACTUALIZADO: Ahora incluye filtrado por teacherId para evitar conflictos entre profesores
 */
export const getAttendanceDocument = async (
  fecha: string,
  classId: string,
  teacherId?: string
): Promise<AttendanceDocument | null> => {
  try {
    const normalizedDate = normalizeDate(fecha);
    
    // Estrategia 1: Intentar obtener documento usando ID compuesto (método legacy)
    const docId = getAttendanceDocId(normalizedDate, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Verificar si el documento pertenece al profesor correcto (si se especifica)
      if (teacherId && data.teacherId && data.teacherId !== teacherId) {
        console.warn(`Documento encontrado pero pertenece a otro profesor: ${data.teacherId} vs ${teacherId}`);
        // Continúa a la estrategia 2
      } else {
        // Documento válido encontrado
        console.log(`Documento de asistencia encontrado (método ID): ${docId}`);
        return {
          id: docSnap.id,
          fecha: normalizedDate,
          classId,
          teacherId: data.teacherId,
          uid: data.uid,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          data: {
            presentes: data.data?.presentes || [],
            ausentes: data.data?.ausentes || [],
            tarde: data.data?.tarde || [],
            justificacion: data.data?.justificacion || [],
            observación: data.data?.observación || []
          }
        } as AttendanceDocument;
      }
    }
    
    // Estrategia 2: Buscar usando query con filtros (más robusto)
    if (teacherId) {
      console.log(`Buscando documento con query: fecha=${normalizedDate}, classId=${classId}, teacherId=${teacherId}`);
      
      const queryRef = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('fecha', '==', normalizedDate),
        where('classId', '==', classId),
        where('teacherId', '==', teacherId)
      );
      
      const querySnapshot = await getDocs(queryRef);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]; // Tomar el primero si hay múltiples
        const data = doc.data();
        
        console.log(`Documento de asistencia encontrado (método query): ${doc.id}`);
        return {
          id: doc.id,
          fecha: normalizedDate,
          classId,
          teacherId: data.teacherId,
          uid: data.uid,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          data: {
            presentes: data.data?.presentes || [],
            ausentes: data.data?.ausentes || [],
            tarde: data.data?.tarde || [],
            justificacion: data.data?.justificacion || [],
            observación: data.data?.observación || []
          }
        } as AttendanceDocument;
      } else {
        console.log(`No se encontró documento con query para: fecha=${normalizedDate}, classId=${classId}, teacherId=${teacherId}`);
      }
    }
    
    console.log(`No se encontró documento de asistencia para: fecha=${normalizedDate}, classId=${classId}${teacherId ? `, teacherId=${teacherId}` : ''}`);
    return null;
  } catch (error) {
    console.error('Error al obtener documento de asistencia:', error);
    throw error;
  }
};

/**
 * Crea o actualiza un documento de asistencia
 * Estructura: fecha, classId, createdAt, data{presentes, ausentes, tarde, justificacion, observación}, teacherId, uid, updatedAt
 */
export const saveAttendanceDocument = async (
  attendanceDoc: AttendanceDocument
): Promise<string> => {
  try {
    const normalizedDate = normalizeDate(attendanceDoc.fecha);
    const docId = getAttendanceDocId(normalizedDate, attendanceDoc.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    
    const documentToSave = {
      fecha: normalizedDate,
      classId: attendanceDoc.classId,
      teacherId: attendanceDoc.teacherId,
      uid: attendanceDoc.uid || attendanceDoc.teacherId,
      data: {
        presentes: attendanceDoc.data.presentes || [],
        ausentes: attendanceDoc.data.ausentes || [],
        tarde: attendanceDoc.data.tarde || [],
        justificacion: attendanceDoc.data.justificacion || [],
        observación: attendanceDoc.data.observación || []
      },
      updatedAt: serverTimestamp()
    };

    // Verificar si el documento ya existe
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Actualizar documento existente
      await updateDoc(docRef, documentToSave);
    } else {
      // Crear nuevo documento
      await setDoc(docRef, {
        ...documentToSave,
        createdAt: serverTimestamp()
      });
    }
    
    return docId;
  } catch (error) {
    console.error('Error al guardar documento de asistencia:', error);
    throw error;
  }
};

/**
 * Obtiene todos los documentos de asistencia para un rango de fechas
 */
export const getAttendanceDocumentsByDateRange = async (
  startDate: string,
  endDate: string,
  teacherId?: string
): Promise<AttendanceDocument[]> => {
  try {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    let queryRef: Query<DocumentData> = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('fecha', '>=', normalizedStartDate),
      where('fecha', '<=', normalizedEndDate)
    );
    
    if (teacherId) {
      queryRef = query(queryRef, where('teacherId', '==', teacherId));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const documents: AttendanceDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        fecha: data.fecha,
        classId: data.classId,
        teacherId: data.teacherId,
        uid: data.uid,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        data: {
          presentes: data.data?.presentes || [],
          ausentes: data.data?.ausentes || [],
          tarde: data.data?.tarde || [],
          justificacion: data.data?.justificacion || [],
          observación: data.data?.observación || []
        }
      } as AttendanceDocument);
    });
    
    return documents;
  } catch (error) {
    console.error('Error al obtener documentos por rango de fechas:', error);
    throw error;
  }
};

/**
 * Obtiene todas las fechas con registros de asistencia
 */
export const getRegisteredAttendanceDates = async (teacherId?: string): Promise<string[]> => {
  try {
    let queryRef: Query<DocumentData> = query(collection(db, ATTENDANCE_COLLECTION));
    
    if (teacherId) {
      queryRef = query(queryRef, where('teacherId', '==', teacherId));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const dates: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fecha) {
        dates.push(data.fecha);
      }
    });
    
    // Remover duplicados y ordenar
    return [...new Set(dates)].sort();
  } catch (error) {
    console.error('Error al obtener fechas registradas:', error);
    throw error;
  }
};

/**
 * Obtiene documentos de asistencia para una fecha específica
 */
export const getAttendanceDocumentsByDate = async (
  fecha: string,
  teacherId?: string
): Promise<AttendanceDocument[]> => {
  try {
    const normalizedDate = normalizeDate(fecha);
    
    let queryRef: Query<DocumentData> = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('fecha', '==', normalizedDate)
    );
    
    if (teacherId) {
      queryRef = query(queryRef, where('teacherId', '==', teacherId));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const documents: AttendanceDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        fecha: data.fecha,
        classId: data.classId,
        teacherId: data.teacherId,
        uid: data.uid,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        data: {
          presentes: data.data?.presentes || [],
          ausentes: data.data?.ausentes || [],
          tarde: data.data?.tarde || [],
          justificacion: data.data?.justificacion || [],
          observación: data.data?.observación || []
        }
      } as AttendanceDocument);
    });
    
    return documents;
  } catch (error) {
    console.error('Error al obtener documentos por fecha:', error);
    throw error;
  }
};

/**
 * Actualiza las observaciones de un documento de asistencia
 * ACTUALIZADO: Maneja tanto el formato antiguo (string) como el nuevo (array de observaciones)
 * También verifica que el documento pertenezca al teacherId correcto
 */
export const updateObservations = async (
  fecha: string,
  classId: string,
  observations: string | any[],
  teacherId: string
): Promise<string> => {
  try {
    const normalizedDate = normalizeDate(fecha);
    
    // Primero, intentar obtener el documento existente usando el método mejorado
    const existingDoc = await getAttendanceDocument(normalizedDate, classId, teacherId);
    
    if (existingDoc) {
      // Documento existe y pertenece al profesor correcto - actualizar
      const docRef = doc(db, ATTENDANCE_COLLECTION, existingDoc.id);
      
      // Actualizar según el tipo de observaciones
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      if (typeof observations === 'string') {
        // Formato antiguo: mantener compatibilidad
        updateData['data.observación'] = observations;
      } else if (Array.isArray(observations)) {
        // Nuevo formato: array de observaciones estructuradas
        updateData['data.observations'] = observations;
        // Mantener el campo antiguo para compatibilidad
        updateData['data.observación'] = observations.map(obs => 
          typeof obs === 'string' ? obs : obs.content || obs.text || ''
        ).join('\n\n---\n\n');
      }
      
      await updateDoc(docRef, updateData);
      console.log(`Observaciones actualizadas en documento existente: ${existingDoc.id}`);
      return existingDoc.id;
    } else {
      // No existe documento para este profesor - crear nuevo
      const docId = getAttendanceDocId(normalizedDate, classId);
      const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
      
      const newDoc: any = {
        fecha: normalizedDate,
        classId,
        teacherId,
        uid: teacherId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Agregar observaciones según el tipo
      if (typeof observations === 'string') {
        newDoc.data.observación = observations;
      } else if (Array.isArray(observations)) {
        newDoc.data.observations = observations;
        // Mantener compatibilidad con formato anterior
        newDoc.data.observación = observations.map(obs => 
          typeof obs === 'string' ? obs : obs.content || obs.text || ''
        ).join('\n\n---\n\n');
      }
      
      await setDoc(docRef, newDoc);
      console.log(`Nuevo documento creado con observaciones: ${docId}`);
      return docId;
    }
  } catch (error) {
    console.error('Error al actualizar observaciones:', error);
    throw error;
  }
};

/**
 * Añade justificación a un documento de asistencia
 * ACTUALIZADO: Verifica que el documento pertenezca al teacherId correcto
 */
export const addJustification = async (
  fecha: string,
  classId: string,
  justification: JustificationData,
  teacherId: string
): Promise<string> => {
  try {
    const normalizedDate = normalizeDate(fecha);
    
    // Primero, intentar obtener el documento existente usando el método mejorado
    const existingDoc = await getAttendanceDocument(normalizedDate, classId, teacherId);
    
    if (existingDoc) {
      // Documento existe y pertenece al profesor correcto - actualizar
      const docRef = doc(db, ATTENDANCE_COLLECTION, existingDoc.id);
      const currentJustifications = existingDoc.data.justificacion || [];
      
      // Buscar si ya existe una justificación para este estudiante
      const existingIndex = currentJustifications.findIndex(
        (j: JustificationData) => (j.id === justification.id || j.studentId === justification.studentId)
      );
      
      if (existingIndex !== -1) {
        // Actualizar justificación existente
        currentJustifications[existingIndex] = justification;
      } else {
        // Añadir nueva justificación
        currentJustifications.push(justification);
      }
      
      await updateDoc(docRef, {
        'data.justificacion': currentJustifications,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Justificación actualizada en documento existente: ${existingDoc.id}`);
      return existingDoc.id;
    } else {
      // No existe documento para este profesor - crear nuevo
      const docId = getAttendanceDocId(normalizedDate, classId);
      const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
      
      const newDoc = {
        fecha: normalizedDate,
        classId,
        teacherId,
        uid: teacherId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [justification],
          observación: ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, newDoc);
      console.log(`Nuevo documento creado con justificación: ${docId}`);
      return docId;
    }
  } catch (error) {
    console.error('Error al añadir justificación:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de asistencia para una clase en un período
 */
export const getAttendanceStats = async (
  classId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  justifiedCount: number;
}> => {
  try {
    const documents = await getAttendanceDocumentsByDateRange(startDate, endDate);
    const classDocuments = documents.filter(doc => doc.classId === classId);
    
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let justifiedCount = 0;
    
    classDocuments.forEach(doc => {
      presentCount += doc.data.presentes?.length || 0;
      absentCount += doc.data.ausentes?.length || 0;
      lateCount += doc.data.tarde?.length || 0;
      justifiedCount += doc.data.justificacion?.length || 0;
    });
    
    return {
      totalClasses: classDocuments.length,
      presentCount,
      absentCount,
      lateCount,
      justifiedCount
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

/**
 * Busca documentos de asistencia usando filtros múltiples
 * Esta función es más robusta para manejar casos donde el ID compuesto no funciona
 */
export const findAttendanceDocuments = async (filters: {
  fecha?: string;
  classId?: string;
  teacherId?: string;
}): Promise<AttendanceDocument[]> => {
  try {
    let queryRef: Query<DocumentData> = query(collection(db, ATTENDANCE_COLLECTION));
    
    // Aplicar filtros si se proporcionan
    if (filters.fecha) {
      const normalizedDate = normalizeDate(filters.fecha);
      queryRef = query(queryRef, where('fecha', '==', normalizedDate));
    }
    
    if (filters.classId) {
      queryRef = query(queryRef, where('classId', '==', filters.classId));
    }
    
    if (filters.teacherId) {
      queryRef = query(queryRef, where('teacherId', '==', filters.teacherId));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const documents: AttendanceDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        fecha: data.fecha,
        classId: data.classId,
        teacherId: data.teacherId,
        uid: data.uid,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        data: {
          presentes: data.data?.presentes || [],
          ausentes: data.data?.ausentes || [],
          tarde: data.data?.tarde || [],
          justificacion: data.data?.justificacion || [],
          observación: data.data?.observación || []
        }
      } as AttendanceDocument);
    });
    
    console.log(`Encontrados ${documents.length} documentos con filtros:`, filters);
    return documents;
  } catch (error) {
    console.error('Error al buscar documentos de asistencia:', error);
    throw error;
  }
};

/**
 * Busca un documento específico de asistencia con múltiples estrategias de búsqueda
 * Esta es una versión alternativa más robusta de getAttendanceDocument
 */
export const findAttendanceDocument = async (
  fecha: string,
  classId: string,
  teacherId: string
): Promise<AttendanceDocument | null> => {
  try {
    const documents = await findAttendanceDocuments({ fecha, classId, teacherId });
    
    if (documents.length > 0) {
      if (documents.length > 1) {
        console.warn(`Se encontraron múltiples documentos (${documents.length}) para fecha=${fecha}, classId=${classId}, teacherId=${teacherId}. Usando el primero.`);
      }
      return documents[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error al buscar documento de asistencia:', error);
    throw error;
  }
};

/**
 * Agrega una observación estructurada al array de observaciones de una clase
 * NUEVA FUNCIÓN: Maneja la nueva estructura de observaciones como array
 */
export const addStructuredObservation = async (
  fecha: string,
  classId: string,
  observationData: {
    id?: string;
    content: string;
    author: string;
    timestamp?: Date;
    type?: 'contenido' | 'comportamiento' | 'logro' | 'general';
    tags?: string[];
    imageUrls?: string[];
    formattedText?: string;
  },
  teacherId: string
): Promise<string> => {
  try {
    const normalizedDate = normalizeDate(fecha);
    
    // Crear observación completa con valores por defecto
    const newObservation = {
      id: observationData.id || `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: observationData.content,
      author: observationData.author,
      timestamp: observationData.timestamp || new Date(),
      type: observationData.type || 'general',
      tags: observationData.tags || [],
      imageUrls: observationData.imageUrls || [],
      formattedText: observationData.formattedText || observationData.content
    };
    
    // Obtener documento existente
    const existingDoc = await getAttendanceDocument(normalizedDate, classId, teacherId);
    
    if (existingDoc) {
      // Documento existe - agregar a las observaciones existentes
      const docRef = doc(db, ATTENDANCE_COLLECTION, existingDoc.id);
      
      // Obtener observaciones actuales
      const currentObservations = existingDoc.data.observations || [];
      const updatedObservations = [...currentObservations, newObservation];
      
      // Actualizar documento
      await updateDoc(docRef, {
        'data.observations': updatedObservations,
        // Mantener compatibilidad con formato anterior
        'data.observación': updatedObservations.map(obs => obs.content).join('\n\n---\n\n'),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Observación estructurada agregada al documento: ${existingDoc.id}`);
      return existingDoc.id;
    } else {
      // Crear nuevo documento con la observación
      const docId = getAttendanceDocId(normalizedDate, classId);
      const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
      
      const newDoc = {
        fecha: normalizedDate,
        classId,
        teacherId,
        uid: teacherId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: [newObservation],
          observación: newObservation.content // Compatibilidad
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, newDoc);
      console.log(`Nuevo documento creado con observación estructurada: ${docId}`);
      return docId;
    }
  } catch (error) {
    console.error('Error al agregar observación estructurada:', error);
    throw error;
  }
};

/**
 * Obtiene las observaciones estructuradas de una clase y fecha
 */
export const getStructuredObservations = async (
  fecha: string,
  classId: string,
  teacherId?: string
): Promise<any[]> => {
  try {
    const normalizedDate = normalizeDate(fecha);
    const doc = await getAttendanceDocument(normalizedDate, classId, teacherId);
    
    if (doc && doc.data.observations) {
      return doc.data.observations;
    }
    
    // Si no hay observaciones estructuradas pero hay observación simple, convertir
    if (doc && doc.data.observación && typeof doc.data.observación === 'string') {
      return [{
        id: `legacy-${Date.now()}`,
        content: doc.data.observación,
        author: teacherId || 'Sistema',
        timestamp: new Date(),
        type: 'general',
        tags: [],
        imageUrls: [],
        formattedText: doc.data.observación
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error al obtener observaciones estructuradas:', error);
    return [];
  }
};
