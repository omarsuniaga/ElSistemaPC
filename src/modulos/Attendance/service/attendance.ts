// src/services/firestore/attendance.ts
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
  addDoc,
  orderBy,
  Timestamp,
  deleteDoc,
  DocumentData,
  CollectionReference
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import type { 
  AttendanceDocument, 
  JustificationData, 
  AttendanceRecord, 
  ClassObservation 
} from '../types/attendance';
import { auth } from '../../../firebase'; // Asegúrate de importar auth desde tu configuración de Firebase
import { fetchAttendanceByDateFirebase as fetchByDate } from './attendance/fetchByDate';
import { applyTeacherFilter, hasAccessToDocument, generateCacheKey } from '../../../utils/roleBasedAccess';
import { useAuthStore } from '../../../stores/auth';

// Configuración de caché
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos

// Constants
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const OBSERVATIONS_COLLECTION = 'OBSERVACIONES';
const CLASSES_COLLECTION = 'CLASES';

/**
 * Función para obtener las clases de un maestro directamente sin importación dinámica
 * para evitar referencias circulares con classes.ts
 */
const getTeacherClassesLocal = async (teacherId: string): Promise<any[]> => {
  try {
    const classesCollection = collection(db, CLASSES_COLLECTION);
    const teacherQuery = query(classesCollection, where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(teacherQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      studentIds: doc.data().studentIds || []
    }));
  } catch (error) {
    console.error('Error obteniendo clases del maestro:', error);
    return [];
  }
};

/**
 * Genera un ID de documento consistente para documentos de asistencia
 */
const getAttendanceDocId = (fecha: string, classId: string): string => `${fecha}_${classId}`;



/**
 * Obtiene un documento de asistencia por fecha y clase
 */
