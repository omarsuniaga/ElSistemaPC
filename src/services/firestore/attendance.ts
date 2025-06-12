// src/services/firestore/attendance.ts
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  setDoc,
  getDoc,
  addDoc,
  query, 
  where,  
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import type { AttendanceDocument, JustificationData, AttendanceRecord } from '../../modulos/Attendance/types/attendance';

const ATTENDANCE_COLLECTION = 'ASISTENCIAS';

// Utilidad para normalizar documentos de asistencia existentes
const normalizeAttendanceDocument = (document: any): AttendanceDocument => {
  // Asegurar que existe la estructura de datos básica
  if (!document.data) {
    document.data = createDefaultAttendanceData();
  }

  // Normalizar arrays si están undefined
  if (!Array.isArray(document.data.presentes)) {
    document.data.presentes = [];
  }
  if (!Array.isArray(document.data.ausentes)) {
    document.data.ausentes = [];
  }
  if (!Array.isArray(document.data.tarde)) {
    document.data.tarde = [];
  }
  if (!Array.isArray(document.data.justificacion)) {
    document.data.justificacion = [];
  }

  // Normalizar el campo observación
  if (Array.isArray(document.data.observación)) {
    document.data.observación = document.data.observación.join(' ');
  } else if (!document.data.observación) {
    document.data.observación = '';
  }

  // Asegurar que observations existe como array
  if (!Array.isArray(document.data.observations)) {
    document.data.observations = [];
  }

  return document as AttendanceDocument;
};

// Utilidades de validación
const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date) && !isNaN(Date.parse(date));
};

const validateClassId = (classId: string): boolean => {
  return typeof classId === 'string' && classId.trim().length > 0;
};

const validateStudentId = (studentId: string): boolean => {
  return typeof studentId === 'string' && studentId.trim().length > 0;
};

// Utilidad para crear estructura de datos por defecto
const createDefaultAttendanceData = () => ({
  presentes: [],
  ausentes: [],
  tarde: [],
  justificacion: [],
  observación: '', // Compatibilidad con versión anterior
  observations: [] // Nuevo formato estructurado
});

