// /services/serviceClasses.ts

import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface ClassData {
  id: string
  name: string
  description?: string
  level?: string
  instrument?: string
  teacherId?: string
  studentIds?: string[]
  schedule?: string | {days: string[]; startTime: string; endTime: string}
  classroom?: string
  createdAt?: Date
  updatedAt?: Date
  [key: string]: any // Permite propiedades adicionales
}
// src/services/firestore/classes.ts

// Get Firebase auth instance
const auth = getAuth();
const CLASSES_COLLECTION = 'CLASES';
const classesService = {
  async getClasses(): Promise<ClassData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, CLASSES_COLLECTION));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClassData[];
    } catch (error) {
      console.error('Error al obtener clases:', error);
      throw error;
    }
  },

  async getTeacherClasses(): Promise<ClassData[]> {
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const querySnapshot = await getDocs(collection(db, CLASSES_COLLECTION));
      return querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (classData): classData is ClassData =>
            'teacherId' in classData && classData.teacherId === user.uid,
        );
    } catch (error) {
      console.error('Error al obtener clases del profesor:', error);
      throw error;
    }
  },

  async addClass(classData: Omit<ClassData, 'id'>): Promise<ClassData> {
    try {
      // Get current user
      const user = auth.currentUser;

      // Use provided teacherId or default to current user's uid if available
      const finalClassData = {
        ...classData,
        teacherId: classData.teacherId || (user ? user.uid : ''),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, CLASSES_COLLECTION), finalClassData);

      return {
        id: docRef.id,
        name: finalClassData.name, // Ensure 'name' is explicitly part of the returned object's type
        ...finalClassData,
      };
    } catch (error) {
      console.error('Error al añadir clase:', error);
      throw error;
    }
  },

  async updateClass(updatedClass: Partial<ClassData> & {id: string}): Promise<boolean> {
    try {
      const docRef = doc(db, CLASSES_COLLECTION, updatedClass.id);
      const docSnap = await getDoc(docRef);

      const updateData = {
        ...updatedClass,
        updatedAt: new Date(),
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...updateData,
          createdAt: new Date(),
        });
      } else {
        await setDoc(docRef, updateData, { merge: true });
      }

      return true;
    } catch (error) {
      console.error('Error al actualizar clase:', error);
      throw error;
    }
  },

  async deleteClass(classId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
    } catch (error) {
      console.error('Error al eliminar clase:', error);
      throw error;
    }
  },

  async getClassById(classId: string): Promise<ClassData | null> {
    try {
      const docRef = doc(db, CLASSES_COLLECTION, classId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ClassData;
    } catch (error) {
      console.error('Error al obtener clase por ID:', error);
      throw error;
    }
  },
};

export default classesService;