export const getAttendanceDocumentFirebase = async (
  fecha: string,
  classId: string
): Promise<AttendanceDocument | null> => {
  try {
    const docId = getAttendanceDocId(fecha, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AttendanceDocument;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener documento de asistencia:', error);
    throw error;
  }
};

/**
 * Crea o actualiza un documento de asistencia
 */
export const saveAttendanceDocumentFirebase = async (
  attendanceDoc: AttendanceDocument
): Promise<string> => {
  try {
    const docId = getAttendanceDocId(attendanceDoc.fecha, attendanceDoc.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    // Función auxiliar para eliminar valores undefined recursivamente
    const removeUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      
      if (typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
      }
      
      const result: any = {};
      
      Object.keys(obj).forEach(key => {
        const value = removeUndefined(obj[key]);
        if (value !== undefined) {
          result[key] = value;
        }
      });
      
      return result;
    };
    
    // Limpiar el documento de valores undefined
    const cleanedDoc = removeUndefined(attendanceDoc);
    
    // Añadir timestamp para la actualización
    const updates = {
      ...cleanedDoc,
      updatedAt: serverTimestamp()
    };
    
    console.log('Documento limpio a guardar:', JSON.stringify(updates).substring(0, 200) + '...');
    
    if (docSnap.exists()) {
      await updateDoc(docRef, updates);
    } else {
      await setDoc(docRef, {
        ...updates,
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
 * Añade o actualiza una justificación en un documento de asistencia
 */
export const addJustificationToAttendanceFirebase = async (
  fecha: string,
  classId: string,
  justification: JustificationData,
  file: File | null
): Promise<string> => {
  try {
    // Si hay un archivo, subirlo primero
    if (file) {
      const storageRef = ref(storage, `justificaciones/${fecha}_${classId}_${justification.id}`);
      await uploadBytes(storageRef, file);
      justification.documentURL = await getDownloadURL(storageRef);
    }

    // Obtener o crear el documento
    const docId = getAttendanceDocId(fecha, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Actualizar documento existente
      const data = docSnap.data() as AttendanceDocument;
      
      // Asegurar que la estructura de datos exista
      if (!data.data) {
        data.data = {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: ''
        };
      }
      
      // Preparar los arrays
      if (!data.data.justificacion) {
        data.data.justificacion = [];
      }
      
      // Actualizar o añadir justificación
      const justIndex = data.data.justificacion.findIndex(j => j.id === justification.id);
      if (justIndex !== -1) {
        data.data.justificacion[justIndex] = justification;
      } else {
        data.data.justificacion.push(justification);
      }
      
      // Asegurarse de que el estudiante está en el array ausentes y no en presentes/tarde
      if (!data.data.presentes.includes(justification.id) && 
          !data.data.tarde.includes(justification.id)) {
        
        // Quitar de tarde si está ahí
        data.data.tarde = data.data.tarde.filter(id => id !== justification.id);
        
        // Añadir a ausentes si no está ya (porque justificado es una ausencia justificada)
        if (!data.data.ausentes.includes(justification.id)) {
          data.data.ausentes.push(justification.id);
        }
      }
      
      // Actualizar el documento
      await updateDoc(docRef, {
        data: data.data,
        updatedAt: serverTimestamp()
      });
    } else {
      // Crear nuevo documento
      const newDoc: AttendanceDocument = {
        fecha,
        classId,
        teacherId: auth.currentUser?.uid || '',
        data: {
          presentes: [],
          ausentes: [justification.id], // Justificado va en ausentes
          tarde: [],
          justificacion: [justification],
          observations: ''
        }
      };
      
      await setDoc(docRef, {
        ...newDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return docId;
  } catch (error) {
    console.error('Error al añadir justificación:', error);
    throw error;
  }
};

/**
 * Actualiza las observaciones de un documento de asistencia
 */
export const updateObservationsFirebase = async (
  fecha: string,
  classId: string,
  observations: string
): Promise<string> => {
  try {
    const docId = getAttendanceDocId(fecha, classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Actualizar documento existente
      const data = docSnap.data() as AttendanceDocument;
      
      // Asegurar que la estructura de datos exista
      if (!data.data) {
        data.data = {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations
        };
      } else {
        data.data.observations = observations;
      }
      
      await updateDoc(docRef, {
        data: data.data,
        updatedAt: serverTimestamp()
      });
    } else {
      // Crear nuevo documento
      const newDoc: AttendanceDocument = {
        fecha,
        classId,
        teacherId: auth.currentUser?.uid || '',
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations
        }
      };
      
      await setDoc(docRef, {
        ...newDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return docId;
  } catch (error) {
    console.error('Error al actualizar observaciones:', error);
    throw error;
  }
};

/**
 * Obtiene todos los documentos de asistencia filtrados por rol de usuario
 */
export const getAllAttendanceDocumentsFirebase = async (): Promise<AttendanceDocument[]> => {
  try {
    // Verificar el rol del usuario actual para aplicar filtrado si es necesario
    const authStore = useAuthStore();
    const userId = authStore.user?.uid;
    const isTeacher = ['Teacher', 'Maestro'].includes(authStore.user?.role || '');
    
    // Generar clave de caché basada en el rol y usuario
    const cacheKey = generateCacheKey('attendance_all');
    
    // Intentar recuperar del caché
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      
      // Verificar si el caché aún es válido
      if (parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_DURATION)) {
        console.log('[Caché] Usando datos en caché para todos los documentos de asistencia');
        return parsed.data;
      }
    }
    
    // Referencia a la colección de asistencias en Firestore
    const attendanceCollection = collection(db, ATTENDANCE_COLLECTION);
    let queryRef;

    // Si es maestro, filtrar por teacherId
    if (isTeacher && userId) {
      console.log(`[Filtro] Aplicando filtro de maestro: teacherId == ${userId}`);
      queryRef = query(
        attendanceCollection,
        where('teacherId', '==', userId)
      );
    } else {
      console.log('[Filtro] Usuario Admin/Director - sin filtro de maestro');
      queryRef = attendanceCollection;
    }

    // Ejecutamos la consulta
    const querySnapshot = await getDocs(queryRef);
    
    // Procesamos los resultados
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceDocument));
    
    // Guardar en caché
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: documents
    }));
    
    console.log(`[Firestore] Obtenidos ${documents.length} documentos de asistencia`);
    return documents;
     
  } catch (error) {
    // En caso de error, lo registramos y lo volvemos a lanzar
    console.error('Error al obtener documentos de asistencia:', error);
    throw error;
  }
};

/**
 * Convierte documentos al formato antiguo para compatibilidad
 */
export const convertDocumentToRecords = (document: AttendanceDocument): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  // Mapear estudiantes presentes
  document.data.presentes.forEach(studentId => {
    records.push({
      studentId,
      classId: document.classId,
      Fecha: document.fecha,
      status: 'Presente'
    });
  });
  
  // Crear un conjunto (Set) de IDs de estudiantes con justificaciones para búsqueda rápida
  const justifiedStudentIds = new Set<string>();
  if (document.data.justificacion && Array.isArray(document.data.justificacion)) {
    document.data.justificacion.forEach((justification) => {
      if (justification && justification.id) {
        justifiedStudentIds.add(justification.id);
      }
    });
  }
  
  // Mapear estudiantes ausentes (verificar si tienen justificación)
  document.data.ausentes.forEach(studentId => {
    // Si el estudiante tiene una justificación, marcarlo como Justificado en lugar de Ausente
    if (justifiedStudentIds.has(studentId)) {
      records.push({
        studentId,
        classId: document.classId,
        Fecha: document.fecha,
        status: 'Justificado'
      });
    } else {
      records.push({
        studentId,
        classId: document.classId,
        Fecha: document.fecha,
        status: 'Ausente'
      });
    }
  });
  
  // Mapear estudiantes con tardanza/justificados
  document.data.tarde.forEach(studentId => {
    const justification = document.data.justificacion?.find(j => j.id === studentId);
    const isJustified = !!justification;
    
    records.push({
      studentId,
      classId: document.classId,
      Fecha: document.fecha,
      status: isJustified ? 'Justificado' : 'Tardanza',
      justification: isJustified ? {
        reason: justification.reason,
        documentUrl: justification.documentURL
      } : undefined,
      documentUrl: justification?.documentURL
    });
  });
  
  return records;
};

/**
 * Añade una observación al historial de una clase
 */
export const addClassObservationFirebase = async (
  classId: string,
  date: string,
  text: string,
  author: string
): Promise<string> => {
  try {
    const observationsCollection = collection(db, OBSERVATIONS_COLLECTION);
    
    const newObservation: ClassObservation = {
      id: '',
      classId,
      date,
      text,
      timestamp: Date.now(),
      author
    };
    
    const docRef = await addDoc(observationsCollection, {
      ...newObservation,
      createdAt: serverTimestamp()
    });

    
    await updateDoc(docRef, {
      id: docRef.id
    });
    
    // Actualizar también la observación actual en el documento de asistencia
    await updateObservationsFirebase(date, classId, text);
    
    return docRef.id;
  } catch (error) {
    console.error('Error al añadir observación:', error);
    throw error;
  }
}

export const getAllObservationsFirebase = async (): Promise<ClassObservation[]> => {
  try {
    const authStore = useAuthStore();
    const currentUser = authStore.user;
    const role = currentUser?.role || '';
    const uid = currentUser?.uid || '';
    
    // Generar clave para caché específica por usuario/rol
    const cacheKey = `observations_${role}_${uid}`;
    
    // Intentar obtener del caché primero
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        // Verificar si el caché es reciente (menos de 30 minutos)
        if (cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
          console.log('[Caché] Usando observaciones en caché');
          return cached.data;
        }
      } catch (e) {
        console.warn('Error al leer caché de observaciones:', e);
      }
    }
    
    console.log('Obteniendo observaciones de Firestore...');
    const observationsCollection = collection(db, OBSERVATIONS_COLLECTION);
    
    // Aplicar filtrado según el rol del usuario
    if (['Maestro', 'Teacher', 'teacher'].includes(role) && uid) {
      // Si es maestro, obtener las clases asignadas
      console.log(`[Filtro] Obteniendo observaciones para el maestro ${uid}`);
      
      // Obtener clases directamente sin importación dinámica para evitar referencias circulares
      const teacherClasses = await getTeacherClassesLocal(uid);
      
      if (teacherClasses.length === 0) {
        console.log('[Filtro] El maestro no tiene clases asignadas');
        return [];
      }
      
      // Extraer los IDs de las clases del profesor
      const classIds = teacherClasses.map(clase => clase.id);
      console.log(`[Filtro] Maestro tiene ${classIds.length} clases asignadas`);
      
      // Si el maestro tiene pocas clases, podemos usar la cláusula 'in'
      let observations: ClassObservation[] = [];
      
      if (classIds.length < 10) {
        // Consulta directa usando 'in' (eficiente para pocos valores)
        const q = query(
          observationsCollection,
          where('classId', 'in', classIds)
        );
        
        const querySnapshot = await getDocs(q);
        observations = querySnapshot.docs.map(doc => {
          const data = doc.data() as ClassObservation;
          return {
            ...data,
            id: doc.id
          };
        });
      } else {
        // Para muchas clases, obtenemos todas las observaciones y filtramos en memoria
        const querySnapshot = await getDocs(observationsCollection);
        observations = querySnapshot.docs
          .map(doc => {
            const data = doc.data() as ClassObservation;
            return {
              ...data,
              id: doc.id
            };
          })
          .filter(obs => classIds.includes(obs.classId));
      }
      
      console.log(`[Filtro] Encontradas ${observations.length} observaciones para el maestro`);
      
      // Ordenar por fecha y timestamp
      const sortedObservations = observations.sort((a, b) => {
        // Primero ordenar por fecha (más reciente primero)
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // Si las fechas son iguales, ordenar por timestamp
        const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0;
        return timestampB - timestampA;
      });
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: sortedObservations
        }));
      } catch (e) {
        console.warn('Error al guardar caché de observaciones:', e);
      }
      
      return sortedObservations;
    } else {
      // Para roles administrativos: obtener todas las observaciones
      console.log('[Filtro] Obteniendo todas las observaciones (rol admin/director)');
      const querySnapshot = await getDocs(observationsCollection);
      
      const observations = querySnapshot.docs.map(doc => {
        const data = doc.data() as ClassObservation;
        return {
          ...data,
          id: doc.id
        };
      });
      
      // Ordenar por fecha y timestamp
      const sortedObservations = observations.sort((a, b) => {
        // Primero ordenar por fecha (más reciente primero)
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // Si las fechas son iguales, ordenar por timestamp
        const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0;
        return timestampB - timestampA;
      });
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: sortedObservations
        }));
      } catch (e) {
        console.warn('Error al guardar caché de observaciones:', e);
      }
      
      return sortedObservations;
    }
  } catch (error) {
    console.error('Error al obtener observaciones:', error);
    throw error;
  }
}

