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
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import type { 
  AttendanceDocument, 
  JustificationData, 
  AttendanceRecord,
  ClassObservationData
} from '../types/attendance';
import { auth } from '../../../firebase';
import { fetchAttendanceByDateFirebase as fetchByDate } from './attendance/fetchByDate';
import { getAllAttendanceDocumentsFirebase } from '../services/firebase';

// Constants
export const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const OBSERVATIONS_COLLECTION = 'OBSERVACIONES';
const CLASSES_COLLECTION = 'CLASES';

/**
 * Genera un ID de documento consistente para documentos de asistencia
 */
const getAttendanceDocId = (fecha: string, classId: string): string => `${fecha}_${classId}`;

/* Local interface removed to use the imported AttendanceDocument type */
// Note: Using the interface from the types file

/**
 * Obtiene un documento de asistencia por date y clase
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
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data
      } as AttendanceDocument;
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
    const docId = attendanceDoc.id || getAttendanceDocId(attendanceDoc.fecha, attendanceDoc.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    await setDoc(docRef, { 
      ...attendanceDoc, 
      updatedAt: serverTimestamp(),
      id: docId // Asegurar que el ID es parte de los datos del documento
    }, { merge: true });
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
      justification.documentUrl = await getDownloadURL(storageRef);
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
          observación: '',
          observations: []
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
          observación: '',
          observations: []
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
          observación: '',
          observations
        };
      } else {
        data.data.observations = observations;
      }
      
      await updateDoc(docRef, {
        'data.observations': observations
      });
    } else {
      // Documento no existe, crear uno nuevo con observaciones
      await setDoc(docRef, {
        id: docId,
        fecha,
        classId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations
        },
        createdAt: serverTimestamp()
      });
    }
    return docId;
  } catch (error) {
    console.error('Error al actualizar observaciones:', error);
    throw error;
  }
}

/**
 * Obtiene todos los registros de asistencia
 */
export const getAttendancesFirebase = async (): Promise<AttendanceRecord[]> => {
  try {
    const documents = await getAllAttendanceDocumentsFirebase();
    // Convertir todos los documentos a registros
    const res = documents.flatMap(doc => convertDocumentToRecords(doc));
    return res;
  } catch (error) {
    console.error('Error al obtener registros de asistencia:', error);
    throw error;
  }
};

/**
 * Convierte un documento de asistencia en registros individuales
 * @param doc Documento de asistencia
 * @returns Array de registros de asistencia
 */
const convertDocumentToRecords = (doc: AttendanceDocument): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  // Si no hay datos, retornar array vacío
  if (!doc.data) return records;
  
  const { fecha, classId } = doc;
  
  // Procesar presentes
  if (doc.data.presentes && Array.isArray(doc.data.presentes)) {
    doc.data.presentes.forEach((studentId: string) => {
      records.push({
        id: `${fecha}_${classId}_${studentId}`,
        fecha: fecha,
        classId,
        studentId,
        status: 'Presente',
        createdAt: new Date()
      });
    });
  }
  
  // Procesar ausentes
  if (doc.data.ausentes && Array.isArray(doc.data.ausentes)) {
    doc.data.ausentes.forEach((studentId: string) => {
      records.push({
        id: `${fecha}_${classId}_${studentId}`,
        fecha: fecha,
        classId,
        studentId,
        status: 'Ausente',
        createdAt: new Date()
      });
    });
  }
  
  // Procesar tarde
  if (doc.data.tarde && Array.isArray(doc.data.tarde)) {
    doc.data.tarde.forEach((studentId: string) => {
      records.push({
        id: `${fecha}_${classId}_${studentId}`,
        fecha: fecha,
        classId,
        studentId,
        status: 'Tardanza',
        createdAt: new Date()
      });
    });
  }
  
  return records;
};

/**
 * Obtiene registros de asistencia por date y clase
 */
