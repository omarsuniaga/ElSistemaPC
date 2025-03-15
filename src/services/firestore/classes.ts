// /services/serviceClasses.ts

import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    orderBy 
  } from 'firebase/firestore';
  import { db } from '../../firebase';
  import type { Class } from '../../types/index';
  
  
  /**
   * Obtiene todas las clases desde Firestore.
   * @returns {Promise<Class[]>} Lista de clases.
   */
  export const fetchClasses = async (): Promise<Class[]> => {
    try {
      const classesCollection = collection(db, 'CLASES');
      const q = query(classesCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Class, 'id'>;
        return {
          id: Number(doc.id),
          ...data
        };
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  };
  
  /**
   * Obtiene una clase específica por su ID.
   * NOTA: Este método retorna datos demo en lugar de consultar Firestore.
   * @param classId ID de la clase a obtener.
   * @returns {Promise<Class | null>} La clase si se encuentra o null.
   */
  export const fetchClass = async (): Promise<Class[]> => {
      try {
          const classesCollection = collection(db, 'CLASES');
          const q = query(classesCollection, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          return querySnapshot.docs.map(doc => {
            const data = doc.data() as Omit<Class, 'id'>;
            return {
              id: Number(doc.id),
              ...data
            };
          });
        } catch (error) {
          console.error('Error fetching classes:', error);
          throw error;
        }
  };
  
  /**
   * Agrega una nueva clase a Firestore.
   * @param classData Datos de la clase (sin ID).
   * @returns {Promise<string>} El ID de la nueva clase.
   */
  export const addClass = async (classData: Omit<Class, 'id'>): Promise<string> => {
    try {
      const classesCollection = collection(db, 'CLASES');
      const docRef = await addDoc(classesCollection, classData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  };
  
  /**
   * Actualiza una clase existente en Firestore.
   * @param classId ID de la clase a actualizar.
   * @param classData Datos parciales de la clase a actualizar.
   * @returns {Promise<void>}
   */
  export const updateClass = async (classId: string, classData: Partial<Class>): Promise<void> => {
    try {
      const docRef = doc(db, 'CLASES', classId);
      await updateDoc(docRef, classData);
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  };
  
  /**
   * Elimina una clase de Firestore.
   * @param classId ID de la clase a eliminar.
   * @returns {Promise<void>}
   */
  export const deleteClass = async (classId: string): Promise<void> => {
    try {
      const docRef = doc(db, 'CLASES', classId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  };
  
  /**
   * Busca clases por instructor en Firestore.
   * @param instructorId ID del instructor.
   * @returns {Promise<Class[]>} Lista de clases que pertenecen al instructor.
   */
  export const findClassesByInstructor = async (instructorId: string): Promise<Class[]> => {
    try {
      const classesCollection = collection(db, 'CLASES');
      const q = query(classesCollection, where("instructor", "==", instructorId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Class, 'id'>;
        return {
          id: Number(doc.id),
          ...data
        };
      });
    } catch (error) {
      console.error('Error finding classes by instructor:', error);
      throw error;
    }
  };
