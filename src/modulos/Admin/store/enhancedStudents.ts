import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy
} from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { advancedStudentsService } from '../services/advancedStudentsService'
import type { 
  ImportResult, 
  StudentMetrics, 
  DropoutRisk, 
  ProgressReport 
} from '../services/advancedStudentsService'
import type { Student } from '../../Students/types/student'

interface StudentFilters {
  search: string
  status: 'all' | 'active' | 'inactive' | 'risk'
  instrument: string
  grade: string
  class: string
}

export const useEnhancedStudentsStore = defineStore('enhancedStudents', () => {
  // State
  const students = ref<Student[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<StudentFilters>({
    search: '',
    status: 'all',
    instrument: '',
    grade: '',
    class: ''
  })

  // Advanced metrics
  const metrics = ref<StudentMetrics>({
    totalStudents: 0,
    activeStudents: 0,
    newThisMonth: 0,
    retentionRate: 0,
    averageAttendance: 0,
    riskStudents: 0,
    topPerformers: 0,
    revenueImpact: 0
  })

  const dropoutRisks = ref<DropoutRisk[]>([])
  const progressReports = ref<Map<string, ProgressReport>>(new Map())

  // Computed
  const totalStudents = computed(() => students.value.length)
  
  const activeStudents = computed(() => 
    students.value.filter(s => s.activo).length
  )
  
  const filteredStudents = computed(() => {
    let filtered = students.value

    // Search filter
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(student => 
        student.nombre.toLowerCase().includes(search) ||
        student.apellido.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        (student.instrumento && student.instrumento.toLowerCase().includes(search))
      )
    }

    // Status filter
    if (filters.value.status !== 'all') {
      if (filters.value.status === 'active') {
        filtered = filtered.filter(s => s.activo)
      } else if (filters.value.status === 'inactive') {
        filtered = filtered.filter(s => !s.activo)
      } else if (filters.value.status === 'risk') {
        const riskIds = dropoutRisks.value
          .filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical')
          .map(r => r.studentId)
        filtered = filtered.filter(s => riskIds.includes(s.id))
      }
    }

    // Instrument filter
    if (filters.value.instrument) {
      filtered = filtered.filter(s => s.instrumento === filters.value.instrument)
    }

    return filtered
  })

  const highRiskStudents = computed(() => 
    dropoutRisks.value.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical')
  )

  const recentStudents = computed(() => 
    students.value      .slice()
      .sort((a, b) => {
        // Handle Firestore Timestamp or Date objects
        const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0)
        const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0)
        return bDate.getTime() - aDate.getTime()
      })
      .slice(0, 10)
  )

  const availableInstruments = computed(() => {
    const instruments = students.value
      .map(s => s.instrumento)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
    return instruments.sort()
  })

  // Actions
  const loadStudents = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const studentsCollection = collection(db, 'students')
      const q = query(studentsCollection, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      students.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[]

      // Load advanced metrics
      await loadMetrics()
      await loadDropoutRisks()
      
    } catch (err) {
      console.error('Error loading students:', err)
      error.value = 'Error al cargar estudiantes'
    } finally {
      isLoading.value = false
    }
  }

  const loadMetrics = async () => {
    try {
      metrics.value = await advancedStudentsService.getStudentMetrics()
    } catch (err) {
      console.error('Error loading metrics:', err)
    }
  }

  const loadDropoutRisks = async () => {
    try {
      dropoutRisks.value = await advancedStudentsService.getDropoutRiskAnalysis()
    } catch (err) {
      console.error('Error loading dropout risks:', err)
    }
  }

  const createStudent = async (studentData: Partial<Student>) => {
    isLoading.value = true
    error.value = null
    
    try {
      const studentsCollection = collection(db, 'students')
      const newStudent = {
        ...studentData,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(studentsCollection, newStudent)
      
      const student: Student = {
        id: docRef.id,
        ...newStudent
      } as Student
      
      students.value.unshift(student)
      await loadMetrics() // Update metrics
      
      return student
    } catch (err) {
      console.error('Error creating student:', err)
      error.value = 'Error al crear estudiante'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    isLoading.value = true
    error.value = null
    
    try {
      const studentRef = doc(db, 'students', studentId)
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }
      
      await updateDoc(studentRef, updateData)
      
      const index = students.value.findIndex(s => s.id === studentId)
      if (index !== -1) {
        students.value[index] = { ...students.value[index], ...updateData }
      }
      
      await loadMetrics() // Update metrics
      
    } catch (err) {
      console.error('Error updating student:', err)
      error.value = 'Error al actualizar estudiante'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteStudent = async (studentId: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const studentRef = doc(db, 'students', studentId)
      await deleteDoc(studentRef)
      
      students.value = students.value.filter(s => s.id !== studentId)
      await loadMetrics() // Update metrics
      
    } catch (err) {
      console.error('Error deleting student:', err)
      error.value = 'Error al eliminar estudiante'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Advanced Features
  const importStudents = async (file: File): Promise<ImportResult> => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await advancedStudentsService.importStudentsFromFile(file)
      
      // Refresh students after import
      await loadStudents()
      
      return result
    } catch (err) {
      console.error('Error importing students:', err)
      error.value = 'Error al importar estudiantes'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const exportStudents = async (exportFilters?: {
    active?: boolean
    instrument?: string
    class?: string
  }): Promise<Blob> => {
    try {
      return await advancedStudentsService.exportStudentsToExcel(exportFilters)
    } catch (err) {
      console.error('Error exporting students:', err)
      error.value = 'Error al exportar estudiantes'
      throw err
    }
  }

  const sendBulkEmail = async (studentIds: string[], message: { subject: string; body: string }) => {
    isLoading.value = true
    error.value = null
    
    try {
      await advancedStudentsService.sendBulkEmail(studentIds, message)
    } catch (err) {
      console.error('Error sending bulk email:', err)
      error.value = 'Error al enviar emails'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const sendBulkWhatsApp = async (studentIds: string[], message: { message: string }) => {
    isLoading.value = true
    error.value = null
    
    try {
      await advancedStudentsService.sendBulkWhatsApp(studentIds, message)
    } catch (err) {
      console.error('Error sending bulk WhatsApp:', err)
      error.value = 'Error al enviar WhatsApp'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateProgressReport = async (studentId: string): Promise<ProgressReport> => {
    try {
      const report = await advancedStudentsService.generateProgressReport(studentId)
      progressReports.value.set(studentId, report)
      return report
    } catch (err) {
      console.error('Error generating progress report:', err)
      error.value = 'Error al generar reporte de progreso'
      throw err
    }
  }

  const getProgressReport = (studentId: string): ProgressReport | undefined => {
    return progressReports.value.get(studentId)
  }

  // Utility functions
  const setFilters = (newFilters: Partial<StudentFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      status: 'all',
      instrument: '',
      grade: '',
      class: ''
    }
  }

  const refreshData = async () => {
    await Promise.all([
      loadStudents(),
      loadMetrics(),
      loadDropoutRisks()
    ])
  }

  const getStudentById = (id: string): Student | undefined => {
    return students.value.find(s => s.id === id)
  }

  const getStudentsByInstrument = (instrument: string): Student[] => {
    return students.value.filter(s => s.instrumento === instrument)
  }

  const getActiveStudentsByClass = (classId: string): Student[] => {
    return students.value.filter(s => s.activo && s.classId === classId)
  }

  // Search and filter utilities
  const searchStudents = (query: string): Student[] => {
    const lowercaseQuery = query.toLowerCase()
    return students.value.filter(student => 
      student.nombre.toLowerCase().includes(lowercaseQuery) ||
      student.apellido.toLowerCase().includes(lowercaseQuery) ||
      student.email.toLowerCase().includes(lowercaseQuery)
    )
  }

  return {
    // State
    students,
    isLoading,
    error,
    filters,
    metrics,
    dropoutRisks,
    progressReports,

    // Computed
    totalStudents,
    activeStudents,
    filteredStudents,
    highRiskStudents,
    recentStudents,
    availableInstruments,

    // Actions
    loadStudents,
    loadMetrics,
    loadDropoutRisks,
    createStudent,
    updateStudent,
    deleteStudent,
    refreshData,

    // Advanced Features
    importStudents,
    exportStudents,
    sendBulkEmail,
    sendBulkWhatsApp,
    generateProgressReport,
    getProgressReport,

    // Utilities
    setFilters,
    clearFilters,
    getStudentById,
    getStudentsByInstrument,
    getActiveStudentsByClass,
    searchStudents
  }
})

export default useEnhancedStudentsStore
