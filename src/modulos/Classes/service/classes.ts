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
    // Obtener datos del usuario desde el store de autenticación
    const { getAuth } = await import('firebase/auth');
    const { useAuthStore } = await import('../../../stores/auth');
    
    const authStore = useAuthStore();
    const currentUser = authStore.user;
    const role = currentUser?.role || '';
    const uid = currentUser?.uid || '';
    
    // Generar clave para caché específica por usuario/rol
    const cacheKey = `classes_${role}_${uid}`;
    
    // Intentar obtener del caché primero
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        // Verificar si el caché es reciente (menos de 5 minutos)
        if (cached.timestamp && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
          console.log('[Caché] Usando clases en caché');
          return cached.data;
        }
      } catch (e) {
        console.warn('Error al leer caché de clases:', e);
      }
    }
    
    // Referencia a la colección de clases
    const classesCollection = collection(db, CLASSES_COLLECTION);
    let classesSnapshot;
    
    // Aplicar filtrado según el rol
    if (['Maestro', 'Teacher', 'teacher'].includes(role) && uid) {
      console.log(`[Filtro] Obteniendo clases para maestro: ${uid}`);
      const q = query(classesCollection, where("teacherId", "==", uid));
      classesSnapshot = await getDocs(q);
    } else if (['Alumno', 'Student', 'student'].includes(role) && uid) {
      console.log(`[Filtro] Obteniendo clases para alumno: ${uid}`);
      const q = query(classesCollection, where("studentIds", "array-contains", uid));
      classesSnapshot = await getDocs(q);
    } else {
      // Si es director, admin o no hay rol definido, obtener todas las clases
      console.log('[Filtro] Obteniendo todas las clases (rol admin/director)');
      classesSnapshot = await getDocs(classesCollection);
    }
    
    // Procesar resultados
    const classes = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Class[];
    
    // Guardar en caché
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: classes
      }));
    } catch (e) {
      console.warn('Error al guardar caché de clases:', e);
    }
    
    console.log(`[Firebase] Obtenidas ${classes.length} clases`);
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

/**
 * Obtiene todas las clases que tienen a un estudiante específico en su lista de estudiantes.
 * @param studentId ID del estudiante a buscar
 * @returns Lista de clases que incluyen al estudiante especificado
 */
export const fetchClassesByStudentIdFirestore = async (studentId: string): Promise<any[]> => {
  try {
    if (!studentId) return [];
    
    const classesCollection = collection(db, CLASSES_COLLECTION);
    // Creamos una consulta para buscar clases donde el array studentIds contenga el ID del estudiante
    const q = query(classesCollection, where("studentIds", "array-contains", studentId));
    const querySnapshot = await getDocs(q);
    // Convertimos los documentos a objetos con sus IDs incluidos
    const classes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return classes;
  } catch (error) {
    console.error("Error fetching classes by student ID:", error);
    return [];
  }
};
