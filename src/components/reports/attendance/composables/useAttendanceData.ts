import { ref, computed } from 'vue'
import { useAttendanceStore } from '../../../../modulos/Attendance/store/attendance'
import { useClassesStore } from '../../../../modulos/Classes/store/classes'
import { useStudentsStore } from '../../../../modulos/Students/store/students'
import { useTeachersStore } from '../../../../modulos/Teachers/store/teachers'
import { useObservationsStore } from '../../../../stores/observations'

/**
 * Composable para manejar la carga y organización de datos de asistencia
 */
export function useAttendanceData() {
  const attendanceStore = useAttendanceStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()
  const teachersStore = useTeachersStore()
  const observationsStore = useObservationsStore()

  // Estado reactivo
  const attendanceByClass = ref<Record<string, any[]>>({})
  const teacherClasses = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cargar datos de asistencia para un rango de fechas y profesor - SIMPLIFICADO
  const fetchAttendanceData = async (teacherId: string, startDate: string, endDate: string) => {
    try {
      loading.value = true
      error.value = null

      if (!teacherId) {
        throw new Error('ID de profesor no disponible')
      }

      console.log(`🔍 Cargando asistencias para profesor: ${teacherId}`)
      console.log(`📅 Rango de fechas: ${startDate} a ${endDate}`)

      // Cargar documentos de asistencia (el método ya filtra por profesor y fechas)
      const attendanceDocs = await attendanceStore.fetchAttendanceDocumentsByTeacher(teacherId, startDate, endDate)
      console.log(`📄 Documentos cargados: ${attendanceDocs.length}`)

      // Debug: mostrar algunos documentos de ejemplo
      if (attendanceDocs.length > 0) {
        console.log('📊 Primeros 3 documentos:', attendanceDocs.slice(0, 3).map(doc => ({
          id: doc.id,
          fecha: doc.fecha,
          classId: doc.classId,
          teacherId: doc.teacherId || doc.uid
        })))
      }

      // Organizar por clase
      const docsByClass = attendanceDocs.reduce((acc, doc) => {
        const classId = doc.classId
        if (!classId) return acc
        
        if (!acc[classId]) {
          acc[classId] = []
        }
        acc[classId].push(doc)
        return acc
      }, {} as Record<string, any[]>)

      console.log('📋 Documentos organizados por clase:', Object.keys(docsByClass).map(classId => ({
        classId,
        documentos: docsByClass[classId].length
      })))

      attendanceByClass.value = docsByClass
      
      return attendanceDocs
    } catch (err) {
      console.error('❌ Error al obtener datos de asistencia:', err)
      error.value = err instanceof Error ? err.message : 'Error al cargar datos de asistencia'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cargar clases del profesor (incluyendo clases compartidas)
  const loadTeacherClasses = async (teacherId: string) => {
    try {
        const promises = []

        await classesStore.getAllTeacherClasses(teacherId)
        console.log(`🔍 Cargando clases para profesor: ${teacherId}`)      
      // Asegurar que todos los stores estén cargados
      
      if (!classesStore.classes || classesStore.classes.length === 0) {
          console.log("PROMISE",classesStore.classes)
          promises.push(classesStore.fetchClasses())
      } else {
        console.log(`📚 Store ya tiene clases: ${classesStore.classes.length}`)
      }
      
      if (!studentsStore.students || studentsStore.students.length === 0) {
        console.log('👥 Store de estudiantes vacío, cargando...')
        promises.push(studentsStore.fetchStudents())
      } else {
        console.log(`👥 Store ya tiene estudiantes: ${studentsStore.students.length}`)
      }
      
      if (!teachersStore.teachers || teachersStore.teachers.length === 0) {
        console.log('👨‍🏫 Store de maestros vacío, cargando...')
        promises.push(teachersStore.fetchTeachers())
      } else {
        console.log(`�‍🏫 Store ya tiene maestros: ${teachersStore.teachers.length}`)
      }
      
      // Esperar a que se carguen los stores necesarios
      if (promises.length > 0) {
        console.log(`⏳ Esperando carga de ${promises.length} stores...`)
        await Promise.all(promises)
        console.log('✅ Stores cargados exitosamente')
        console.log(`📚 Clases disponibles: ${classesStore.classes?.length || 0}`)
        console.log(`👥 Estudiantes disponibles: ${studentsStore.students?.length || 0}`)
        console.log(`👨‍🏫 Maestros disponibles: ${teachersStore.teachers?.length || 0}`)
      }
      console.log("PROMISE:", promises)

      // Debug: mostrar algunas clases disponibles
      console.log('📊 Primeras 3 clases en store:', classesStore.classes?.slice(0, 3).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        teacherId: c.teacherId,
        teachers: c.teachers || 'No tiene'
      })))
      
      // 1. Filtrar clases donde el profesor es el titular (teacherId)
      const primaryClasses = (classesStore.classes || []).filter((c: any) => c.teacherId === teacherId)
      console.log(`�‍🏫 Clases como profesor titular: ${primaryClasses.length}`)
      
      // 2. Filtrar clases compartidas (donde aparece en teachers[])
      const sharedClasses = (classesStore.classes || []).filter((c: any) => {
        if (!c.teachers || !Array.isArray(c.teachers)) return false
        
        // Buscar en el array de teachers si alguno tiene el teacherId
        return c.teachers.some((teacher: any) => {
          const tId = teacher.teacherId || teacher.id || teacher.uid
          return tId === teacherId
        })
      })
      console.log(`🤝 Clases compartidas encontradas: ${sharedClasses.length}`)
      
      // 3. Combinar ambas listas evitando duplicados
      const allClasses = [...primaryClasses]
      sharedClasses.forEach((sharedClass: any) => {
        const exists = allClasses.some((existing: any) => existing.id === sharedClass.id)
        if (!exists) {
          allClasses.push(sharedClass)
        }
      })
      
      teacherClasses.value = allClasses
      
      console.log(`📚 Total de clases del profesor: ${allClasses.length}`)
      console.log('📋 Clases encontradas:', allClasses.map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: primaryClasses.some((p: any) => p.id === c.id) ? 'Titular' : 'Compartida',
        estudiantes: c.alumnos?.length || 0
      })))
      
      return allClasses
    } catch (err) {
      console.error('❌ Error loading teacher classes:', err)
      throw err
    }
  }

  // Procesar datos de asistencia
  const processAttendanceData = (attendanceDoc: any) => {
    const result = {
      presentes: [] as string[],
      ausentes: [] as string[],
      tarde: [] as string[],
      justificados: [] as string[],
      observaciones: ''
    }

    if (!attendanceDoc || !attendanceDoc.data) {
      return result
    }

    if (Array.isArray(attendanceDoc.data.presentes)) {
      result.presentes = attendanceDoc.data.presentes
    }
    if (Array.isArray(attendanceDoc.data.ausentes)) {
      result.ausentes = attendanceDoc.data.ausentes
    }
    if (Array.isArray(attendanceDoc.data.tarde)) {
      result.tarde = attendanceDoc.data.tarde
    }
    if (Array.isArray(attendanceDoc.data.justificacion)) {
      result.justificados = attendanceDoc.data.justificacion.map((j: any) => j.id)
    }
    
    result.observaciones = attendanceDoc.data.observations || ''
    
    return result
  }

  // Función de debug del store
  const debugAttendanceStore = () => {
    console.group('🔍 Debug del Store de Asistencia')
    console.log('📊 Total documentos en store:', attendanceStore.attendanceDocuments.length)
    
    if (attendanceStore.attendanceDocuments.length > 0) {
      console.log('📄 Primeros 3 documentos:', attendanceStore.attendanceDocuments.slice(0, 3))
      
      // Agrupar por profesor
      const docsByTeacher = attendanceStore.attendanceDocuments.reduce((acc, doc) => {
        const teacherId = doc.teacherId || doc.uid || 'sin-profesor'
        if (!acc[teacherId]) acc[teacherId] = 0
        acc[teacherId]++
        return acc
      }, {} as Record<string, number>)
      
      console.log('👥 Documentos por profesor:', docsByTeacher)
    }
    
    console.groupEnd()
  }

  // Función para debug completo de todos los stores
  const debugAllStores = () => {
    console.group('🔍 Debug Completo de Todos los Stores')
    
    console.log('📚 Classes Store:')
    console.log('  - Total clases:', classesStore.classes?.length || 0)
    console.log('  - Estado carga:', classesStore.loading)
    if (classesStore.classes?.length > 0) {
      console.log('  - Primeras 3 clases:', classesStore.classes.slice(0, 3).map(c => ({
        id: c.id,
        nombre: c.nombre,
        teacherId: c.teacherId
      })))
    }
    
    console.log('👥 Students Store:')
    console.log('  - Total estudiantes:', studentsStore.students?.length || 0)
    console.log('  - Estado carga:', studentsStore.loading)
    if (studentsStore.students?.length > 0) {
      console.log('  - Primeros 3 estudiantes:', studentsStore.students.slice(0, 3).map(s => ({
        id: s.id,
        nombre: s.nombre,
        email: s.email
      })))
    }
    
    console.log('👨‍🏫 Teachers Store:')
    console.log('  - Total maestros:', teachersStore.teachers?.length || 0)
    console.log('  - Estado carga:', teachersStore.loading)
    if (teachersStore.teachers?.length > 0) {
      console.log('  - Primeros 3 maestros:', teachersStore.teachers.slice(0, 3).map(t => ({
        id: t.id,
        nombre: t.nombre,
        email: t.email
      })))
    }
    
    console.log('📄 Attendance Store:')
    console.log('  - Total documentos:', attendanceStore.attendanceDocuments?.length || 0)
    console.log('  - Estado carga:', attendanceStore.loading)
    
    console.log('📝 Observations Store:')
    console.log('  - Total observaciones:', observationsStore.observations?.length || 0)
    console.log('  - Estado carga:', observationsStore.loading)
    
    console.groupEnd()
  }

  // Cargar observaciones para un rango de fechas
  const loadObservations = async (startDate: string, endDate: string) => {
    try {
      console.log(`📝 Cargando observaciones del ${startDate} al ${endDate}`)
      
      if (!observationsStore.observations || observationsStore.observations.length === 0) {
        console.log('📝 Store de observaciones vacío, cargando...')
        await observationsStore.fetchObservations()
        console.log(`📝 Observaciones cargadas: ${observationsStore.observations?.length || 0}`)
      }
      
      // Filtrar observaciones por rango de fechas
      const filteredObservations = (observationsStore.observations || []).filter(obs => {
        const obsDate = obs.fecha || obs.date
        return obsDate && obsDate >= startDate && obsDate <= endDate
      })
      
      console.log(`📝 Observaciones filtradas por fecha: ${filteredObservations.length}`)
      return filteredObservations
      
    } catch (err) {
      console.error('❌ Error cargando observaciones:', err)
      return []
    }
  }

  return {
    // Estado
    attendanceByClass,
    teacherClasses,
    loading,
    error,
    
    // Métodos
    fetchAttendanceData,
    loadTeacherClasses,
    processAttendanceData,
    debugAttendanceStore,
    debugAllStores,
    loadObservations,
    
    // Stores para acceso directo
    attendanceStore,
    classesStore,
    studentsStore,
    teachersStore,
    observationsStore
  }
}
