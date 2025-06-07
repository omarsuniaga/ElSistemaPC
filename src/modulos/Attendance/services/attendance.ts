import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase/config';
import type { AttendanceRecord, ClassObservation, JustificationData } from '../types/attendance';

/**
 * Get attendance records by date and class ID
 * @param date The date in 'YYYY-MM-DD' or 'YYYYMMDD' format
 * @param classId The class ID
 * @returns Promise resolving to array of attendance records
 */
export async function getAttendanceByDateAndClassFirebase(
  date: string,
  classId: string
): Promise<AttendanceRecord[]> {
  try {
    if (!date || !classId) {
      throw new Error('Date and classId are required');
    }

    // Normalizar formato de fecha a yyyy-MM-dd
    let formattedDate = date;
    const dateRegexCompact = /^\d{8}$/;
    if (dateRegexCompact.test(date)) {
      // Convertir de YYYYMMDD a YYYY-MM-DD
      formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD or YYYYMMDD.');
    }

    // Get Firestore references
    const db = getFirestore();
    const attendancesCollection = collection(db, 'attendances');
    
    // Query for attendance records matching date and class
    const q = query(
      attendancesCollection,
      where('fecha', '==', formattedDate),
      where('classId', '==', classId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No attendance records found for date ${formattedDate} and class ${classId}`);
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        classId: data.classId,
        fecha: data.fecha,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date()
      } as AttendanceRecord;
    });
  } catch (error) {
    console.error('Error in getAttendanceByDateAndClassFirebase:', error);
    throw error;
  }
}

/**
 * Agrega una observación de clase con formato enriquecido
 */
export const addClassObservationFirebase = async (observation: Omit<ClassObservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClassObservation> => {
  try {
    const observationRef = collection(db, 'OBSERVACIONES');
    const newObservation = {
      ...observation,
      // Aseguramos formato de fecha como string ISO para compatibilidad con otras partes del sistema
      date: observation.date,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      author: observation.authorId || observation.authorName || ''
    };

    const docRef = await addDoc(observationRef, newObservation);
    const createdObservation = {
      ...newObservation,
      id: docRef.id,
      createdAt: newObservation.createdAt.toDate(),
      updatedAt: newObservation.updatedAt.toDate()
    } as ClassObservation;

    // Notificar a los profesores si la observación es de alta prioridad o requiere seguimiento
    if (observation.priority === 'alta' || observation.requiresFollowUp) {
      await notifyTeachersAboutObservation(createdObservation);
    }

    return createdObservation;
  } catch (error) {
    console.error('Error adding class observation:', error);
    throw error;
  }
};

/**
 * Agrega una justificación con validación de tiempo
 */
export const addJustificationFirebase = async (justification: Omit<JustificationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<JustificationData> => {
  try {
    // Validar el límite de tiempo (48 horas desde la fecha de la clase)
    const classDate = new Date(justification.fecha);
    const timeLimit = new Date(classDate.getTime() + 48 * 60 * 60 * 1000);
    
    if (new Date() > timeLimit) {
      throw new Error('No se pueden agregar justificaciones después de 48 horas de la clase');
    }

    const justificationRef = collection(db, 'justifications');
    const newJustification = {
      ...justification,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      timeLimit: timeLimit.toISOString()
    };

    const docRef = await addDoc(justificationRef, newJustification);
    return {
      ...newJustification,
      id: docRef.id,
      createdAt: newJustification.createdAt.toDate(),
      updatedAt: newJustification.updatedAt.toDate(),
      timeLimit: new Date(newJustification.timeLimit)
    } as JustificationData;
  } catch (error) {
    console.error('Error adding justification:', error);
    throw error;
  }
};

/**
 * Obtiene observaciones de una clase con filtros
 */
export const getClassObservationsFirebase = async (classId: string, date?: string): Promise<ClassObservation[]> => {
  try {
    const observationsRef = collection(db, 'OBSERVACIONES');
    let q = query(observationsRef, where('classId', '==', classId));
    
    if (date) {
      q = query(q, where('date', '==', date));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Crear un objeto compatible con ClassObservation a partir de los datos
      const observation: ClassObservation = {
        id: doc.id,
        classId: data.classId || '',
        
        // Mapear campos de texto y contenido
        text: data.text || '',
        content: { text: data.text || '' },
        
        // Mapear campos de autor
        authorId: data.author || '',
        authorName: data.authorName || '',
        
        // Manejar campos de fecha
        date: data.date || '',
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        
        // Campos de historial
        lastModified: data.lastModified ? new Date(data.lastModified) : undefined,
        modifiedBy: data.modifiedBy || '',
        modifiedByName: data.modifiedByName || ''
      };
      
      return observation;
    });
  } catch (error) {
    console.error('Error getting class observations:', error);
    throw error;
  }
};

/**
 * Notifica a los profesores sobre observaciones importantes
 */
const notifyTeachersAboutObservation = async (observation: ClassObservation): Promise<void> => {
  try {
    // Aquí iría la lógica para notificar a los profesores
    // Por ejemplo, enviar un correo electrónico o una notificación push
    console.log('Notificando a los profesores sobre la observación:', observation);
  } catch (error) {
    console.error('Error notifying teachers:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
};

export const uploadJustificationDocument = async (file: File, studentId: string, classId: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `justifications/${studentId}/${classId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading justification document:', error);
    throw error;
  }
};

/**
 * Actualiza una observación existente con historial de modificaciones
 */
export const updateClassObservationFirebase = async (observation: ClassObservation): Promise<ClassObservation> => {
  try {
    if (!observation.id) {
      throw new Error('Se requiere el ID de la observación para actualizarla');
    }

    const observationRef = doc(db, 'OBSERVACIONES', observation.id);
    
    // Preparamos los datos con la estructura requerida para OBSERVACIONES
    const updateData = {
      // Campos principales según la estructura requerida
      author: observation.authorId || observation.modifiedBy || observation.author || '',
      classId: observation.classId || observation.categoryId || '',
      date: observation.fecha || '',
      text: typeof observation.content === 'object' ? observation.content.text || observation.text : observation.text || '',
      
      // Campos de historial y fechas
      createdAt: observation.createdAt instanceof Date ? observation.createdAt.toISOString() : observation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      
      // Campos adicionales que pueden ser útiles
      modifiedBy: observation.modifiedBy || observation.authorId || '',
      modifiedByName: observation.modifiedByName || ''
    };
    
    await updateDoc(observationRef, updateData);
    
    // Devolver la observación actualizada con fechas como Date
    return {
      ...observation,
      updatedAt: new Date(),
      lastModified: observation.lastModified instanceof Date ? 
        observation.lastModified : 
        new Date(observation.lastModified || Date.now())
    } as ClassObservation;
  } catch (error) {
    console.error('Error updating class observation:', error);
    throw error;
  }
};