/**
 * Métodos de compatibilidad con el sistema anterior
 */

/**
 * Obtiene todos los registros de asistencia
 */
export const getAttendancesFirebase = async (): Promise<AttendanceRecord[]> => {
  try {
    const documents = await getAllAttendanceDocumentsFirebase();
    // Convertir todos los documentos a registros
    const res = documents.flatMap(doc => convertDocumentToRecords(doc));
    return res
  } catch (error) {
    console.error('Error al obtener registros de asistencia:', error);
    throw error;
  }
};

/**
 * Obtiene registros de asistencia por fecha y clase
 */
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
    
    // Crear un conjunto de IDs de estudiantes con justificaciones para búsqueda rápida
    const justifiedStudentIds = new Set<string>();
    if (document.data?.justificacion && Array.isArray(document.data.justificacion)) {
      document.data.justificacion.forEach((justification) => {
        if (justification && justification.id) {
          justifiedStudentIds.add(justification.id);
          console.log(`[Procesando] Estudiante ${justification.id} tiene justificación: ${justification.reason}`);
        }
      });
    }
    
    console.log(`[Asistencia] Encontrados ${justifiedStudentIds.size} estudiantes con justificación`);
    
    // Procesar todos los registros con la función convertDocumentToRecords
    const records = convertDocumentToRecords(document);
    
    // Asegurarnos que los estudiantes con justificación se marquen correctamente
    return records.map(record => {
      // Si el estudiante tiene justificación y está ausente, cambiarlo a Justificado
      if (record.status === 'Ausente' && justifiedStudentIds.has(record.studentId)) {
        console.log(`[Asistencia] Corrigiendo estado de ${record.studentId} de Ausente a Justificado`);
        return {
          ...record,
          status: 'Justificado'
        };
      }
      return record;
    });
  } catch (error) {
    console.error('Error al obtener asistencia por fecha y clase:', error);
    throw error;
  }
};