export const getAttendanceByDateAndClassFirebase = async (
  fecha?: string, 
  classId?: string
): Promise<AttendanceRecord[]> => {
  try {
    if (!fecha || !classId) {
      throw new Error("fecha y classId son requeridos");
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
        }
      });
    }
    
    // Procesar todos los registros con la función convertDocumentToRecords
    const records = convertDocumentToRecords(document);
    
    // Asegurarnos que los estudiantes con justificación se marquen correctamente
    return records.map(record => {
      // Si el estudiante tiene justificación y está ausente, cambiarlo a Justificado
      if (record.status === 'Ausente' && justifiedStudentIds.has(record.studentId)) {
        return {
          ...record,
          status: 'Justificado'
        };
      }
      return record;
    });
  } catch (error) {
    console.error('Error al obtener asistencia por date y clase:', error);
    throw error;
  }
};

/**
 * Actualiza un registro de asistencia
 */
export const updateAttendanceFirebase = async (attendanceData: AttendanceRecord): Promise<string> => {
  try {
    // Obtener o crear el documento
    const docId = getAttendanceDocId(attendanceData.fecha, attendanceData.classId);
    const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
    let document: AttendanceDocument;
    
    // Verificar si ya existe un documento para esta date y clase
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      document = docSnap.data() as AttendanceDocument;
    } else {
      // Crear el documento de asistencia
      document = {
        fecha: attendanceData.fecha, 
        classId: attendanceData.classId,
        teacherId: auth.currentUser?.uid || '', 
        uid: auth.currentUser?.uid || '',
        // Convertimos serverTimestamp a Date para cumplir con el tipo AttendanceDocument
        createdAt: new Date(),
        updatedAt: new Date(),
        id: docId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observación: '', // Campo requerido según la interfaz
          observations: [] // Array de observaciones estructuradas
        }
      } as AttendanceDocument;
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
        document.data.tarde.push(attendanceData.studentId);
        break;
      case 'Justificado':
        // For justified students, ONLY add them to the ausentes array
        // We will identify them as justified by their presence in the justificacion array
        document.data.ausentes.push(attendanceData.studentId);
        break;
    }
    
    // Manejar justificación si es necesario
    if (attendanceData.status === 'Justificado') {
      // Ensure justificacion array exists
      if (!document.data.justificacion) {
        document.data.justificacion = [];
      }
      
      // Extract justification details
      const justificationData = attendanceData.justification || {};
      
      // Get reason from the justification object
      const justificationReason = typeof justificationData === 'string' 
        ? justificationData 
        : (justificationData.reason || 'Justificación registrada');
      
      // Get document URL (use null instead of undefined)
      const documentUrl = attendanceData.documentUrl || 
                         (typeof justificationData !== 'string' ? justificationData.documentUrl : null) || 
                         null;
      
      // Check if justification already exists
      const justIndex = document.data.justificacion.findIndex(j => j.id === attendanceData.studentId);
      
      if (justIndex !== -1) {
        // Update existing justification
        document.data.justificacion[justIndex].reason = justificationReason;
        document.data.justificacion[justIndex].documentUrl = documentUrl;
      } else {
        // Add new justification
        document.data.justificacion.push({
          id: attendanceData.studentId,
          studentId: attendanceData.studentId,
          classId: attendanceData.classId,
          fecha: attendanceData.fecha, 
          reason: justificationReason,
          documentUrl: documentUrl,
          approvalStatus: 'pending',
          createdAt: new Date(),
          timeLimit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
      }
    } else if (attendanceData.justification) {
      // If there's justification data but status is not Justificado,
      // Make sure it's preserved for historical purposes
      if (!document.data.justificacion) {
        document.data.justificacion = [];
      }
      
      const justIndex = document.data.justificacion.findIndex(j => j.id === attendanceData.studentId);
      if (justIndex === -1) {
        // Only add if it doesn't exist yet
        const justificationData = attendanceData.justification;
        document.data.justificacion.push({
          id: attendanceData.studentId,
          studentId: attendanceData.studentId,
          classId: attendanceData.classId,
          fecha: attendanceData.fecha, 
          reason: typeof justificationData === 'string' ? justificationData : (justificationData?.reason || ''),
          documentUrl: (typeof justificationData !== 'string' ? justificationData?.documentUrl : null) || null,
          approvalStatus: 'pending',
          createdAt: new Date(),
          timeLimit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
      }
    }
    
    // Make sure the justification is preserved even when status is changed
    // Don't remove justification when status changes to something else
    
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
    id: `${studentId}_${classId}_${date}`, // ID único formado por los valores
    studentId: studentId,
    classId: classId,
    fecha: date,
    reason: reason,
    documentUrl: undefined, // Se actualizará si hay archivo
    approvalStatus: 'pending',
    createdAt: new Date(),
    timeLimit: new Date(new Date().getTime() + 48 * 60 * 60 * 1000) // 48 horas desde ahora
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
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(attendanceQuery);
    const records: AttendanceRecord[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Process each document into a normalized attendance record format
      if (data.data) {
        // Handle newer document format
        const { date, classId, data: attendanceData } = data;
        
        // Process presente students
        if (attendanceData.presentes && Array.isArray(attendanceData.presentes)) {
          attendanceData.presentes.forEach((studentId: string) => {
            records.push({
              id: doc.id + '_' + studentId,
              studentId,
              classId,
              fecha: date,
              status: 'Presente',
              createdAt: new Date(),
              updatedAt: new Date()
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
              fecha: date,
              status: 'Ausente',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
        }
        
        // Process tarde students (with possible justification)
        if (attendanceData.tarde && Array.isArray(attendanceData.tarde)) {
          attendanceData.tarde.forEach((studentId: string) => {
            const justification = attendanceData.justificacion?.find(
              (j: JustificationData) => j.id === studentId
            );
            
            records.push({
              id: doc.id + '_' + studentId,
              studentId,
              classId,
              fecha: date,
              status: justification ? 'Justificado' : 'Tardanza',
              justification: justification ? justification.reason : undefined,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
        }
      } else {
        // Handle older direct record format
        records.push({
          id: doc.id,
          studentId: data.studentId,
          classId: data.classId,
          fecha: data.date,
          status: data.status,
          justification: data.justification,
          createdAt: new Date(),
          updatedAt: new Date()
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
  author: string,
  studentId?: string
): Promise<void> {
  try {
    // Create query conditions based on whether this is a class or student observation
    const queryConditions = [
      where('classId', '==', classId),
      where('date', '==', date)
    ];
    
    // If studentId is provided, add it to the query conditions for student-specific observation
    if (studentId) {
      queryConditions.push(where('studentId', '==', studentId));
    } else {
      // For class-level observations, we want to find ones without a studentId
      // Firebase doesn't support direct "where field is null" so we use approach below
      queryConditions.push(where('studentId', '==', null));
    }
    
    // Check if an observation already exists for this class/date/student combination
    const existingQuery = query(
      collection(db, OBSERVATIONS_COLLECTION),
      ...queryConditions
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
): Promise<ObservationRecord[]> {
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
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        classId: data.classId,
        date: formatDate(data.date) || data.date,
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
export async function addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
  try {
    // Clean the record before sending to Firestore by replacing undefined values with null
    // Using JSON.parse/stringify to recursively clean all undefined values
    const cleanedRecord = JSON.parse(JSON.stringify(record));
    
    // Additionally, specifically handle justification.documentUrl if it exists and is undefined
    // This is important as Firebase doesn't accept undefined values
    if (cleanedRecord.justification && cleanedRecord.justification.documentUrl === undefined) {
      cleanedRecord.justification.documentUrl = null;
    }
    
    // Extra check for any nested undefined values that might have been missed
    const sanitizeUndefined = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
          obj[key] = null;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeUndefined(obj[key]);
        }
      });
    };
    
    sanitizeUndefined(cleanedRecord);
    
    const docRef = await addDoc(attendanceCollection, cleanedRecord);
    return { id: docRef.id, ...record } as AttendanceRecord;
  } catch (error) {
    console.error('Error adding attendance record:', error);
    throw error;
  }
}

// Update an attendance record
export async function updateAttendanceRecord(id: string, updates: any) {
  try {
    // Clean the updates before sending to Firestore
    const cleanedUpdates = JSON.parse(JSON.stringify(updates));
    
    // Specifically handle justification.documentUrl if it exists and is undefined
    if (cleanedUpdates.justification && cleanedUpdates.justification.documentUrl === undefined) {
      cleanedUpdates.justification.documentUrl = null;
    }
    
    // Extra check for any nested undefined values that might have been missed
    const sanitizeUndefined = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
          obj[key] = null;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeUndefined(obj[key]);
        }
      });
    };
    
    sanitizeUndefined(cleanedUpdates);
    
    const docRef = doc(attendanceCollection, id);
    await updateDoc(docRef, cleanedUpdates);
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
}

// Delete an attendance record
export async function deleteAttendanceRecord(id: string): Promise<{ success: boolean }> {
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
      q = query(q, where('date', '>=', fromDate), where('date', '<=', toDate));
    }
    
    const querySnapshot = await getDocs(q);
    
    const documents: AttendanceDocument[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        date: data.date,
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
 * Obtiene documentos de asistencia para una date específica
 * Re-exportamos la función para mantener la consistencia
 */
export const fetchAttendanceByDateFirebase = fetchByDate;
/**
 * Obtiene la asistencia de un estudiante en una date específica
 * @param studentId El ID del estudiante
 * @param date La date en formato YYYY-MM-DD
 * @returns El estado de asistencia del estudiante
 */
export async function getStudentAttendanceByDate(studentId: string, date: string): Promise<string | null> {
  try {
    const snapshot = await getDocs(query(attendanceCollection, where('studentId', '==', studentId), where('date', '==', date)));
    if (!snapshot.empty && snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      // Ensure AttendanceRecord is imported and matches the expected structure
      // Ensure studentId and date are available in this scope (e.g., as function parameters)
      return { id: doc.id, ...doc.data() } as AttendanceRecord;
    } else {
      return null; // No record found
    }
  } catch (error: any) {
    // Log with more context if studentId and date are available function parameters
    console.error(`Error fetching student attendance by date:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Verifica permisos de maestro antes de registrar asistencia
 * Integración con el sistema de colaboración de maestros
 */
async function validateTeacherPermissions(classId: string, teacherId: string, action: 'attendance' | 'observation' | 'history'): Promise<boolean> {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { canTeacherRecordAttendance, canTeacherAddObservations, canTeacherViewAttendanceHistory } = await import('../../Classes/service/classes');
    
    switch (action) {
      case 'attendance':
        return await canTeacherRecordAttendance(classId, teacherId);
      case 'observation':
        return await canTeacherAddObservations(classId, teacherId);
      case 'history':
        return await canTeacherViewAttendanceHistory(classId, teacherId);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error validating teacher permissions:', error);
    return false;
  }
}

/**
 * Versión mejorada de addAttendanceRecord que verifica permisos de maestro
 */
export async function addAttendanceRecordWithPermissions(
  record: Omit<AttendanceRecord, 'id'>, 
  teacherId: string
): Promise<AttendanceRecord> {
  try {
    // Verificar permisos del maestro para esta clase
    const hasPermission = await validateTeacherPermissions(record.classId, teacherId, 'attendance');
    
    if (!hasPermission) {
      throw new Error('No tienes permisos para registrar asistencia en esta clase');
    }
    
    // Agregar información del maestro que registra la asistencia
    const recordWithTeacher = {
      ...record,
      updatedBy: teacherId,
      updatedAt: new Date()
    };
    
    // Usar la función original con los datos enriquecidos
    return await addAttendanceRecord(recordWithTeacher);
  } catch (error) {
    console.error('Error adding attendance record with permissions:', error);
    throw error;
  }
}

/**
 * Versión mejorada de updateAttendanceRecord que verifica permisos de maestro
 */
export async function updateAttendanceRecordWithPermissions(
  id: string, 
  updates: any, 
  teacherId: string, 
  classId: string
): Promise<void> {
  try {
    // Verificar permisos del maestro para esta clase
    const hasPermission = await validateTeacherPermissions(classId, teacherId, 'attendance');
    
    if (!hasPermission) {
      throw new Error('No tienes permisos para actualizar asistencia en esta clase');
    }
    
    // Agregar información del maestro que actualiza la asistencia
    const updatesWithTeacher = {
      ...updates,
      updatedBy: teacherId,
      updatedAt: new Date()
    };
    
    // Usar la función original con los datos enriquecidos
    await updateAttendanceRecord(id, updatesWithTeacher);
  } catch (error) {
    console.error('Error updating a