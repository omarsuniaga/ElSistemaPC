import { db } from '../../firebase'
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import type { Teacher } from '../../modulos/Teachers/types/teachers'

const COLLECTION_NAME = 'TEACHERS'

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

export const fetchTeacherByAuthUidFirebase = async (authUiId: string): Promise<Teacher | null> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const teacherDoc = querySnapshot.docs.find(doc => doc.data().authUid === authUiId)
    if (teacherDoc) {
      return { id: teacherDoc.id, ...teacherDoc.data() } as Teacher
    }
    return null
  }
  catch (error) {
    console.error('Error fetching teacher by auth UID from Firestore:', error)
    throw new Error('Failed to fetch teacher by auth UID')
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