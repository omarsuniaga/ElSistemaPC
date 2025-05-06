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
  ClassObservation 
} from '../types/attendance';
import { auth } from '../../../firebase'; // Asegúrate de importar auth desde tu configuración de Firebase

// Constants
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const OBSERVATIONS_COLLECTION = 'OBSERVACIONES';

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
    
    const updates = {
      ...attendanceDoc,
      updatedAt: serverTimestamp()
    };
    
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
      
      // Asegurarse de que el estudiante está en el array tarde y no en ausentes/presentes
      if (!data.data.presentes.includes(justification.id) && 
          !data.data.tarde.includes(justification.id)) {
        
        // Quitar de ausentes si está ahí
        data.data.ausentes = data.data.ausentes.filter(id => id !== justification.id);
        
        // Añadir a tarde si no está ya
        if (!data.data.tarde.includes(justification.id)) {
          data.data.tarde.push(justification.id);
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
        data: {
          presentes: [],
          ausentes: [],
          tarde: [justification.id],
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
 * Obtiene todos los documentos de asistencia por maestro
 */
export const getAllAttendanceDocumentsFirebase = async (
  teacherId?: string
): Promise<AttendanceDocument[]> => {
  try {
    // Referencia a la colección de asistencias en Firestore
    const attendanceCollection = collection(db, ATTENDANCE_COLLECTION);

    // Si se proporciona teacherId, filtramos por ese campo
    if (teacherId) {
      const teacherQuery = query(
        attendanceCollection,
        where('teacherId', '==', teacherId)
      );

      // Ejecutamos la consulta filtrada
      const querySnapshot = await getDocs(teacherQuery);

      // Mappeamos cada documento al tipo AttendanceDocument
      // e incluimos el ID del documento en la propiedad 'id'
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as AttendanceDocument;
        return {
          ...data,
          id: doc.id
        };
      });
    } else {
      // Si no se pasa teacherId, traemos todos los documentos
      const querySnapshot = await getDocs(attendanceCollection);

      // Convertimos cada documento al tipo AttendanceDocument
      const res = querySnapshot.docs.map(doc =>
        doc.data() as AttendanceDocument
      );

      // Mostramos en consola los datos para fines de depuración
      console.log('Document Data:', res);

      return res;
    }
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
  
  // Mapear estudiantes ausentes
  document.data.ausentes.forEach(studentId => {
    records.push({
      studentId,
      classId: document.classId,
      Fecha: document.fecha,
      status: 'Ausente'
    });
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
    const observationsCollection = collection(db, OBSERVATIONS_COLLECTION);
    const querySnapshot = await getDocs(observationsCollection);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as ClassObservation;
      return {
        ...data,
        id: doc.id
      };
    });
  } catch (error) {
    console.error('Error al obtener observaciones:', error);
    throw error;
  }
} ;


// Modificar la función getClassObservationsHistoryFirebase para evitar problemas de índices
export async function getClassObservationsHistoryFirebase(uid: string): Promise<ClassObservation[]> {
  try {
    // En lugar de usar una consulta compuesta que requiere un índice
    // primero obtenemos todas las observaciones para la clase
    const observationsQuery = query(
      collection(db, 'ASISTENCIAS'),
      where('uid', '==', uid),
    );
    
    const querySnapshot = await getDocs(observationsQuery);
    
    // Después ordenamos manualmente los resultados
    const observations = querySnapshot.docs.map(doc => {
      const data = doc.data() as ClassObservation;
      return data;
    });
    
    // ordenar por .fecha descendente
    return observations.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return dateB - dateA;
    });

  } catch (error) {
    console.error('Error al obtener historial de observaciones:', error);
    throw error;
  }
}

// Modificar la función getClassObservationsByDateFirebase para evitar problemas de índices
export async function getClassObservationsByDateFirebase(classId: string, date: string): Promise<ClassObservation[]> {
  try {
    console.log('Consultando observaciones para clase y fecha:', classId, date);
    
    // Primero filtramos por classId y date, sin ordenar (no requiere índice compuesto)
    const observationsQuery = query(
      collection(db, 'classObservations'),
      where('classId', '==', classId),
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(observationsQuery);
    
    // Procesamos y ordenamos manualmente
    const observations = querySnapshot.docs.map(doc => {
      const data = doc.data() as ClassObservation;
      return {
        id: doc.id,
        classId: data.classId,
        date: data.date,
        text: data.text || '',
        author: data.author || 'Sistema',
        timestamp: typeof data.timestamp === 'string' ? new Date(data.timestamp).getTime() : data.timestamp || Date.now()
      };
    });
    
    // Ordenamos por timestamp (descendente)
    return observations.sort((a, b) => {
      const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0;
      const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0;
      return timestampB - timestampA;
    });
    
  } catch (error) {
    console.error('Error al obtener observaciones por fecha:', error);
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
    console.log('Registros de asistencia:', res);
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
    
    return convertDocumentToRecords(document);
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
    const docSnap = await getDoc(docRef);
    
    let document: AttendanceDocument;
    
    if (docSnap.exists()) {
      document = docSnap.data() as AttendanceDocument;
    } else {
      document = {
        fecha: attendanceData.Fecha,
        classId: attendanceData.classId,
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
      where('classId', '==', classId),
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
  classId: string, 
  specificDate?: string
): Promise<any[]> {
  try {
    let queryRef;
    
    if (specificDate) {
      // Get observations for a specific class and date
      queryRef = query(
        collection(db, OBSERVATIONS_COLLECTION),
        where('classId', '==', classId),
        where('date', '==', specificDate),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Get all observations for a class
      queryRef = query(
        collection(db, OBSERVATIONS_COLLECTION),
        where('classId', '==', classId),
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