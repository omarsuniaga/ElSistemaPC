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
  orderBy,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import type { AttendanceDocument, JustificationData, AttendanceRecord, ClassObservation } from '../../Attendance/types/attendance';

/**
 * Obtiene un documento de asistencia por fecha y clase
 * @param fecha - La fecha de asistencia en formato YYYY-MM-DD
 * @param classId - El ID de la clase
 * @returns El documento de asistencia o null si no existe
 */
export const getAttendanceDocumentFirebase = async (
  fecha: string,
  classId: string
): Promise<AttendanceDocument | null> => {
  try {
    console.log(`🔍 Buscando documento de asistencia para fecha ${fecha} y clase ${classId}`);
    
    // Crear un ID de documento combinando fecha y classId
    const docId = `${fecha}_${classId}`;
    
    // Obtener el documento
    const docRef = doc(db, 'ASISTENCIAS', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('📄 Documento encontrado');
      const data = docSnap.data() as AttendanceDocument;
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
  attendanceDoc: AttendanceDocument
): Promise<string> => {
  try {
    console.log('💾 Guardando documento de asistencia:', attendanceDoc);
    
    // Crear un ID de documento combinando fecha y classId
    const docId = `${attendanceDoc.fecha}_${attendanceDoc.classId}`;
    
    // Referencia al documento
    const docRef = doc(db, 'ASISTENCIAS', docId);
    
    // Verificar si el documento ya existe
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('🔄 Actualizando documento existente');
      await updateDoc(docRef, {
        ...attendanceDoc,
        updatedAt: serverTimestamp()
      });
    } else {
      console.log('➕ Creando nuevo documento');
      await setDoc(docRef, {
        ...attendanceDoc,
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
    console.log('📝 Añadiendo justificación para estudiante:', justification.id);
    
    // Si hay un archivo, subirlo primero
    if (file) {
      const storageRef = ref(storage, `justifications/${fecha}_${justification.id}_${classId}_${file.name}`);
      await uploadBytes(storageRef, file);
      justification.documentURL = await getDownloadURL(storageRef);
    }
    
    // Obtener el documento existente
    const docId = `${fecha}_${classId}`;
    const docRef = doc(db, 'ASISTENCIAS', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Documento existe, actualizar el array de justificaciones
      const data = docSnap.data() as AttendanceDocument;
      
      // Asegurar que existe la estructura de datos
      if (!data.data) {
        data.data = {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: ''
        };
      }
      
      if (!data.data.justificacion) {
        data.data.justificacion = [];
      }
      
      // Buscar si ya existe una justificación para este estudiante
      const justIndex = data.data.justificacion.findIndex(j => j.id === justification.id);
      
      if (justIndex !== -1) {
        // Actualizar la justificación existente
        data.data.justificacion[justIndex] = justification;
      } else {
        // Añadir nueva justificación
        data.data.justificacion.push(justification);
      }
      
      // Asegurarse de que el estudiante está en el array de ausentes justificados
      // Y quitarlo de ausentes si está ahí
      if (!data.data.presentes.includes(justification.id) && 
          !data.data.tarde.includes(justification.id)) {
        
        // Quitar de ausentes si está ahí
        const ausenteIndex = data.data.ausentes.indexOf(justification.id);
        if (ausenteIndex !== -1) {
          data.data.ausentes.splice(ausenteIndex, 1);
        }
        
        // Asegurarse de que está en el array de tardanza (asumiendo que es la categoría para justificados)
        if (!data.data.tarde.includes(justification.id)) {
          data.data.tarde.push(justification.id);
        }
      }
      
      // Actualizar el documento
      await updateDoc(docRef, {
        data: data.data,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Justificación añadida con éxito');
    } else {
      // No existe el documento, crearlo primero
      const newDoc: AttendanceDocument = {
        fecha,
        classId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [justification.id], // Poner al estudiante como tarde (justificado)
          justificacion: [justification],
          observations: ''
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
 * @param observations - Las observaciones a guardar
 * @returns El ID del documento actualizado
 */
export const updateObservationsFirebase = async (
  fecha: string,
  classId: string,
  observations: string
): Promise<string> => {
  try {
    console.log('📝 Actualizando observaciones de clase');
    
    const docId = `${fecha}_${classId}`;
    const docRef = doc(db, 'ASISTENCIAS', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Documento existe, actualizar observaciones
      const data = docSnap.data() as AttendanceDocument;
      
      // Asegurar que existe la estructura de datos
      if (!data.data) {
        data.data = {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: observations
        };
      } else {
        data.data.observations = observations;
      }
      
      // Actualizar el documento
      await updateDoc(docRef, {
        data: data.data,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Observaciones actualizadas con éxito');
    } else {
      // No existe el documento, crearlo primero
      const newDoc: AttendanceDocument = {
        fecha,
        classId,
        data: {
          presentes: [],
          ausentes: [],
          tarde: [],
          justificacion: [],
          observations: observations
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
    
    const attendanceCollection = collection(db, 'ASISTENCIAS');
    const querySnapshot = await getDocs(attendanceCollection);
    
    const documents: AttendanceDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AttendanceDocument;
      documents.push(data);
    });
    
    console.log(`✅ Se encontraron ${documents.length} documentos de asistencia`);
    return documents;
  } catch (error) {
    console.error('❌ Error al obtener documentos de asistencia:', error);
    throw error;
  }
};

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
      studentId,
      classId: document.classId,
      Fecha: document.fecha,
      status: 'Presente'
    });
  });
  
  // Convertir ausentes
  document.data.ausentes.forEach(studentId => {
    records.push({
      studentId,
      classId: document.classId,
      Fecha: document.fecha,
      status: 'Ausente'
    });
  });
  
  // Convertir tarde
  document.data.tarde.forEach(studentId => {
    const isJustified = document.data.justificacion?.some(j => j.id === studentId);
    records.push({
      studentId,
      classId: document.classId,
      Fecha: document.fecha,
      status: isJustified ? 'Justificado' : 'Tardanza',
      justification: isJustified ? 
        { reason: document.data.justificacion.find(j => j.id === studentId)?.reason } : undefined,
      documentUrl: isJustified ?
        document.data.justificacion.find(j => j.id === studentId)?.documentURL : undefined
    });
  });
  
  return records;
};

/**
 * Añade una nueva observación al historial de una clase
 * @param classId - El ID de la clase
 * @param date - La fecha de la clase (YYYY-MM-DD)
 * @param text - El texto de la observación
 * @param author - El nombre o ID del profesor que añade la observación
 * @returns El ID de la nueva observación
 */
export const addClassObservationFirebase = async (
  classId: string,
  date: string,
  text: string,
  author: string
): Promise<string> => {
  try {
    console.log('📝 Añadiendo nueva observación de clase');
    
    // Crear documento en la colección de observaciones
    const observationsCollection = collection(db, 'OBSERVACIONES_CLASE');
    
    const newObservation: ClassObservation = {
      id: '', // Se asignará después
      classId,
      date,
      text,
      timestamp: Date.now(),
      author
    };
    
    // Añadir el documento y obtener su ID
    const docRef = await addDoc(observationsCollection, {
      ...newObservation,
      createdAt: serverTimestamp()
    });
    
    // Actualizar el ID con el generado por Firestore
    await updateDoc(docRef, {
      id: docRef.id
    });
    
    console.log('✅ Observación añadida con éxito:', docRef.id);
    
    // También actualizar la observación actual en el documento de asistencia por compatibilidad
    await updateObservationsFirebase(date, classId, text);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al añadir observación:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de observaciones para una clase
 * @param classId - El ID de la clase
 * @returns Lista de observaciones ordenadas por fecha (la más reciente primero)
 */
export const getClassObservationsHistoryFirebase = async (
  classId: string
): Promise<ClassObservation[]> => {
  try {
    console.log('🔍 Obteniendo historial de observaciones para la clase:', classId);
    
    const observationsCollection = collection(db, 'OBSERVACIONES_CLASE');
    const q = query(
      observationsCollection,
      where('classId', '==', classId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const observations: ClassObservation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ClassObservation;
      observations.push(data);
    });
    
    console.log(`✅ Se encontraron ${observations.length} observaciones para la clase`);
    return observations;
  } catch (error) {
    console.error('❌ Error al obtener historial de observaciones:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de observaciones para una fecha y clase específicas
 * @param classId - El ID de la clase
 * @param date - La fecha de la clase (YYYY-MM-DD)
 * @returns Lista de observaciones ordenadas por fecha (la más reciente primero)
 */
export const getClassObservationsByDateFirebase = async (
  classId: string,
  date: string
): Promise<ClassObservation[]> => {
  try {
    console.log(`🔍 Obteniendo observaciones para clase ${classId} en fecha ${date}`);
    
    const observationsCollection = collection(db, 'OBSERVACIONES_CLASE');
    const q = query(
      observationsCollection,
      where('classId', '==', classId),
      where('date', '==', date),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const observations: ClassObservation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ClassObservation;
      observations.push(data);
    });
    
    console.log(`✅ Se encontraron ${observations.length} observaciones para la fecha y clase`);
    return observations;
  } catch (error) {
    console.error('❌ Error al obtener observaciones por fecha:', error);
    throw error;
  }
};

// Métodos de compatibilidad con el sistema anterior

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
    // Obtener el documento existente o crear uno nuevo
    const docId = `${attendanceData.Fecha}_${attendanceData.classId}`;
    const docRef = doc(db, 'ASISTENCIAS', docId);
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
      const justIndex = document.data.justificacion.findIndex(j => j.id === attendanceData.studentId);
      
      if (justIndex !== -1) {
        document.data.justificacion[justIndex].reason = attendanceData.justification.reason ?? "";
        if (attendanceData.documentUrl) {
          document.data.justificacion[justIndex].documentURL = attendanceData.documentUrl;
        }
      } else {
        document.data.justificacion.push({
          id: attendanceData.studentId,
          reason: attendanceData.justification.reason || "",
          documentURL: attendanceData.documentUrl
        });
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
  const justification: JustificationData = {
    id: studentId,
    reason: reason
  };
  
  return addJustificationToAttendanceFirebase(date, classId, justification, file);
};

export const registerAttendanceFirebase = async (attendanceData: AttendanceRecord): Promise<string> => {
  // Usar el método updateAttendance para mantener la compatibilidad
  return updateAttendanceFirebase(attendanceData);
};

export const getAttendanceReport = async () => {
  try {
    console.log('🔄 Consultando reporte de asistencias...')
    const q = query(collection(db, 'ASISTENCIAS'))
    const snapshot = await getDocs(q)
    console.log(`✅ Asistencias recuperadas: ${snapshot.size}`)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('❌ Error al obtener reporte de asistencias:', error)
    throw new Error('Error al obtener el reporte de asistencias')
  }
}
