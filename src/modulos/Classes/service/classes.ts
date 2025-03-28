import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { Class } from '../types/class';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Usuario actual:', user);
  } else {
    console.log('No hay usuario autenticado');
  }
});

const CLASSES_COLLECTION = 'CLASES';
const USERS_COLLECTION = 'USERS';

/**
 * Obtiene el usuario actual de Firestore basado en su email.
 */
const getCurrentUserFromFirestore = async (): Promise<any | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return null;
    const usersCollection = collection(db, USERS_COLLECTION);
    const q = query(usersCollection, where("email", "==", currentUser.email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error fetching current user from Firestore:", error);
    return null;
  }
};

/**
 * Obtiene todas las clases filtradas según el rol del usuario actual.
 */
export const fetchClassesFirestore = async (): Promise<Class[]> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    const classesCollection = collection(db, CLASSES_COLLECTION);
    let classesSnapshot;
    
    // En desarrollo, siempre devolver todas las clases para facilitar pruebas
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log('🔍 Modo desarrollo: obteniendo todas las clases sin restricciones de rol');
      classesSnapshot = await getDocs(classesCollection);
    }
    else if (currentUser) {
      const role = currentUser.role;
      console.log('Rol del usuario actual:', currentUser.uid);
      if (role === 'Maestro' || role === 'teacher') {
        const q = query(classesCollection, where("teacherId", "==", currentUser.uid));
        classesSnapshot = await getDocs(q);
      } else if (role === 'Alumno' || role === 'student') {
        const q = query(classesCollection, where("studentIds", "array-contains", currentUser.uid));
        classesSnapshot = await getDocs(q);
      } else if (role === 'Admin' || role === 'Director') {
        classesSnapshot = await getDocs(classesCollection);
      } else {
        classesSnapshot = await getDocs(classesCollection);
      }
    } else {
      // Si no hay usuario, obtenemos todas las clases (útil para desarrollo/pruebas)
      classesSnapshot = await getDocs(classesCollection);
    }
    
    const classes = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Class[];
    
    console.log(`✅ Se encontraron ${classes.length} clases en Firestore`);
    return classes;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

/**
 * Obtiene una clase por su ID, verificando permisos según el rol del usuario actual.
 */
export const getClassByIdFirestore = async (id: string): Promise<Class | null> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    const classDoc = doc(db, CLASSES_COLLECTION, id);
    const classSnapshot = await getDoc(classDoc);
    if (!classSnapshot.exists()) return null;
    const classData = {
      id: classSnapshot.id,
      ...classSnapshot.data()
    } as Class;
    if (currentUser) {
      const role = currentUser.role;
      if (role === 'teacher' && classData.teacherId !== currentUser.id) return null;
      else if (role === 'student' && !classData.studentIds?.includes(currentUser.id)) return null;
    } else {
      return null;
    }
    return classData;
  } catch (error) {
    console.error(`Error fetching class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Añade una nueva clase en Firestore.
 */
export const addClassFirestore = async (classData: Class): Promise<string> => {
  try {
    const classesCollection = collection(db, CLASSES_COLLECTION);
    const docRef = await addDoc(classesCollection, classData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding class:", error);
    throw error;
  }
};

/**
 * Actualiza una clase existente en Firestore.
 */
export const updateClassFirestore = async (id: string, classData: Partial<Class>): Promise<void> => {
  try {
    const classDoc = doc(db, CLASSES_COLLECTION, id);
    await updateDoc(classDoc, classData);
  } catch (error) {
    console.error(`Error updating class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una clase de Firestore.
 */
export const removeClassFirestore = async (id: string): Promise<void> => {
  try {
    const classDoc = doc(db, CLASSES_COLLECTION, id);
    await deleteDoc(classDoc);
  } catch (error) {
    console.error(`Error deleting class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene clases filtradas por el ID del profesor, con verificación de permisos.
 */
export const getClassesByTeacher = async (teacherId: string): Promise<Class[]> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    if (currentUser) {
      const role = currentUser.role;
      if (role === 'teacher' && currentUser.id !== teacherId) return [];
    } else {
      return [];
    }
    const classesCollection = collection(db, CLASSES_COLLECTION);
    const q = query(classesCollection, where("teacherId", "==", teacherId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Class[];
  } catch (error) {
    console.error(`Error fetching classes for teacher ${teacherId}:`, error);
    throw error;
  }
};

/**
 * Verifica si el usuario actual tiene permisos para modificar una clase.
 */
export const canModifyClass = async (classId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'teacher') {
      const classData = await getClassByIdFirestore(classId);
      return classData?.teacherId === currentUser.id;
    }
    return false;
  } catch (error) {
    console.error("Error checking modify permissions:", error);
    return false;
  }
};
