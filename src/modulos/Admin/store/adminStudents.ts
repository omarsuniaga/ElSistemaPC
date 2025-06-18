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
// Importar servicio avanzado
import { 
  advancedStudentsService, 
  type ImportResult, 
  type EmailMessage, 
  type ProgressReport,
  type SatisfactionMetrics,
  type ChurnPrediction,
  type Document as StudentDocument
} from '../services/advancedStudents'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  birthDate: Date
  address: string
  parentName: string
  parentPhone: string
  parentEmail: string
  instruments: string[]
  grade: 'beginner' | 'intermediate' | 'advanced'
  status: 'active' | 'inactive' | 'pending'
  enrollmentDate: Date
  classes: string[]
  notes: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

interface StudentFilters {
  search: string
  status: string
  grade: string
  instrument: string
  class: string
}

interface StudentStats {
  total: number
  active: number
  inactive: number
  pending: number
  newThisMonth: number
  byGrade: Record<string, number>
  byInstrument: Record<string, number>
}

export const useAdminStudentsStore = defineStore('adminStudents', () => {
  // State
  const students = ref<Student[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<StudentFilters>({
    search: '',
    status: '',
    grade: '',
    instrument: '',
    class: ''
  })

  // Getters
  const studentStats = computed((): StudentStats => {
    const stats: StudentStats = {
      total: students.value.length,
      active: 0,
      inactive: 0,
      pending: 0,
      newThisMonth: 0,
      byGrade: {},
      byInstrument: {}
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    students.value.forEach(student => {
      // Status counts
      stats[student.status]++

      // New this month
      if (new Date(student.enrollmentDate) >= startOfMonth) {
        stats.newThisMonth++
      }

      // By grade
      stats.byGrade[student.grade] = (stats.byGrade[student.grade] || 0) + 1

      // By instrument
      student.instruments.forEach(instrument => {
        stats.byInstrument[instrument] = (stats.byInstrument[instrument] || 0) + 1
      })
    })

    return stats
  })

  const filteredStudents = computed(() => {
    let filtered = [...students.value]

    // Search filter
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.phone.includes(searchTerm) ||
        student.parentName.toLowerCase().includes(searchTerm)
      )
    }

    // Status filter
    if (filters.value.status) {
      filtered = filtered.filter(student => student.status === filters.value.status)
    }

    // Grade filter
    if (filters.value.grade) {
      filtered = filtered.filter(student => student.grade === filters.value.grade)
    }

    // Instrument filter
    if (filters.value.instrument) {
      filtered = filtered.filter(student => 
        student.instruments.includes(filters.value.instrument)
      )
    }

    return filtered
  })

  const activeStudents = computed(() => 
    students.value.filter(student => student.status === 'active')
  )

  const recentStudents = computed(() =>
    students.value
      .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
      .slice(0, 10)
  )

  // Actions
  const loadStudents = async () => {
    try {
      isLoading.value = true
      error.value = null

      const studentsQuery = query(
        collection(db, 'ALUMNOS'),
        orderBy('name', 'asc')
      )

      const snapshot = await getDocs(studentsQuery)
      students.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        birthDate: doc.data().birthDate?.toDate() || new Date(),
        enrollmentDate: doc.data().enrollmentDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Student[]

      console.log('✅ Students loaded:', students.value.length)

    } catch (err: any) {
      console.error('❌ Error loading students:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const getStudent = async (studentId: string): Promise<Student | null> => {
    try {
      const docRef = doc(db, 'ALUMNOS', studentId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          birthDate: data.birthDate?.toDate() || new Date(),
          enrollmentDate: data.enrollmentDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Student
      }

      return null
    } catch (err: any) {
      console.error('❌ Error getting student:', err)
      throw err
    }
  }

  const createStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null

      const docRef = await addDoc(collection(db, 'ALUMNOS'), {
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const newStudent: Student = {
        id: docRef.id,
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      students.value.push(newStudent)
      console.log('✅ Student created:', newStudent.name)
      
      return newStudent

    } catch (err: any) {
      console.error('❌ Error creating student:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      isLoading.value = true
      error.value = null

      const docRef = doc(db, 'ALUMNOS', studentId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })

      // Update local state
      const index = students.value.findIndex(s => s.id === studentId)
      if (index !== -1) {
        students.value[index] = {
          ...students.value[index],
          ...updates,
          updatedAt: new Date()
        }
      }

      console.log('✅ Student updated:', studentId)

    } catch (err: any) {
      console.error('❌ Error updating student:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateStudentStatus = async (studentId: string, status: Student['status']) => {
    await updateStudent(studentId, { status })
  }

  const deleteStudent = async (studentId: string) => {
    try {
      isLoading.value = true
      error.value = null

      await deleteDoc(doc(db, 'ALUMNOS', studentId))

      // Remove from local state
      students.value = students.value.filter(s => s.id !== studentId)
      
      console.log('✅ Student deleted:', studentId)

    } catch (err: any) {
      console.error('❌ Error deleting student:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const searchStudents = async (searchTerm: string) => {
    try {
      if (!searchTerm.trim()) {
        return students.value
      }

      const searchQuery = searchTerm.toLowerCase()
      return students.value.filter(student =>
        student.name.toLowerCase().includes(searchQuery) ||
        student.email.toLowerCase().includes(searchQuery) ||
        student.phone.includes(searchQuery) ||
        student.parentName.toLowerCase().includes(searchQuery)
      )
    } catch (err: any) {
      console.error('❌ Error searching students:', err)
      throw err
    }
  }

  const getStudentsByClass = async (classId: string) => {
    try {
      const studentsQuery = query(
        collection(db, 'ALUMNOS'),
        where('classes', 'array-contains', classId)
      )

      const snapshot = await getDocs(studentsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        birthDate: doc.data().birthDate?.toDate() || new Date(),
        enrollmentDate: doc.data().enrollmentDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Student[]

    } catch (err: any) {
      console.error('❌ Error getting students by class:', err)
      throw err
    }
  }

  const getStudentsByInstrument = async (instrument: string) => {
    try {
      const studentsQuery = query(
        collection(db, 'ALUMNOS'),
        where('instruments', 'array-contains', instrument)
      )

      const snapshot = await getDocs(studentsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        birthDate: doc.data().birthDate?.toDate() || new Date(),
        enrollmentDate: doc.data().enrollmentDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Student[]

    } catch (err: any) {
      console.error('❌ Error getting students by instrument:', err)
      throw err
    }
  }

  const exportStudents = (studentsToExport: Student[] = students.value) => {
    try {
      const csvContent = [
        // Headers
        'Nombre,Email,Teléfono,Fecha Nacimiento,Padre/Tutor,Teléfono Padre,Email Padre,Instrumentos,Nivel,Estado,Fecha Inscripción',
        // Data
        ...studentsToExport.map(student => [
          student.name,
          student.email,
          student.phone,
          student.birthDate.toLocaleDateString(),
          student.parentName,
          student.parentPhone,
          student.parentEmail,
          student.instruments.join('; '),
          student.grade,
          student.status,
          student.enrollmentDate.toLocaleDateString()
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('✅ Students exported:', studentsToExport.length)

    } catch (err: any) {
      console.error('❌ Error exporting students:', err)
      throw err
    }
  }

  const assignStudentToClass = async (studentId: string, classId: string) => {
    try {
      const student = students.value.find(s => s.id === studentId)
      if (!student) throw new Error('Student not found')

      const updatedClasses = [...(student.classes || []), classId]
      await updateStudent(studentId, { classes: updatedClasses })

      console.log('✅ Student assigned to class:', { studentId, classId })

    } catch (err: any) {
      console.error('❌ Error assigning student to class:', err)
      throw err
    }
  }

  const removeStudentFromClass = async (studentId: string, classId: string) => {
    try {
      const student = students.value.find(s => s.id === studentId)
      if (!student) throw new Error('Student not found')

      const updatedClasses = (student.classes || []).filter(id => id !== classId)
      await updateStudent(studentId, { classes: updatedClasses })

      console.log('✅ Student removed from class:', { studentId, classId })

    } catch (err: any) {
      console.error('❌ Error removing student from class:', err)
      throw err
    }
  }

  // Bulk operations
  const bulkUpdateStudents = async (studentIds: string[], updates: Partial<Student>) => {
    try {
      isLoading.value = true
      error.value = null

      const promises = studentIds.map(id => updateStudent(id, updates))
      await Promise.all(promises)

      console.log('✅ Bulk update completed:', studentIds.length)

    } catch (err: any) {
      console.error('❌ Error in bulk update:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const bulkDeleteStudents = async (studentIds: string[]) => {
    try {
      isLoading.value = true
      error.value = null

      const promises = studentIds.map(id => deleteStudent(id))
      await Promise.all(promises)

      console.log('✅ Bulk delete completed:', studentIds.length)

    } catch (err: any) {
      console.error('❌ Error in bulk delete:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Filters
  const setFilters = (newFilters: Partial<StudentFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      status: '',
      grade: '',
      instrument: '',
      class: ''
    }
  }

  // Reset function
  const $reset = () => {
    students.value = []
    isLoading.value = false
    error.value = null
    clearFilters()
  }

  // ==========================================
  // FUNCIONES AVANZADAS - FASE 1
  // ==========================================

  // IMPORTACIÓN DE DATOS
  const importStudentsFromCSV = async (file: File): Promise<ImportResult> => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await advancedStudentsService.importStudentsFromCSV(file)
      
      // Recargar estudiantes si hubo importaciones exitosas
      if (result.imported > 0) {
        await loadStudents()
      }
      
      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const importStudentsFromExcel = async (file: File): Promise<ImportResult> => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await advancedStudentsService.importStudentsFromExcel(file)
      
      if (result.imported > 0) {
        await loadStudents()
      }
      
      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // COMUNICACIÓN MASIVA
  const sendBulkEmailToStudents = async (studentIds: string[], message: EmailMessage): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      await advancedStudentsService.sendBulkEmailToStudents(studentIds, message)
      
      console.log('✅ Emails enviados exitosamente:', studentIds.length)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const sendWhatsAppToParents = async (studentIds: string[], message: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      await advancedStudentsService.sendWhatsAppToParents(studentIds, message)
      
      console.log('✅ WhatsApp enviados exitosamente:', studentIds.length)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // REPORTES AVANZADOS
  const generateStudentProgressReport = async (studentId: string): Promise<ProgressReport> => {
    try {
      isLoading.value = true
      error.value = null
      
      const report = await advancedStudentsService.generateStudentProgressReport(studentId)
      
      console.log('✅ Reporte de progreso generado:', report.studentName)
      return report
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateClassRosterPDF = async (classId: string): Promise<Blob> => {
    try {
      isLoading.value = true
      error.value = null
      
      const pdfBlob = await advancedStudentsService.generateClassRosterPDF(classId)
      
      console.log('✅ PDF de lista de clase generado')
      return pdfBlob
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateAttendanceCertificate = async (studentId: string): Promise<Blob> => {
    try {
      isLoading.value = true
      error.value = null
      
      const certificateBlob = await advancedStudentsService.generateAttendanceCertificate(studentId)
      
      console.log('✅ Certificado de asistencia generado')
      return certificateBlob
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ANÁLISIS Y MÉTRICAS
  const getStudentRetentionRate = async (period: { start: Date; end: Date }): Promise<number> => {
    try {
      isLoading.value = true
      error.value = null
      
      const retentionRate = await advancedStudentsService.getStudentRetentionRate(period)
      
      console.log('✅ Tasa de retención calculada:', retentionRate + '%')
      return retentionRate
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getStudentSatisfactionMetrics = async (): Promise<SatisfactionMetrics> => {
    try {
      isLoading.value = true
      error.value = null
      
      const metrics = await advancedStudentsService.getStudentSatisfactionMetrics()
      
      console.log('✅ Métricas de satisfacción obtenidas:', metrics.averageRating)
      return metrics
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const predictStudentChurn = async (studentId: string): Promise<ChurnPrediction> => {
    try {
      isLoading.value = true
      error.value = null
      
      const prediction = await advancedStudentsService.predictStudentChurn(studentId)
      
      console.log('✅ Predicción de deserción generada:', prediction.riskLevel)
      return prediction
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // GESTIÓN DE DOCUMENTOS
  const uploadStudentDocument = async (studentId: string, document: File): Promise<StudentDocument> => {
    try {
      isLoading.value = true
      error.value = null
      
      const uploadedDoc = await advancedStudentsService.uploadStudentDocument(studentId, document)
      
      console.log('✅ Documento subido:', uploadedDoc.name)
      return uploadedDoc
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getStudentDocuments = async (studentId: string): Promise<StudentDocument[]> => {
    try {
      isLoading.value = true
      error.value = null
      
      const documents = await advancedStudentsService.getStudentDocuments(studentId)
      
      console.log('✅ Documentos obtenidos:', documents.length)
      return documents
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    students,
    isLoading,
    error,
    filters,

    // Getters
    studentStats,
    filteredStudents,
    activeStudents,
    recentStudents,

    // Actions
    loadStudents,
    getStudent,
    createStudent,
    updateStudent,
    updateStudentStatus,
    deleteStudent,
    searchStudents,
    getStudentsByClass,
    getStudentsByInstrument,
    exportStudents,
    assignStudentToClass,
    removeStudentFromClass,
    bulkUpdateStudents,
    bulkDeleteStudents,
    setFilters,
    clearFilters,
    $reset,

    // FUNCIONES AVANZADAS - FASE 1
    importStudentsFromCSV,
    importStudentsFromExcel,
    sendBulkEmailToStudents,
    sendWhatsAppToParents,
    generateStudentProgressReport,
    generateClassRosterPDF,
    generateAttendanceCertificate,
    getStudentRetentionRate,
    getStudentSatisfactionMetrics,
    predictStudentChurn,
    uploadStudentDocument,
    getStudentDocuments
  }
})

export type { Student, StudentFilters, StudentStats }