/**
 * Actualiza un registro de asistencia
 */
export const updateAttendanceFirebase = async (attendanceData: AttendanceRecord): Promise<string> => {
  try {
    // Obtener o crear el documento
    const docId = getAttendanceDocId(attendanceData.Fecha, attendanceData.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    let document: AttendanceDocument;
    
    // Verificar si ya existe un documento para esta fecha y clase
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      document = docSnap.data() as AttendanceDocument;
    } else {
      // Crear el documento de asistencia
      document = {
        fecha: attendanceData.Fecha,
        classId: attendanceData.classId,
        teacherId: user?.uid || '', // Usar el ID del usuario actual como teacherId
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: ''
        }
      };
    }
    
    // Remover el estudiante de todos los arrays
    document.data.presentes = document.data.presentes.filter(id => id !== attendanceData.studentId);
    document.data.ausentes = document.data.ausentes.filter(id => id !== attendanceData.studentId);
    document.data.tarde = document.data.tarde.filter(id => id !== attendanceData.studentId);
    
    // Añadir el estudiante al array correspondiente
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
    
    // Manejar justificación si es necesario
    if (attendanceData.status === 'Justificado' && attendanceData.justification) {
      if (!document.data.justificacion) {
        document.data.justificacion = [];
      }
      
      const justIndex = document.data.justificacion.findIndex(j => j.id === attendanceData.studentId);
      const justificationReason = typeof attendanceData.justification === 'string' 
        ? attendanceData.justification 
        : attendanceData.justification.reason || '';
      
      if (justIndex !== -1) {
        document.data.justificacion[justIndex].reason = justificationReason;
        if (attendanceData.documentUrl) {
          document.data.justificacion[justIndex].documentURL = attendanceData.documentUrl;
        }
      } else {
        document.data.justificacion.push({
          id: attendanceData.studentId,
          reason: justificationReason,
          documentURL: attendanceData.documentUrl
        });
      }
    }
    
    // Guardar el documento
    await saveAttendanceDocumentFirebase(document);
    
    return docId;
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    throw error;
  }
};

