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
  orderBy
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { EmergencyClass, EmergencyClassStatus } from '../types/attendance';

const EMERGENCY_CLASSES_COLLECTION = 'EMERGENCY_CLASSES';

/**
 * Registra una nueva clase emergente en Firestore
 */
export const registerEmergencyClassFirebase = async (emergencyClass: Omit<EmergencyClass, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  try {
    // Crear un ID único para el documento
    const docId = `${emergencyClass.date}_${emergencyClass.classId}_${emergencyClass.teacherId}`;
    const docRef = doc(db, EMERGENCY_CLASSES_COLLECTION, docId);

    // Crear datos completos para guardar
    const completeData: EmergencyClass = {
      ...emergencyClass,
      id: docId,
      createdAt: new Date().toISOString(),
      status: 'Pendiente'
    };

    // Guardar en Firestore
    await setDoc(docRef, completeData);
    
    console.log('Clase emergente registrada con éxito:', docId);
    return docId;
  } catch (error) {
    console.error('Error al registrar clase emergente:', error);
    throw error;
  }
};

/**
 * Obtiene todas las clases emergentes, con filtros opcionales por estado
 */
export const getEmergencyClassesFirebase = async (status?: EmergencyClassStatus): Promise<EmergencyClass[]> => {
  try {
    let q;
    
    // Intenta primero con la consulta óptima (con índice compuesto)
    try {
      q = collection(db, EMERGENCY_CLASSES_COLLECTION);
      
      // Aplicar filtros si se especificó un estado
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      // Ordenar por fecha de creación (más reciente primero)
      q = query(q, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const emergencyClasses: EmergencyClass[] = [];
      
      snapshot.forEach(doc => {
        emergencyClasses.push(doc.data() as EmergencyClass);
      });
      
      return emergencyClasses;
    } catch (indexError) {
      // Si hay un error de índice, intentar con una consulta más simple
      console.warn('Error de índice en Firestore, usando consulta alternativa:', indexError);
      
      // Consulta sin ordenamiento (no requiere índice compuesto)
      q = collection(db, EMERGENCY_CLASSES_COLLECTION);
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const snapshot = await getDocs(q);
      const emergencyClasses: EmergencyClass[] = [];
      
      snapshot.forEach(doc => {
        emergencyClasses.push(doc.data() as EmergencyClass);
      });
      
      // Ordenar en memoria en lugar de en la base de datos
      return emergencyClasses.sort((a, b) => {
        // Ordenar por fecha de creación (más reciente primero)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  } catch (error) {
    console.error('Error al obtener clases emergentes:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una clase emergente
 */
export const updateEmergencyClassStatusFirebase = async (
  emergencyClassId: string, 
  status: EmergencyClassStatus,
  responderId?: string,
  responderName?: string
): Promise<EmergencyClass> => {
  try {
    // Referencia al documento
    const docRef = doc(db, EMERGENCY_CLASSES_COLLECTION, emergencyClassId);
    
    // Obtener el documento actual
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`No se encontró la clase emergente con ID: ${emergencyClassId}`);
    }
    
    // Datos del respondedor
    const responder = responderId ? {
      id: responderId,
      name: responderName || 'Usuario desconocido',
      timestamp: new Date().toISOString()
    } : undefined;
    
    // Actualizar el documento
    await updateDoc(docRef, {
      status,
      responder,
      updatedAt: serverTimestamp()
    });
    
    // Obtener el documento actualizado
    const updatedDocSnap = await getDoc(docRef);
    return updatedDocSnap.data() as EmergencyClass;
  } catch (error) {
    console.error('Error al actualizar estado de clase emergente:', error);
    throw error;
  }
};

/**
 * Obtiene clases emergentes para un profesor específico
 */
export const getEmergencyClassesByTeacherFirebase = async (teacherId: string): Promise<EmergencyClass[]> => {
  try {
    // Intenta primero con la consulta óptima (con índice compuesto)
    try {
      const q = query(
        collection(db, EMERGENCY_CLASSES_COLLECTION), 
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const emergencyClasses: EmergencyClass[] = [];
      
      snapshot.forEach(doc => {
        emergencyClasses.push(doc.data() as EmergencyClass);
      });
      
      return emergencyClasses;
    } catch (indexError) {
      // Si hay un error de índice, intentar con una consulta más simple
      console.warn('Error de índice en Firestore, usando consulta alternativa para clases del profesor:', indexError);
      
      // Consulta sin ordenamiento (no requiere índice compuesto)
      const q = query(
        collection(db, EMERGENCY_CLASSES_COLLECTION), 
        where('teacherId', '==', teacherId)
      );
      
      const snapshot = await getDocs(q);
      const emergencyClasses: EmergencyClass[] = [];
      
      snapshot.forEach(doc => {
        emergencyClasses.push(doc.data() as EmergencyClass);
      });
      
      // Ordenar en memoria en lugar de en la base de datos
      return emergencyClasses.sort((a, b) => {
        // Ordenar por fecha de creación (más reciente primero)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  } catch (error) {
    console.error('Error al obtener clases emergentes del profesor:', error);
    throw error;
  }
};
