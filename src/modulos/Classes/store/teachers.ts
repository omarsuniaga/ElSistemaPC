import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../../../firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export interface Teacher {
  id: string
  name: string
  email: string
  specialty: string
  schedule: string[]
  createdAt: Date
}

export const useTeachersStore = defineStore('teachers', () => {
  const teachers = ref<Teacher[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTeachers = async () => {
    try {
      loading.value = true
      const docRef = doc(db, 'configuration', 'teachers')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        teachers.value = docSnap.data().list
      }
    } catch (err) {
      error.value = 'Failed to load teachers: ' + (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const updateTeacher = async (teacher: Teacher) => {
    try {
      const docRef = doc(db, 'teachers', teacher.id)
      await updateDoc(docRef, {
        ...teacher,
        updatedAt: new Date()
      })
      await fetchTeachers() // Refresh the list
    } catch (err) {
      error.value = 'Failed to update teacher: ' + (err as Error).message
    }
  }

  const createTeacher = async (newTeacher: Omit<Teacher, 'id' | 'createdAt'>) => {
    try {
      const docRef = doc(db, 'teachers')
      await setDoc(docRef, {
        ...newTeacher,
        id: docRef.id,
        createdAt: new Date()
      })
      await fetchTeachers() // Refresh the list
    } catch (err) {
      error.value = 'Failed to create teacher: ' + (err as Error).message
    }
  }

  return {
    teachers,
    loading,
    error,
    fetchTeachers,
    updateTeacher,
    createTeacher
  }
})