/**
 * Añade una justificación a un registro
 */
export const updateAttendanceWithJustificationFirebase = async (
  studentId: string,
  date: string,
  classId: string,
  reason: string,
  file: File | null
): Promise<string> => {
  const justification: JustificationData = {
    id: studentId,
    reason
  };
  
  return addJustificationToAttendanceFirebase(date, classId, justification, file);
};

/**
 * Registra un nuevo registro de asistencia
 */
export const registerAttendanceFirebase = async (attendanceData: AttendanceRecord): Promise<string> => {
  // Usar el método updateAttendance para mantener consistencia
  return updateAttendanceFirebase(attendanceData);
};

/**
 * Obtiene un reporte completo de asistencia
 */
export const getAttendanceReport = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener reporte de asistencias:', error);
    throw new Error('Error al obtener el reporte de asistencias');
  }
}

/**
 * Fetches attendance records within a date range
 */
export const fetchAttendanceByDateRangeFirebase = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  try {
    // Create a query against the attendance collection
    const attendanceQuery = query(
      collection(db, 'ASISTENCIAS'),
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate),
      orderBy('fecha', 'asc')
    );

    const snapshot = await getDocs(attendanceQuery);
    const records: AttendanceRecord[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Process each document into a normalized attendance record format
      if (data.data) {
        // Handle newer document format
        const { fecha, classId, data: attendanceData } = data;
        
        // Process presente students
        if (attendanceData.presentes && Array.isArray(attendanceData.presentes)) {
          attendanceData.presentes.forEach((studentId: string) => {
            records.push({
              id: doc.id + '_' + studentId,
              studentId,
              classId,
              Fecha: fecha,
              status: 'Presente'
            });
          });
        }
        
        // Process ausente students
        if (attendanceData.ausentes && Array.isArray(attendanceData.ausentes)) {
          attendanceData.ausentes.forEach((studentId: string) => {
            records.push({
              id: doc.id + '_' + studentId,
              studentId,
              classId,
              Fecha: fecha,
              status: 'Ausente'
            });
          });
        }
        
        // Process tarde students (with possible justification)
        if (attendanceData.tarde && Array.isArray(attendanceData.tarde)) {
          attendanceData.tarde.forEach((studentId: string) => {
            const justification = attendanceData.justificacion?.find(
              (j: any) => j.id === studentId
            );
            
            records.push({
              id: doc.id + '_' + studentId,
              studentId,
              classId,
              Fecha: fecha,
              status: justification ? 'Justificado' : 'Tardanza',
              justification: justification ? justification.reason : undefined
            });
          });
        }
      } else {
        // Handle older direct record format
        records.push({
          id: doc.id,
          studentId: data.studentId,
          classId: data.classId,
          Fecha: data.Fecha,
          status: data.status,
          justification: data.justification
        });
      }
    });
    
    return records;
  } catch (error) {
    console.error('Error fetching attendance by date range:', error);
    throw error;
  }
};

