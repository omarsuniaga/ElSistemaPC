import {db} from "../../../firebase"
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import type {Teacher} from "../../Teachers/types/teachers"

// Nombre de la colección en Firestore
const COLLECTION_NAME = "MAESTROS"

// Clave para almacenar en localStorage (modo desarrollo)
const LOCAL_STORAGE_KEY = "cached_teachers"
// Determina si estamos en modo desarrollo
const isDevelopment = process.env.NODE_ENV === "development"

/* ========= FUNCIONES CRUD BÁSICAS ========= */

/**
 * Obtiene todos los maestros desde Firestore.
 * En modo desarrollo, utiliza localStorage para cachear la respuesta y reducir llamadas.
 */
export const fetchTeachersFromFirebase = async (): Promise<Teacher[]> => {
  try {
    // Si estamos en desarrollo, buscar datos cacheados
    if (isDevelopment) {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        return JSON.parse(cached) as Teacher[]
      }
    }
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const teachers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Teacher[]

    // Cachear en localStorage en modo desarrollo
    if (isDevelopment) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teachers))
    }
    return teachers
  } catch (error) {
    console.error("Error fetching teachers from Firestore:", error)
    throw new Error("Failed to fetch teachers")
  }
}

/**
 * Agrega un nuevo maestro a Firestore.
 * Invalida el caché en desarrollo para asegurar datos actualizados.
 */
export const addTeacherToFirebase = async (teacher: Omit<Teacher, "id">): Promise<Teacher> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...teacher,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    // Invalida caché en desarrollo
    if (isDevelopment) localStorage.removeItem(LOCAL_STORAGE_KEY)
    return {id: docRef.id, ...teacher} as Teacher
  } catch (error) {
    console.error("Error adding teacher to Firestore:", error)
    throw new Error("Failed to add teacher")
  }
}

/**
 * Actualiza un maestro existente en Firestore.
 * Invalida el caché en desarrollo.
 */
export const updateTeacherInFirebase = async (
  id: string,
  updates: Partial<Teacher>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    // Invalida caché en desarrollo
    if (isDevelopment) localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch (error) {
    console.error(`Error updating teacher with ID ${id} in Firestore:`, error)
    throw new Error("Failed to update teacher")
  }
}

/**
 * Elimina un maestro de Firestore.
 * Invalida el caché en desarrollo.
 */
export const deleteTeacherFromFirebase = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    // Invalida caché en desarrollo
    if (isDevelopment) localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch (error) {
    console.error(`Error deleting teacher with ID ${id} from Firestore:`, error)
    throw new Error("Failed to delete teacher")
  }
}

/* ========= FUNCIONES AUXILIARES ========= */

/**
 * Obtiene un maestro específico por su ID desde Firestore.
 */
export const fetchTeacherByIdFromFirebase = async (id: string): Promise<Teacher | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const teacherDoc = await getDoc(docRef)
    if (!teacherDoc.exists()) {
      return null
    }
    return {id: teacherDoc.id, ...teacherDoc.data()} as Teacher
  } catch (error) {
    console.error(`Error fetching teacher with ID ${id} from Firestore:`, error)
    throw new Error("Failed to fetch teacher by ID")
  }
}
