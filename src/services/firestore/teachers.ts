import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc, 
  deleteDoc, 
  Timestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { Teacher } from '../../types'

const COLLECTION_NAME = 'MAESTROS'

export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    console.log(' Consultando maestros en Firestore...')
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    console.log(` Maestros recuperados: ${querySnapshot.size}`)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Teacher))
  } catch (error) {
    console.error(' Error al obtener maestros:', error)
    throw new Error('Error al obtener la lista de maestros')
  }
}

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Teacher
    }
    
    return null
  } catch (error) {
    console.error(` Error al obtener maestro ${id}:`, error)
    throw new Error('Error al obtener los datos del maestro')
  }
}

export const createTeacher = async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
  try {
    const collectionRef = collection(db, COLLECTION_NAME)
    
    const teacherData = {
      ...teacher,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active'
    }

    const docRef = await addDoc(collectionRef, teacherData)
    
    return {
      id: docRef.id,
      ...teacher,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Teacher
  } catch (error) {
    console.error(' Error al crear maestro:', error)
    throw new Error('Error al crear el maestro')
  }
}

export const updateTeacher = async (id: string, teacher: Partial<Teacher>): Promise<Teacher | void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    const collectionRef = collection(db, COLLECTION_NAME)

    if (!docSnap.exists()) {
      // Si el documento no existe, lo creamos con el ID especificado
      const teacherData = {
        ...teacher,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active'
      }
      const newDoc = await addDoc(collectionRef, teacherData)
      return {
        id: newDoc.id,
        ...teacher,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Teacher
    }

    // Si el documento existe, lo actualizamos
    await updateDoc(docRef, {
      ...teacher,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error(` Error al actualizar maestro ${id}:`, error)
    throw new Error('Error al actualizar los datos del maestro')
  }
}

export const deleteTeacher = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(` Error al eliminar maestro ${id}:`, error)
    throw new Error('Error al eliminar el maestro')
  }
}