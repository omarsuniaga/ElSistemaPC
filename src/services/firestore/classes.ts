// /services/serviceClasses.ts

import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy,
    setDoc
  } from 'firebase/firestore';
  import { db } from '../../firebase';
  import type { Class } from '../../types/index';
  
  const COLLECTION_NAME = 'CLASES';
  
  /**
   * Obtiene todas las clases desde Firestore.
   * @returns {Promise<Class[]>} Lista de clases.
   */
  export const fetchClassesFirebase = async (): Promise<Class[]> => {
    try {
      const classesCollection = collection(db, COLLECTION_NAME);
      const q = query(classesCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Class, 'id'>;
        return {
          id: String(doc.id), 
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
  export const addClassFirebase = async (classData: Omit<Class, 'id'>): Promise<string> => {
    try {
      // Asegurarnos de que tenemos todos los campos requeridos
      const completeClassData = {
        ...classData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        studentIds: classData.studentIds || [],
        contentIds: classData.contentIds || []
        
      };

      const classesCollection = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(classesCollection, completeClassData);
      
      // Actualizar el documento con su ID
      await updateDoc(docRef, {
        id: docRef.id
      });

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
  export const updateClassFirebase = async (classId: string, classData: Partial<Class>): Promise<void> => {
    try {
      console.log('🔄 Verificando existencia de clase:', classId);
      const docRef = doc(db, COLLECTION_NAME, String(classId));
      
      // Preparar datos para actualizar o crear
      const { id, ...dataWithoutId } = classData;
      
      const updateData = {
        ...dataWithoutId,
        id: classId, // Asegurar que el ID esté presente
        updatedAt: new Date().toISOString()
      };
      
      console.log('📑 Datos para actualizar:', updateData);
      
      // Usar setDoc (no updateDoc) con merge:true para crear si no existe
      await setDoc(docRef, updateData, { merge: true });
      
      console.log('✅ Documento actualizado o creado exitosamente');
      return;
    } catch (error) {
      // Mejorar el mensaje de error para depuración
      console.error('❌ Error en updateClassFirebase:', error);
      console.error('Detalles de la operación fallida:', { classId, collectionName: COLLECTION_NAME });
      throw error;
    }
  };

  /**
   * Elimina una clase de Firestore.
   * @param classId ID de la clase a eliminar.
   * @returns {Promise<void>}
   */
  export const deleteClassFirebase = async (classId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, String(classId));
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  };