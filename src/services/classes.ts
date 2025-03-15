// src/services/classes.ts
import { 
  fetchClasses as fetchClassesFirestore, 
  addClass as addClassFirestore, 
  updateClass as updateClassFirestore, 
  deleteClass as deleteClassFirestore 
} from './firestore/classes';
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../utils/localStorageUtils';
import { Class } from '../types/classes';

const handleError = (error: any, customMessage: string) => {
  console.error(customMessage, error);
  throw new Error(customMessage);
};

/**
 * Obtiene todas las clases desde Firebase o caché local.
 * @returns {Promise<Class[]>} Lista de clases.
 */
export const fetchClasses = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      const cachedClasses = getFromLocalStorage('classes');
      if (cachedClasses) {
        return cachedClasses;
      }
    }
    const classes = await fetchClassesFirestore();
    if (process.env.NODE_ENV === 'development') {
      saveToLocalStorage('classes', classes);
    }
    return classes;
  } catch (error) {
    console.error('Error fetching classes from Firebase:', error);
    throw error;
  }
};

/**
 * Añade una nueva clase a Firebase.
 * @param {Class} newClass - Datos de la clase a añadir.
 * @returns {Promise<string>} ID de la clase creada.
 */
export const addClass = async (newClass: Class) => {
  try {
    await addClassFirestore(newClass);
    if (process.env.NODE_ENV === 'development') {
      clearLocalStorage('classes');
    }
    return newClass.id;
  } catch (error) {
    handleError(error, 'Error al agregar la clase');
    return null;
  }
};

/**
 * Actualiza una clase existente en Firebase.
 * @param {Class} updatedClass - Datos actualizados de la clase.
 */
export const updateClass = async (updatedClass: Class) => {
  try {
    await updateClassFirestore(updatedClass.id, updatedClass);
    if (process.env.NODE_ENV === 'development') {
      clearLocalStorage('classes');
    }
  } catch (error) {
    handleError(error, 'Error al actualizar la clase');
  }
};

/**
 * Elimina una clase de Firebase.
 * @param {string} classId - ID de la clase a eliminar.
 */
export const deleteClass = async (classId: string) => {
  try {
    await deleteClassFirestore(classId);
    if (process.env.NODE_ENV === 'development') {
      clearLocalStorage('classes');
    }
  } catch (error) {
    handleError(error, 'Error al eliminar la clase');
  }
};

// Mantenemos estos alias para compatibilidad con código existente
export const fetchClassesFromFirebase = fetchClasses;
export const addClassToFirebase = addClass;
export const updateClassInFirebase = updateClass;
export const deleteClassFromFirebase = deleteClass;
