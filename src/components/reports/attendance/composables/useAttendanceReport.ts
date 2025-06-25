import { ref, computed, watch } from 'vue'
import { parseISO, eachDayOfInterval, getDay } from 'date-fns'
import { useAuthStore } from '../../../../stores/auth'
import { useRoute } from 'vue-router'
import { useAttendanceData } from './useAttendanceData'
import { useAttendanceFilters } from './useAttendanceFilters'
import { useAttendanceCharts } from './useAttendanceCharts'
import { useAttendanceExport } from './useAttendanceExport'
import { 
  calculateAttendancePercentage,
  countTotalStatus,
  calculateStudentAttendancePercentage
} from '../utils/attendanceCalculations'

/**
 * Composable principal para manejar toda la lógica del informe de asistencia
 */
export function useAttendanceReport(props: { teacherId: string }) {
  const authStore = useAuthStore()
  const route = useRoute()
  
  // Composables especializados
  const { from, to, setRange, validateDateRange } = useAttendanceFilters()
  const { 
    attendanceByClass, 
    teacherClasses, 
    loading: dataLoading, 
    error: dataError,
    fetchAttendanceData,
    loadTeacherClasses,
    debugAttendanceStore,
    debugAllStores,
    studentsStore,
    teachersStore,
    classesStore
  } = useAttendanceData()
  const { drawCharts, chartDates, chartWeekday } = useAttendanceCharts()
  const { 
    loading: exportLoading, 
    error: exportError,
    downloadPDF,
    exportCSV,
    exportXLS
  } = useAttendanceExport()

  // Estado del componente
  const loading = ref(false)
  const error = ref<string | null>(null)
  const expandedClasses = ref<Set<string>>(new Set())
  const viewMode = ref<'cards' | 'table'>('cards')
  const expandedObservations = ref<Set<string>>(new Set())
  const expandedStudentJustifications = ref<Set<string>>(new Set())

  // Get teacher ID based on user role
  const currentTeacherId = computed(() => {
    const userRole = authStore.user?.role
    
    // For Director or Admin roles, prioritize the query parameter
    if (userRole === 'Director' || userRole === 'Admin') {
      if (route.query.teacherId) {
        return route.query.teacherId as string
      }
    }
    
    // For teachers or as fallback, use the user's own ID
    return props.teacherId || authStore.user?.uid
  })

  // Flag to show admin indicator
  const isViewingOtherTeacher = computed(() => {
    return (authStore.user?.role === 'Director' || authStore.user?.role === 'Admin') && 
           route.query.teacherId && 
           route.query.teacherId !== authStore.user?.uid
  })

  // Get teacher name from the store
  const teacherName = computed(() => {
    if (!currentTeacherId.value) return authStore.user?.email || 'Profesor'
    
    const teacher = teachersStore.teachers.find(t => t.id === currentTeacherId.value)
    return teacher ? teacher.name : authStore.user?.email || 'Profesor'
  })

  // Datos procesados del informe
  const classReports = ref<Array<{
    classId: string
    className: string
    daySchedule: number[]
    observations: Array<{ date: string; text: string }>
    students: Array<{
      id: string
      name: string
      attendance: Record<string, string>
      observations: string
    }>
    relevantDates?: string[]
  }>>([])

  // Rango de fechas entre from y to
  const dateRange = computed(() => {
    try {
      const start = parseISO(from.value)
      const end = parseISO(to.value)
      return eachDayOfInterval({ start, end }).map(date => date.toISOString().split('T')[0])
    } catch (e) {
      console.error('Error generando rango de fechas:', e)
      return []
    }
  })

  // Contadores para estadísticas
  const totalPresentes = computed(() => {
    let total = 0
    classReports.value.forEach(classData => {
      total += countTotalStatus(classData, 'P')
    })
    return total
  })

  const totalAusentes = computed(() => {
    let total = 0
    classReports.value.forEach(classData => {
      total += countTotalStatus(classData, 'A')
    })
    return total
  })

  const totalTardes = computed(() => {
    let total = 0
    classReports.value.forEach(classData => {
      total += countTotalStatus(classData, 'T')
    })
    return total
  })

  const totalJustificados = computed(() => {
    let total = 0
    classReports.value.forEach(classData => {
      total += countTotalStatus(classData, 'J')
    })
    return total
  })

  // Porcentaje promedio de asistencia
  const averageAttendancePercentage = computed(() => {
    if (classReports.value.length === 0) return 0
    
    let totalPercentage = 0
    classReports.value.forEach(classData => {
      totalPercentage += calculateAttendancePercentage(classData)
    })
    
    return Math.round(totalPercentage / classReports.value.length)
  })

  // Día con mejor asistencia
  const bestAttendanceDay = computed(() => {
    const attendanceByDay = [0, 0, 0, 0, 0, 0, 0]
    const countByDay = [0, 0, 0, 0, 0, 0, 0]
    
    classReports.value.forEach(classData => {
      classData.students.forEach(student => {
        Object.entries(student.attendance).forEach(([date, status]) => {
          const dayOfWeek = getDay(parseISO(date))
          if (status === 'P' || status === 'J') {
            attendanceByDay[dayOfWeek]++
          }
          countByDay[dayOfWeek]++
        })
      })
    })
    
    const percentageByDay = attendanceByDay.map((count, idx) => ({
      day: idx,
      percentage: countByDay[idx] > 0 ? (count / countByDay[idx]) * 100 : 0
    }))
    
    percentageByDay.sort((a, b) => b.percentage - a.percentage)
    
    if (percentageByDay.length === 0 || percentageByDay[0].percentage === 0) {
      return 'No hay datos suficientes'
    }
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return `${dayNames[percentageByDay[0].day]} (${Math.round(percentageByDay[0].percentage)}%)`
  })

  // Método para debug completo del estado
  const debugFullState = () => {
    console.group('🔍 Debug Estado Completo - Informe de Asistencia')
    console.log('👤 Profesor actual:', currentTeacherId.value)
    console.log('📅 Rango de fechas:', { from: from.value, to: to.value })
    console.log('⏳ Estado de carga:', loading.value)
    console.log('❌ Error actual:', error.value)
    console.log('📊 Clases en reporte:', classReports.value.length)
    console.log('📋 Datos de clases:', classReports.value.map(c => ({
      id: c.classId,
      nombre: c.className,
      estudiantes: c.students.length,
      fechas: c.relevantDates?.length || 0
    })))
    console.log('📈 Estadísticas:', {
      presentes: totalPresentes.value,
      ausentes: totalAusentes.value,
      tardes: totalTardes.value,
      justificados: totalJustificados.value,
      promedioAsistencia: averageAttendancePercentage.value
    })
    console.groupEnd()
  }

  // Método para debug de stores
  const debugStores = () => {
    console.group('🏪 Debug Stores')
    
    // Debug Classes Store
    console.log('📚 Classes Store:', {
      total: classesStore.classes?.length || 0,
      clases: classesStore.classes?.slice(0, 5).map((c: any) => ({ 
        id: c.id, 
        nombre: c.nombre, 
        teacherId: c.teacherId,
        teachers: c.teachers?.length || 0,
        alumnos: c.alumnos?.length || 0
      }))
    })
    
    // Debug Teacher Classes
    console.log('👨‍🏫 Teacher Classes:', {
      total: teacherClasses.value.length,
      clases: teacherClasses.value.map((c: any) => ({ 
        id: c.id, 
        nombre: c.nombre,
        estudiantes: c.alumnos?.length || 0
      }))
    })
    
    // Debug Students Store
    console.log('👥 Students Store:', {
      total: studentsStore.students.length,
      primeros5: studentsStore.students.slice(0, 5).map((s: any) => ({ 
        id: s.id, 
        nombre: s.nombre + ' ' + (s.apellido || '') 
      }))
    })
    
    // Debug Teachers Store
    console.log('👨‍🏫 Teachers Store:', {
      total: teachersStore.teachers.length,
      primeros3: teachersStore.teachers.slice(0, 3).map((t: any) => ({ 
        id: t.id, 
        name: t.name 
      }))
    })
    
    // Debug Attendance By Class
    console.log('📊 Attendance By Class:', Object.keys(attendanceByClass.value).map(classId => ({
      classId,
      documentos: attendanceByClass.value[classId].length,
      fechas: Array.from(new Set(attendanceByClass.value[classId].map((doc: any) => doc.fecha))).length
    })))
    
    console.groupEnd()
    
    // También ejecutar el debug del store de asistencia
    debugAttendanceStore()
  }
  const fetchReport = async () => {
    console.log("PRUEBA", currentTeacherId.value, from.value, to.value)
    try {
      loading.value = true
      error.value = null
      
      const { start, end } = validateDateRange(from.value, to.value)
      console.log(`📆 Generando informe de ${start} a ${end} para profesor ${currentTeacherId.value}`)
      
      if (!currentTeacherId.value) {
        error.value = "ID de profesor no disponible"
        return
      }

      // Cargar clases del profesor
      const classes = await loadTeacherClasses(currentTeacherId.value)
      
      if (classes.length === 0) {
        error.value = "El profesor no tiene clases asignadas"
        return
      }

      // Obtener datos de asistencia
      await fetchAttendanceData(currentTeacherId.value, start, end)

      // Procesar cada clase para generar el reporte
      classReports.value = await Promise.all(
        classes.map(async (classObj: any, index: any) => {
          console.log(`📝 Procesando clase ${index + 1}/${classes.length}: ${classObj.nombre || 'Sin nombre'}`)
          
          const classAttendanceDocs = attendanceByClass.value[classObj.id] || []
          console.log(`📊 Documentos de asistencia para clase ${classObj.nombre}: ${classAttendanceDocs.length}`)
          
          // Obtener estudiantes de esta clase
          let students: any[] = []
          const studentIds = classObj.alumnos || []
          
          if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
            console.log(`👥 Procesando ${studentIds.length} estudiantes de la clase ${classObj.nombre}`)
            
            students = await Promise.all(studentIds.map(async (studentId: string) => {
              // Buscar el estudiante en el store
              const studentData = studentsStore.students.find((s: any) => s.id === studentId)
              
              if (!studentData) {
                console.warn(`⚠️ Estudiante ${studentId} no encontrado en store`)
                return {
                  id: studentId,
                  name: 'Estudiante Desconocido',
                  attendance: {},
                  observations: ''
                }
              }
              
              // Procesar asistencias del estudiante
              const attendance: Record<string, string> = {}
              
              classAttendanceDocs.forEach((doc: any) => {
                const date = doc.fecha || ''
                if (!date) return
                
                let status = '-' // Por defecto sin datos
                
                // Verificar en cada tipo de asistencia
                const docData = doc.data || doc
                
                if (docData.justificacion?.some((j: any) => 
                  (j.id === studentId || j.studentId === studentId))) {
                  status = 'J' // Justificado
                } else if (docData.presentes?.includes(studentId)) {
                  status = 'P' // Presente
                } else if (docData.tarde?.includes(studentId)) {
                  status = 'T' // Tarde
                } else if (docData.ausentes?.includes(studentId)) {
                  status = 'A' // Ausente
                }
                
                attendance[date] = status
              })
              
              return {
                id: studentId,
                name: `${studentData.nombre || 'Sin nombre'} ${studentData.apellido || ''}`.trim(),
                attendance,
                observations: studentData.observaciones || ''
              }
            }))
          } else {
            console.log(`📝 La clase ${classObj.nombre} no tiene estudiantes asignados`)
          }

          // Obtener fechas relevantes (fechas con documentos de asistencia)
          const relevantDates = Array.from(new Set(
            classAttendanceDocs.map((doc: any) => doc.fecha || '')
          )).filter(Boolean).sort()

          console.log(`📅 Fechas relevantes para ${classObj.nombre}: ${relevantDates.length}`)

          // Obtener observaciones de la clase
          const observations: Array<{date: string; text: string}> = []
          for (const doc of classAttendanceDocs) {
            const docData = doc.data || doc
            if (docData.observations) {
              let obsText = ''
              
              if (typeof docData.observations === 'string') {
                obsText = docData.observations
              } else if (Array.isArray(docData.observations)) {
                obsText = docData.observations
                  .map((obs: any) => obs.text || obs.toString())
                  .join('\n')
              }
              
              if (obsText.trim()) {
                observations.push({
                  date: doc.fecha || '',
                  text: obsText.trim()
                })
              }
            }
          }

          // Procesar horario de la clase
          const daySchedule = classObj.horario ? 
            [classObj.horario.dia].map((day: string) => {
              const dayMap: Record<string, number> = { 
                'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 
                'jueves': 4, 'viernes': 5, 'sábado': 6 
              }
              return dayMap[day?.toLowerCase()] || 0
            }) : []

          const classReport = {
            classId: classObj.id,
            className: classObj.nombre || 'Clase sin nombre',
            daySchedule,
            observations: observations.sort((a, b) => a.date.localeCompare(b.date)),
            students,
            relevantDates
          }
          
          console.log(`✅ Clase ${classObj.nombre} procesada: ${students.length} estudiantes, ${relevantDates.length} fechas, ${observations.length} observaciones`)
          
          return classReport
        })
      )

      // Generar gráficas
      drawCharts(classReports.value)
      
      console.log(`🎉 Reporte generado: ${classReports.value.length} clases procesadas`)
      
    } catch (err) {
      console.error('❌ Error al generar informe:', err)
      error.value = err instanceof Error ? err.message : 'Error al generar el informe'
    } finally {
      loading.value = false
    }
  }

  // Funciones de utilidad
  const toggleClassExpansion = (classId: string) => {
    if (expandedClasses.value.has(classId)) {
      expandedClasses.value.delete(classId)
    } else {
      expandedClasses.value.add(classId)
    }
  }

  const expandAllClasses = () => {
    classReports.value.forEach(classData => {
      expandedClasses.value.add(classData.classId)
    })
  }

  const collapseAllClasses = () => {
    expandedClasses.value.clear()
  }

  // Sincronizar datos
  const syncAttendanceData = async () => {
    try {
      loading.value = true
      await fetchReport()
    } finally {
      loading.value = false
    }
  }

  // Observar cambios en las fechas
  watch([currentTeacherId, from, to], () => {
    if (currentTeacherId.value) {
      fetchReport()
    }
  })

  // Exportación
  const handleDownloadPDF = () => downloadPDF(from.value, to.value)
  const handleExportCSV = () => exportCSV(classReports.value, dateRange.value, from.value, to.value)
  const handleExportXLS = () => exportXLS(classReports.value, dateRange.value, from.value, to.value)

  return {
    // Estado
    loading: computed(() => loading.value || dataLoading.value),
    error: computed(() => error.value || dataError.value || exportError.value),
    expandedClasses,
    viewMode,
    expandedObservations,
    expandedStudentJustifications,
    
    // Datos
    classReports,
    dateRange,
    currentTeacherId,
    isViewingOtherTeacher,
    teacherName,
    
    // Filtros
    from,
    to,
    setRange,
    
    // Estadísticas
    totalPresentes,
    totalAusentes,
    totalTardes,
    totalJustificados,
    averageAttendancePercentage,
    bestAttendanceDay,
    
    // Gráficas
    chartDates,
    chartWeekday,
    
    // Métodos
    fetchReport,
    syncAttendanceData,
    toggleClassExpansion,
    expandAllClasses,
    collapseAllClasses,
    debugAttendanceStore,
    debugFullState,
    debugStores,
    debugAllStores,
    
    // Cálculos
    calculateAttendancePercentage,
    calculateStudentAttendancePercentage,
    
    // Exportación
    exportLoading,
    handleDownloadPDF,
    handleExportCSV,
    handleExportXLS
  }
}