/**
 * Gets the attendance status for a specific student on a specific date
 */
export const getAttendanceStatusFirebase = async (studentId: string, date: string, classId?: string): Promise<string> => {
  try {
    // Query the attendance collection for the specific date
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
    let q;
    
    if (classId) {
      q = query(
        attendanceRef,
        where("fecha", "==", date),
        where("classId", "==", classId)
      );
    } else {
      q = query(
        attendanceRef,
        where("fecha", "==", date)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data && data.data) {
        // Check if student is in presentes array
        if (data.data.presentes?.includes(studentId)) {
          return 'Presente';
        }
        
        // Check if student is in ausentes array
        if (data.data.ausentes?.includes(studentId)) {
          return 'Ausente';
        }
        
        // Check if student is in tarde array
        if (data.data.tarde?.includes(studentId)) {
          // Check if student has justification
          const hasJustification = data.data.justificacion?.some((j: JustificationData) => j.id === studentId);
          return hasJustification ? 'Justificado' : 'Tardanza';
        }
      }
    }
    
    // Default if not found
    return 'Ausente';
  } catch (error) {
    console.error('Error fetching student attendance status:', error);
    throw error;
  }
};

/**
 * Add a class observation to history
 * 
 * @param classId - Class identifier
 * @param date - Date string in YYYY-MM-DD format
 * @param text - Observation text
 * @param author - Author name or identifier
 * @returns Promise that resolves when the observation is added
 */
