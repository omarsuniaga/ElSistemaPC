import { db } from '../../../firebase'
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import type { Teacher } from '../../Teachers/types/teachers'

const COLLECTION_NAME = 'MAESTROS'
const COLLECTION_NAME_USERS = 'USERS'

/**
 * Fetches all teachers from Firestore.
 */
export const fetchTeachersFromFirebase = async (): Promise<Teacher[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Teacher[]
  } catch (error) {
    console.error('Error fetching teachers from Firestore:', error)
    throw new Error('Failed to fetch teachers')
  }
}

/**
 * Adds a new teacher to Firestore.
 */
export const addTeacherToFirebase = async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...teacher,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { id: docRef.id, ...teacher } as Teacher
  } catch (error) {
    console.error('Error adding teacher to Firestore:', error)
    throw new Error('Failed to add teacher')
  }
}

/**
 * Updates an existing teacher in Firestore.
 */
export const updateTeacherInFirebase = async (id: string, updates: Partial<Teacher>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error(`Error updating teacher with ID ${id} in Firestore:`, error)
    throw new Error('Failed to update teacher')
  }
}

/**
 * Deletes a teacher from Firestore.
 */
export const deleteTeacherFromFirebase = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting teacher with ID ${id} from Firestore:`, error)
    throw new Error('Failed to delete teacher')
  }
}