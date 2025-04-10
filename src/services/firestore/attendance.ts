// src/services/firestore/attendance.ts
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  setDoc,
  getDoc,
  query, 
  where,  
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import type { AttendanceDocument, JustificationData, AttendanceRecord } from '../../modulos/Attendance/types/attendance';

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
        document.data.justificacion.find(j => j.id === studentId)?.reason : undefined,
      documentUrl: isJustified ?
        document.data.justificacion.find(j => j.id === studentId)?.documentURL : undefined
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
        document.data.justificacion[justIndex].reason = typeof attendanceData.justification === 'string' ? attendanceData.justification : (attendanceData.justification as string);
        if (attendanceData.documentUrl) {
          document.data.justificacion[justIndex].documentURL = attendanceData.documentUrl;
        }
      } else {
        document.data.justificacion.push({
          id: attendanceData.studentId,
          reason: typeof attendanceData.justification === 'string' ? attendanceData.justification : (attendanceData.justification.reason || ''),
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

/**
 * Fetches attendance records within a date range
 */
export const fetchAttendanceByDateRangeFirebase = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  try {
    const attendanceRef = collection(db, 'ASISTENCIAS');
    
    // Query using the fecha field between the start and end dates
    const q = query(
      attendanceRef,
      where("fecha", ">=", startDate),
      where("fecha", "<=", endDate)
    );
    
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Process according to Firestore structure
      if (data && data.fecha && data.classId && data.data) {
        // Process present students
        if (data.data.presentes && Array.isArray(data.data.presentes)) {
          data.data.presentes.forEach(studentId => {
            records.push({
              id: doc.id,
              studentId,
              classId: data.classId,
              Fecha: data.fecha,
              status: 'Presente',
            });
          });
        }
        
        // Process absent students
        if (data.data.ausentes && Array.isArray(data.data.ausentes)) {
          data.data.ausentes.forEach(studentId => {
            records.push({
              id: doc.id,
              studentId,
              classId: data.classId,
              Fecha: data.fecha,
              status: 'Ausente',
            });
          });
        }
        
        // Process late students and justifications
        if (data.data.tarde && Array.isArray(data.data.tarde)) {
          data.data.tarde.forEach(studentId => {
            // Check if student has a justification
            const hasJustification = data.data.justificacion?.some(j => j.id === studentId);
            
            records.push({
              id: doc.id,
              studentId,
              classId: data.classId,
              Fecha: data.fecha,
              status: hasJustification ? 'Justificado' : 'Tardanza',
              justification: hasJustification ? 
                { 
                  reason: data.data.justificacion.find(j => j.id === studentId)?.reason || '',
                  documentUrl: data.data.justificacion.find(j => j.id === studentId)?.documentURL
                } : 
                undefined
            });
          });
        }
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
    const attendanceRef = collection(db, 'ASISTENCIAS');
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
          const hasJustification = data.data.justificacion?.some(j => j.id === studentId);
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