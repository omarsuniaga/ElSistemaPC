import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  where,
  orderBy 
} from 'firebase/firestore'
import { db } from '@/firebase'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  specialty: string[]
  experience: number
  status: 'active' | 'inactive'
  bio?: string
  profileImage?: string
  assignedClasses?: string[]
  availableHours?: string[]
  createdAt: Date
  updatedAt: Date
}

export const useAdminTeachersStore = defineStore('adminTeachers', () => {
  // State
  const teachers = ref<Teacher[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalTeachers = computed(() => teachers.value.length)
  const activeTeachers = computed(() => teachers.value.filter(t => t.status === 'active').length)
  const totalSpecialties = computed(() => {
    const specialties = new Set<string>()
    teachers.value.forEach(teacher => {
      teacher.specialty.forEach(spec => specialties.add(spec))
    })
    return specialties.size
  })
  const totalAssignedClasses = computed(() => {
    return teachers.value.reduce((total, teacher) => {
      return total + (teacher.assignedClasses?.length || 0)
    }, 0)
  })

  // Actions
  const loadTeachers = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const teachersRef = collection(db, 'MAESTROS')
      const q = query(teachersRef, orderBy('name'))
      const snapshot = await getDocs(q)
      
      teachers.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Teacher[]
      
    } catch (err) {
      console.error('Error loading teachers:', err)
      error.value = 'Error loading teachers'
    } finally {
      isLoading.value = false
    }
  }

  const getTeacherById = async (id: string): Promise<Teacher | null> => {
    try {
      const teacherDoc = doc(db, 'MAESTROS', id)
      const snapshot = await getDoc(teacherDoc)
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
        } as Teacher
      }
      
      return null
    } catch (err) {
      console.error('Error getting teacher:', err)
      return null
    }
  }

  const createTeacher = async (teacherData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const teachersRef = collection(db, 'MAESTROS')
      const docRef = await addDoc(teachersRef, {
        ...teacherData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      await loadTeachers() // Reload to get updated list
      return docRef.id
      
    } catch (err) {
      console.error('Error creating teacher:', err)
      error.value = 'Error creating teacher'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const teacherDoc = doc(db, 'MAESTROS', id)
      await updateDoc(teacherDoc, {
        ...updates,
        updatedAt: new Date()
      })
      
      await loadTeachers() // Reload to get updated list
      
    } catch (err) {
      console.error('Error updating teacher:', err)
      error.value = 'Error updating teacher'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteTeacher = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const teacherDoc = doc(db, 'MAESTROS', id)
      await deleteDoc(teacherDoc)
      
      await loadTeachers() // Reload to get updated list
      
    } catch (err) {
      console.error('Error deleting teacher:', err)
      error.value = 'Error deleting teacher'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateTeacherStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      await updateTeacher(id, { status })
    } catch (err) {
      console.error('Error updating teacher status:', err)
      throw err
    }
  }

  const exportTeachers = (teachersToExport: Teacher[]) => {
    try {
      const csvContent = [
        'Name,Email,Phone,Specialty,Experience,Status',
        ...teachersToExport.map(teacher => 
          `"${teacher.name}","${teacher.email}","${teacher.phone || ''}","${teacher.specialty.join(', ')}","${teacher.experience}","${teacher.status}"`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `teachers-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error exporting teachers:', err)
    }
  }

  const $reset = () => {
    teachers.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    teachers,
    isLoading,
    error,
    
    // Getters
    totalTeachers,
    activeTeachers,
    totalSpecialties,
    totalAssignedClasses,
    
    // Actions
    loadTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    updateTeacherStatus,
    exportTeachers,
    $reset
  }
})