export async function addObservationToHistoryFirebase(
  classId: string, 
  date: string, 
  text: string, 
  author: string
): Promise<void> {
  try {
    // Check if an observation already exists for this class and date
    const existingQuery = query(
      collection(db, OBSERVATIONS_COLLECTION),
      where('classId', '==', classId), // classId is correct here as it's the property name in OBSERVATIONS_COLLECTION
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(existingQuery);
    
    if (!querySnapshot.empty) {
      // Observation exists, update it
      const existingObservation = querySnapshot.docs[0];
      await updateObservationInHistoryFirebase(existingObservation.id, text);
    } else {
      // No existing observation, create a new one
      const observationData = {
        text,
        createdAt: new Date().toISOString(),
        author,
        classId,
        date
      };
      
      // Add to the observations collection
      await addDoc(collection(db, OBSERVATIONS_COLLECTION), observationData);
    }
  } catch (error) {
    console.error('Firebase error adding observation to history:', error);
    throw error;
  }
}

/**
 * Update an existing observation in history
 * 
 * @param observationId - Observation document ID
 * @param text - Updated observation text
 * @returns Promise that resolves when the observation is updated
 */
export async function updateObservationInHistoryFirebase(
  observationId: string, 
  text: string
): Promise<void> {
  try {
    const obsRef = doc(db, OBSERVATIONS_COLLECTION, observationId);
    await updateDoc(obsRef, {
      text,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase error updating observation in history:', error);
    throw error;
  }
}

/**
 * Get observations history for a class, optionally filtered by date
 * 
 * @param classId - Class identifier
 * @param specificDate - Optional date filter
 * @returns Promise resolving to array of observation objects
 */
export async function getObservationsHistoryFirebase(
  classId?: string, 
  specificDate?: string
): Promise<any[]> {
  try {
    let queryRef;
    
    // Case 1: Both classId and specificDate provided
    if (classId && specificDate) {
      queryRef = query(
        collection(db, OBSERVATIONS_COLLECTION),
        where('classId', '==', classId), // classId is correct here as it's the property name in OBSERVATIONS_COLLECTION
        where('date', '==', specificDate),
        orderBy('createdAt', 'desc')
      );
    }
    // Case 2: Only classId provided
    else if (classId) {
      queryRef = query(
        collection(db, OBSERVATIONS_COLLECTION),
        where('classId', '==', classId), // classId is correct here as it's the property name in OBSERVATIONS_COLLECTION
        orderBy('createdAt', 'desc')
      );
    }
    // Case 3: Only specificDate provided
    else if (specificDate) {
      queryRef = query(
        collection(db, OBSERVATIONS_COLLECTION),
        where('date', '==', specificDate),
        orderBy('createdAt', 'desc')
      );
    }
    // Case 4: No filters, get all observations
    else {
      queryRef = query(
        collection(db, OBSERVATIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(queryRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Firebase error getting observations history:', error);
    return [];
  }
}

// Reference to the attendance collection
const attendanceCollection = collection(db, 'attendance');

// Helper to convert Firebase timestamp to string date
const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp 
    ? timestamp.toDate() 
    : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Fetch all attendance records
export async function fetchAttendanceRecords(startDate?: string, endDate?: string) {
  try {
    let q = attendanceCollection;
    
    // If date range is provided, add query filters
    if (startDate && endDate) {
      q = query(
        attendanceCollection,
        where('Fecha', '>=', startDate),
        where('Fecha', '<=', endDate)
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        classId: data.classId,
        Fecha: formatDate(data.Fecha) || data.Fecha,
        status: data.status,
        notes: data.notes
      };
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
}

// Add a new attendance record
export async function addAttendanceRecord(record) {
  try {
    const docRef = await addDoc(attendanceCollection, record);
    return { id: docRef.id, ...record };
  } catch (error) {
    console.error('Error adding attendance record:', error);
    throw error;
  }
}

// Update an attendance record
export async function updateAttendanceRecord(id, updates) {
  try {
    const docRef = doc(attendanceCollection, id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
}

// Delete an attendance record
export async function deleteAttendanceRecord(id) {
  try {
    const docRef = doc(attendanceCollection, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
}

/**
 * Get attendance documents optimized for a specific teacher and date range
 * @param teacherId The ID of the teacher
 * @param fromDate Start date in YYYY-MM-DD format
 * @param toDate End date in YYYY-MM-DD format
 * @returns Array of attendance documents
 */
export async function getTeacherAttendanceDocsFirebase(teacherId: string, fromDate: string, toDate: string): Promise<AttendanceDocument[]> {
  try {
    const db = getFirestore();
    const attendanceRef = collection(db, 'attendance');
    
    // Create a query with the provided filters
    let q = query(attendanceRef);
    
    // Add teacher filter if provided
    if (teacherId) {
      q = query(q, where('teacherId', '==', teacherId));
    }
    
    // Add date range filters if provided
    if (fromDate && toDate) {
      q = query(q, where('fecha', '>=', fromDate), where('fecha', '<=', toDate));
    }
    
    const querySnapshot = await getDocs(q);
    
    const documents: AttendanceDocument[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        fecha: data.fecha,
        classId: data.classId,
        teacherId: data.teacherId,
        data: {
          presentes: data.data?.presentes || [],
          ausentes: data.data?.ausentes || [],
          tarde: data.data?.tarde || [],
          justificacion: data.data?.justificacion || [],
          observations: data.data?.observations || ''
        }
      });
    });
    
    return documents;
  } catch (error) {
    console.error('Error fetching teacher attendance documents:', error);
    throw error;
  }
}

/**
 * Obtiene documentos de asistencia para una fecha específica
 * Re-exportamos la función para mantener la consistencia
 */
export const fetchAttendanceByDateFirebase = fetchByDate;
/**
 * Obtiene la asistencia de un estudiante en una fecha específica
 * @param studentId El ID del estudiante
 * @param date La fecha en formato YYYY-MM-DD
 * @returns El estado de asistencia del estudiante
 */
export async function getStudentAttendanceByDate(studentId: string, date: string): Promise<string | null> {
  try {
    const snapshot = await getDocs(query(attendanceCollection, where('studentId', '==', studentId), where('Fecha', '==', date)));
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return doc.data().status || null;
  } catch (error) {
    console.error('Error getting student attendance by date:', error);
    throw error;
  }
}