// Utilidad para validar y limpiar datos de justificación
const validateJustificationData = (justification: Partial<JustificationData>): JustificationData => {
  if (!justification.studentId || !validateStudentId(justification.studentId)) {
    throw new Error('ID de estudiante inválido en justificación');
  }
  
  if (!justification.classId || !validateClassId(justification.classId)) {
    throw new Error('ID de clase inválido en justificación');
  }
  
  if (!justification.fecha || !validateDate(justification.fecha)) {
    throw new Error('Fecha inválida en justificación');
  }
  
  if (!justification.reason || justification.reason.trim().length === 0) {
    throw new Error('Razón de justificación requerida');
  }

  return {
    id: justification.id || `${justification.studentId}_${justification.fecha}_${Date.now()}`,
    studentId: justification.studentId,
    classId: justification.classId,
    fecha: justification.fecha,
    reason: justification.reason.trim(),
    documentUrl: justification.documentUrl,
    approvalStatus: justification.approvalStatus || 'pending',
    approvedBy: justification.approvedBy,
    approvedAt: justification.approvedAt,
    createdAt: justification.createdAt || new Date(),
    updatedAt: justification.updatedAt,
    timeLimit: justification.timeLimit || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
};

// Utilidad para generar ID de documento
const generateDocumentId = (fecha: string, classId: string): string => {
  return `${fecha}_${classId}`;
};

// Utilidad para crear justificación por defecto
const createJustificationData = (
  studentId: string,
  classId: string,
  fecha: string,
  reason: string,
  documentUrl?: string
): JustificationData => {
  return validateJustificationData({
    studentId,
    classId,
    fecha,
    reason,
    documentUrl,
    approvalStatus: 'pending',
    createdAt: new Date(),
    timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días para aprobar
  });
};
/**
 * Obtiene un documento de asistencia por fecha y clase
 * 
 * Esta función busca un documento de asistencia específico en Firestore
 * basado en la fecha y el ID de la clase. Normaliza automáticamente
 * los datos para asegurar compatibilidad con versiones anteriores.
 * 
 * @param fecha - La fecha de asistencia en formato YYYY-MM-DD
 * @param classId - El ID único de la clase
 * @returns El documento de asistencia normalizado o null si no existe
 * @throws Error si los parámetros de entrada son inválidos
 * 
 * @example
 * ```typescript
 * const doc = await getAttendanceDocumentFirebase('2023-12-01', 'class123');
 * if (doc) {
 *   console.log('Estudiantes presentes:', doc.data.presentes.length);
 * }
 * ```
 */
export const getAttendanceDocumentFirebase = async (
  fecha: string,
  classId: string
): Promise<AttendanceDocument | null> => {
  try {
    // Validar parámetros de entrada
    if (!validateDate(fecha)) {
      throw new Error(`Fecha inválida: ${fecha}. Debe tener formato YYYY-MM-DD`);
    }
    
    if (!validateClassId(classId)) {
      throw new Error(`ID de clase inválido: ${classId}`);
    }

    console.log(`🔍 Buscando documento de asistencia para fecha ${fecha} y clase ${classId}`);
    
    const docId = generateDocumentId(fecha, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
      console.log('📄 Documento encontrado');
      const rawData = docSnap.data();
      const data = normalizeAttendanceDocument(rawData);
      return data;
    } else {
      console.log('❓ No se encontró documento de asistencia');
      return null;
    }
  } catch (error) {
    console.error('❌ Error al obtener documento de asistencia:', error);
    throw error;
  }
};

/**
 * Crea o actualiza un documento de asistencia
 * @param attendanceDoc - El documento de asistencia a guardar
 * @returns El ID del documento
 */
export const saveAttendanceDocumentFirebase = async (
  attendanceDoc: Omit<AttendanceDocument, 'id' | 'teacherId' | 'uid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    console.log('💾 Guardando documento de asistencia:', attendanceDoc);
    
    // Validar datos de entrada
    if (!validateDate(attendanceDoc.fecha)) {
      throw new Error(`Fecha inválida: ${attendanceDoc.fecha}`);
    }
    
    if (!validateClassId(attendanceDoc.classId)) {
      throw new Error(`ID de clase inválido: ${attendanceDoc.classId}`);
    }

    // Normalizar el documento antes de guardarlo
    const normalizedDoc = normalizeAttendanceDocument(attendanceDoc);
    
    const docId = generateDocumentId(attendanceDoc.fecha, attendanceDoc.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
      // Verificar si el documento ya existe
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('🔄 Actualizando documento existente');
      await updateDoc(docRef, {
        ...normalizedDoc,
        updatedAt: serverTimestamp()
      });
    } else {
      console.log('➕ Creando nuevo documento');
      await setDoc(docRef, {
        ...normalizedDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('✅ Documento guardado con éxito');
    return docId;
  } catch (error) {
    console.error('❌ Error al guardar documento de asistencia:', error);
    throw error;
  }
};

/**
 * Añade una justificación a un documento de asistencia
 * @param fecha - La fecha del documento
 * @param classId - El ID de la clase
 * @param justification - Los datos de justificación
 * @param file - Un archivo adjunto opcional
 * @returns El ID del documento actualizado
 */
export const addJustificationToAttendanceFirebase = async (
  fecha: string,
  classId: string,
  justification: JustificationData,
  file: File | null
): Promise<string> => {
  try {
    // Validar parámetros
    if (!validateDate(fecha)) {
      throw new Error(`Fecha inválida: ${fecha}`);
    }
    
    if (!validateClassId(classId)) {
      throw new Error(`ID de clase inválido: ${classId}`);
    }

    // Validar y normalizar datos de justificación
    const validatedJustification = validateJustificationData(justification);

    console.log('📝 Añadiendo justificación para estudiante:', validatedJustification.studentId);
      // Si hay un archivo, subirlo primero
    if (file) {
      const storageRef = ref(storage, `justifications/${fecha}_${validatedJustification.studentId}_${classId}_${file.name}`);
      await uploadBytes(storageRef, file);
      validatedJustification.documentUrl = await getDownloadURL(storageRef);
    }
    
    // Obtener el documento existente
    const docId = generateDocumentId(fecha, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
      // Documento existe, actualizar el array de justificaciones
      const rawData = docSnap.data();
      const data = normalizeAttendanceDocument(rawData);
        // Asegurar que existe la estructura de datos
      if (!data.data) {
        data.data = createDefaultAttendanceData();
      }
      
      // Normalizar el campo observación para compatibilidad
      if (Array.isArray(data.data.observación)) {
        data.data.observación = data.data.observación.join(' ');
      } else if (!data.data.observación) {
        data.data.observación = '';
      }
      
      // Asegurar que observations existe
      if (!data.data.observations) {
        data.data.observations = [];
      }
      
      if (!data.data.justificacion) {
        data.data.justificacion = [];
      }
        // Buscar si ya existe una justificación para este estudiante
      const justIndex = data.data.justificacion.findIndex(j => j.studentId === validatedJustification.studentId);
      
      if (justIndex !== -1) {
        // Actualizar la justificación existente
        data.data.justificacion[justIndex] = { ...data.data.justificacion[justIndex], ...validatedJustification };
      } else {
        // Añadir nueva justificación
        data.data.justificacion.push(validatedJustification);
      }
      
      // Gestionar el estado del estudiante en los arrays
      const studentId = validatedJustification.studentId;
      
      // Quitar de ausentes si está ahí
      const ausenteIndex = data.data.ausentes.indexOf(studentId);
      if (ausenteIndex !== -1) {
        data.data.ausentes.splice(ausenteIndex, 1);
      }
      
      // Asegurarse de que está en el array de tardanza/justificados
      if (!data.data.tarde.includes(studentId)) {
        data.data.tarde.push(studentId);
      }
      
      // Actualizar el documento
      await updateDoc(docRef, {
        data: data.data,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Justificación añadida con éxito');
    } else {
      // No existe el documento, crearlo primero
      const newDoc: Omit<AttendanceDocument, 'id' | 'teacherId' | 'uid' | 'createdAt' | 'updatedAt'> = {
        fecha,
        classId,        data: {
          presentes: [],
          ausentes: [],
          tarde: [validatedJustification.studentId], // Poner al estudiante como tarde (justificado)
          justificacion: [validatedJustification],
          observación: '',
          observations: []
        }
      };
      
      await setDoc(docRef, {
        ...newDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Documento creado con justificación');
    }
    
    return docId;
  } catch (error) {
    console.error('❌ Error al añadir justificación:', error);
    throw error;
  }
};

/**
 * Actualiza las observaciones de un documento de asistencia
 * @param fecha - La fecha del documento
 * @param classId - El ID de la clase
 * @param observations - Las observaciones a guardar (string para compatibilidad)
 * @returns El ID del documento actualizado
 */
export const updateObservationsFirebase = async (
  fecha: string,
  classId: string,
  observations: string
): Promise<string> => {
  try {
    // Validar parámetros
    if (!validateDate(fecha)) {
      throw new Error(`Fecha inválida: ${fecha}`);
    }
    
    if (!validateClassId(classId)) {
      throw new Error(`ID de clase inválido: ${classId}`);
    }

    console.log('📝 Actualizando observaciones de clase');
    
    const docId = generateDocumentId(fecha, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
      // Documento existe, actualizar observaciones
      const rawData = docSnap.data();
      const data = normalizeAttendanceDocument(rawData);
        // Asegurar que existe la estructura de datos
      if (!data.data) {
        data.data = createDefaultAttendanceData();
      }
      
      // Normalizar el campo observación para compatibilidad
      if (Array.isArray(data.data.observación)) {
        data.data.observación = data.data.observación.join(' ');
      }
      
      // Asegurar que observations existe
      if (!data.data.observations) {
        data.data.observations = [];
      }
      
      // Actualizar observación en formato string (compatibilidad)
      data.data.observación = observations;
      
      // Actualizar el documento
      await updateDoc(docRef, {
        data: data.data,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Observaciones actualizadas con éxito');
    } else {
      // No existe el documento, crearlo primero
      const newDoc: Omit<AttendanceDocument, 'id' | 'teacherId' | 'uid' | 'createdAt' | 'updatedAt'> = {
        fecha,
        classId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observación: observations,
          observations: []
        }
      };
      
      await setDoc(docRef, {
        ...newDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Documento creado con observaciones');
    }
    
    return docId;
  } catch (error) {
    console.error('❌ Error al actualizar observaciones:', error);
    throw error;
  }
};

/**
 * Obtiene todos los documentos de asistencia para análisis
 * @returns Lista de documentos de asistencia
 */
export const getAllAttendanceDocumentsFirebase = async (): Promise<AttendanceDocument[]> => {
  try {
    console.log('🔍 Obteniendo todos los documentos de asistencia');
    
    const attendanceCollection = collection(db, ATTENDANCE_COLLECTION);
    const querySnapshot = await getDocs(attendanceCollection);
    
    const documents: AttendanceDocument[] = [];
      querySnapshot.forEach((doc) => {
      const rawData = doc.data();
      const normalizedData = normalizeAttendanceDocument(rawData);
      documents.push(normalizedData);
    });
    
    console.log(`✅ Se encontraron ${documents.length} documentos de asistencia`);
    return documents;
  } catch (error) {
    console.error('❌ Error al obtener documentos de asistencia:', error);
    throw error;
  }
};

// Métodos de compatibilidad con el sistema anterior

/**
 * Convierte documentos al formato anterior para compatibilidad
 * @param document - El documento en nuevo formato
 * @returns Array de registros en formato antiguo
 */
export const convertDocumentToRecords = (document: AttendanceDocument): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  // Convertir presentes
  document.data.presentes.forEach(studentId => {
    records.push({
      id: `${studentId}_${document.fecha}_${document.classId}`,
      studentId,
      classId: document.classId,
      fecha: document.fecha,
      status: 'Presente',
      createdAt: new Date()
    });
  });
  
  // Convertir ausentes
  document.data.ausentes.forEach(studentId => {
    records.push({
      id: `${studentId}_${document.fecha}_${document.classId}`,
      studentId,
      classId: document.classId,
      fecha: document.fecha,
      status: 'Ausente',
      createdAt: new Date()
    });
  });
  
  // Convertir tarde/justificados
  document.data.tarde.forEach(studentId => {
    const justificationData = document.data.justificacion?.find(j => j.studentId === studentId);
    const isJustified = !!justificationData;
    
    records.push({
      id: `${studentId}_${document.fecha}_${document.classId}`,
      studentId,
      classId: document.classId,
      fecha: document.fecha,
      status: isJustified ? 'Justificado' : 'Tardanza',
      justification: isJustified ? justificationData.reason : undefined,
      documentUrl: isJustified ? justificationData.documentUrl : undefined,
      createdAt: new Date()
    });
  });
  
  return records;
};

// Funciones de compatibilidad con el sistema anterior
export const getAttendancesFirebase = async (): Promise<AttendanceRecord[]> => {
  try {
    const documents = await getAllAttendanceDocumentsFirebase();
    
    // Convertir todos los documentos a registros
    let allRecords: AttendanceRecord[] = [];
    documents.forEach(doc => {
      const records = convertDocumentToRecords(doc);
      allRecords = [...allRecords, ...records];
    });
    
    return allRecords;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

export const getAttendanceByDateAndClassFirebase = async (
  fecha?: string, 
  classId?: string
): Promise<AttendanceRecord[]> => {
  try {
    if (!fecha || !classId) {
      throw new Error("Fecha y classId son requeridos");
    }
    
    const document = await getAttendanceDocumentFirebase(fecha, classId);
    
    if (!document) {
      return [];
    }
    
    return convertDocumentToRecords(document);
  } catch (error) {
    console.error('Error fetching attendance by date and class:', error);
    throw error;
  }
};

export const updateAttendanceFirebase = async (attendanceData: AttendanceRecord): Promise<string> => {
  try {
    // Validar datos de entrada
    if (!validateDate(attendanceData.fecha)) {
      throw new Error(`Fecha inválida: ${attendanceData.fecha}`);
    }
    
    if (!validateClassId(attendanceData.classId)) {
      throw new Error(`ID de clase inválido: ${attendanceData.classId}`);
    }
    
    if (!validateStudentId(attendanceData.studentId)) {
      throw new Error(`ID de estudiante inválido: ${attendanceData.studentId}`);
    }

    // Obtener el documento existente o crear uno nuevo
    const docId = generateDocumentId(attendanceData.fecha, attendanceData.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    let document: Omit<AttendanceDocument, 'id' | 'teacherId' | 'uid' | 'createdAt' | 'updatedAt'>;
      if (docSnap.exists()) {
      document = normalizeAttendanceDocument(docSnap.data());
    } else {
      document = {
        fecha: attendanceData.fecha,
        classId: attendanceData.classId,
        data: createDefaultAttendanceData()
      };
    }
    
    // Remover el estudiante de todos los arrays primero
    document.data.presentes = document.data.presentes.filter(id => id !== attendanceData.studentId);
    document.data.ausentes = document.data.ausentes.filter(id => id !== attendanceData.studentId);
    document.data.tarde = document.data.tarde.filter(id => id !== attendanceData.studentId);
    
    // Añadir el estudiante al array correspondiente según su estado
    switch (attendanceData.status) {
      case 'Presente':
        document.data.presentes.push(attendanceData.studentId);
        break;
      case 'Ausente':
        document.data.ausentes.push(attendanceData.studentId);
        break;
      case 'Tardanza':
      case 'Justificado':
        document.data.tarde.push(attendanceData.studentId);
        break;
    }
    
    // Si el estado es justificado, actualizar o añadir justificación
    if (attendanceData.status === 'Justificado' && attendanceData.justification) {
      const justIndex = document.data.justificacion.findIndex(j => j.studentId === attendanceData.studentId);
      
      const justificationReason = typeof attendanceData.justification === 'string' 
        ? attendanceData.justification 
        : attendanceData.justification.reason;
      
      if (justIndex !== -1) {
        // Actualizar justificación existente
        document.data.justificacion[justIndex].reason = justificationReason;
        if (attendanceData.documentUrl) {
          document.data.justificacion[justIndex].documentUrl = attendanceData.documentUrl;
        }
      } else {
        // Crear nueva justificación
        const newJustification = createJustificationData(
          attendanceData.studentId,
          attendanceData.classId,
          attendanceData.fecha,
          justificationReason,
          attendanceData.documentUrl
        );
        document.data.justificacion.push(newJustification);
      }
    }
    
    // Guardar el documento
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        data: document.data,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        ...document,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return docId;
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};

export const updateAttendanceWithJustificationFirebase = async (
  studentId: string,
  date: string,
  classId: string,
  reason: string,
  file: File | null
): Promise<string> => {
  // Validar parámetros
  if (!validateStudentId(studentId)) {
    throw new Error(`ID de estudiante inválido: ${studentId}`);
  }
  
  if (!validateDate(date)) {
    throw new Error(`Fecha inválida: ${date}`);
  }
  
  if (!validateClassId(classId)) {
    throw new Error(`ID de clase inválido: ${classId}`);
  }
  
  if (!reason || reason.trim().length === 0) {
    throw new Error('La razón de justificación es requerida');
  }

  const justification = createJustificationData(studentId, classId, date, reason.trim());
  
  return addJustificationToAttendanceFirebase(date, classId, justification, file);
};

/**
 * Añade una observación al historial de clase
 * @param classId - ID de la clase
 * @param date - Fecha de la clase
 * @param text - Texto de la observación
 * @param author - Nombre del autor
 * @returns Promise con el ID del documento creado
 */
export const addObservationToHistoryFirebase = async (
  classId: string,
  date: string,
  text: string,
  author: string
): Promise<string> => {
  try {
    console.log('📝 Añadiendo observación al historial:', { classId, date });
    
    const observationsCollection = collection(db, 'OBSERVACIONES');
    
    const observationData = {
      classId,
      date,
      text,
      author,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(observationsCollection, observationData);
    
    // También actualizar la observación en el documento de asistencia
    await updateObservationsFirebase(date, classId, text);
    
    console.log('✅ Observación añadida al historial con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al añadir observación al historial:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de observaciones para una clase
 * @param classId - ID de la clase (opcional) - si no se proporciona, devuelve todas las observaciones
 * @param date - Fecha específica (opcional)
 * @returns Promise con array de observaciones
 */
export const getObservationsHistoryFirebase = async (
  classId?: string,
  date?: string
): Promise<any[]> => {
  try {
    console.log('🔍 Buscando historial de observaciones para:', { classId, date });
    
    let q;
    
    // Caso 1: Filtrar por clase y fecha específica
    if (classId && date) {
      q = query(
        collection(db, 'OBSERVACIONES'),
        where('classId', '==', classId),
        where('date', '==', date)
      );
    } 
    // Caso 2: Filtrar solo por clase
    else if (classId) {
      q = query(
        collection(db, 'OBSERVACIONES'),
        where('classId', '==', classId)
      );
    } 
    // Caso 3: Filtrar solo por fecha
    else if (date) {
      q = query(
        collection(db, 'OBSERVACIONES'),
        where('date', '==', date)
      );
    } 
    // Caso 4: Obtener todas las observaciones
    else {
      q = query(
        collection(db, 'OBSERVACIONES')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const result = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Se encontraron ${result.length} observaciones`);
    return result;
  } catch (error) {
    console.error('❌ Error al obtener historial de observaciones:', error);
    return [];
  }
};