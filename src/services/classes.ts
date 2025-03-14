// src/services/classes.ts
import { fetchClassesFromFirebase, addClassToFirebase, updateClassInFirebase, deleteClassFromFirebase } from './firestore';
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../utils/localStorageUtils';
import { Class } from '../types/classes';


const handleError = (error: any, customMessage: string) => {
  console.error(customMessage, error);
  throw new Error(customMessage);
};

export const getClasses = async () => {
  if (process.env.NODE_ENV === 'development') {
    const cachedClasses = getFromLocalStorage('classes');
    if (cachedClasses) {
      return cachedClasses;
    }
  }
  const classes = await fetchClassesFromFirebase();
  if (process.env.NODE_ENV === 'development') {
    saveToLocalStorage('classes', classes);
  }
  return classes;
};

export const addClass = async (newClass: Class) => {
  try {
    await addClassToFirebase(newClass);
    if (process.env.NODE_ENV === 'development') {
      clearLocalStorage('classes');
    }
  } catch (error) {
    handleError(error, 'Error al agregar la clase');
  }
};

export const updateClass = async (updatedClass: Class) => {
  try {
    await updateClassInFirebase(updatedClass.id, updatedClass);
    if (process.env.NODE_ENV === 'development') {
      clearLocalStorage('classes');
    }
  } catch (error) {
    handleError(error, 'Error al actualizar la clase');
  }
};

export const deleteClass = async (classId: string) => {
  try {
    await deleteClassFromFirebase(classId);
    if (process.env.NODE_ENV === 'development') {
      clearLocalStorage('classes');
    }
  } catch (error) {
    handleError(error, 'Error al eliminar la clase');
  }
};
