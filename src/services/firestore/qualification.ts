import { db } from '../../firebase';
import { collection, getDocs, addDoc, query, updateDoc, where, doc, deleteDoc } from 'firebase/firestore';
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../../utils/localStorageUtils';
import type { QualificationData } from '../../types/qualification';

const COLLECTION_NAME = 'CALIFICACIONES';

/**
 * Obtener todas las calificaciones desde Firebase
 */
export const fetchQualificationsFromFirebase = async () => {
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QualificationData[];
};
/**
 * Obtener calificaciones por ID de clase
 */
export const fetchQualificationsByClass = async (classId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("classId", "==", classId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QualificationData[];
  } catch (error) {
    console.error("Error fetching qualifications by class:", error);
    throw error;
  }
};

/**
 * Agrega un nuevo registro de calificación a Firebase
 */
export const addQualificationToFirebase = async (qualification: QualificationData) => {
  try {
    // Add timestamp
    const qualificationWithTimestamp = {
      ...qualification,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), qualificationWithTimestamp);
    
    // Update local storage if in development
    if (process.env.NODE_ENV === 'development') {
      const updatedQualifications = await fetchQualificationsFromFirebase();
      saveToLocalStorage('qualifications', updatedQualifications);
    }
    
    return { id: docRef.id, ...qualificationWithTimestamp };
  } catch (error) {
    console.error("Error adding qualification:", error);
    throw error;
  }
};


/**
 * Actualiza un registro de calificación existente.
 */
export const updateQualificationInFirebase = async (qualification: QualificationData) => {
  try {
    if (!qualification.id) {
      throw new Error("Qualification ID is required for update");
    }
    
    // Crear una copia limpia de los datos sin el campo id
    const { id, ...updateData } = qualification;
    
    // Asegurarse de que "group" sea un array de strings
    if (Array.isArray(updateData.group)) {
      updateData.group = updateData.group.map(item =>
        typeof item === 'string' ? item : String(item)
      );
    } else {
      updateData.group = [];
    }
    
    // Asegurarse de que "indicators" sea un array correctamente formateado
    if (Array.isArray(updateData.indicators)) {
      updateData.indicators = updateData.indicators.map(indicator => ({
        uniqueId: indicator.uniqueId ? String(indicator.uniqueId) : '',
        label: indicator.label ? String(indicator.label) : '',
        score: typeof indicator.score === 'number' ? indicator.score : Number(indicator.score) || 0
      }));
    } else {
      updateData.indicators = [];
    }
    
    // Actualizar timestamp
    const updatedQualification = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Referencia al documento a actualizar
    // Forzamos que id sea string usando String(id)
    console.log("ID a actualizar:", id, "convertido a:", String(id));
    const docRef = doc(db, COLLECTION_NAME, String(id));
    console.log("Actualizando documento con:", updatedQualification);
    
    await updateDoc(docRef, updatedQualification);
    
    // Actualizar el almacenamiento local en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const updatedQualifications = await fetchQualificationsFromFirebase();
      saveToLocalStorage('qualifications', updatedQualifications);
    }
    
    return { id, ...updatedQualification };
  } catch (error) {
    console.error("Error updating qualification:", error);
    throw error;
  }
};

/**
 * Elimina un registro de calificación
 */
export const deleteQualificationFromFirebase = async (qualificationId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, qualificationId));
    
    // Update local storage if in development
    if (process.env.NODE_ENV === 'development') {
      const updatedQualifications = await fetchQualificationsFromFirebase();
      saveToLocalStorage('qualifications', updatedQualifications);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting qualification:", error);
    throw error;
  }
};

/**
 * Obtiene todas las calificaciones, utilizando el caché localStorage en desarrollo
 */
export const getQualifications = async () => {
  if (process.env.NODE_ENV === 'development') {
    const cachedQualifications = getFromLocalStorage('qualifications');
    if (cachedQualifications) {
      return cachedQualifications as QualificationData[];
    }
  }
  
  const qualifications = await fetchQualificationsFromFirebase();
  
  if (process.env.NODE_ENV === 'development') {
    saveToLocalStorage('qualifications', qualifications);
  }
  
  return qualifications;
};

/**
 * Borra los datos de calificación del almacenamiento local
 */
export const clearQualificationCache = () => {
  clearLocalStorage('qualifications');
};