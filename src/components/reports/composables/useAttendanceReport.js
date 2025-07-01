import {ref, computed, reactive} from "vue"
import {useRoute} from "vue-router"
import {useAuthStore} from "../../../stores/auth"
import {useClassesStore} from "../../../modulos/Classes/store/classes"
import {useStudentsStore} from "../../../modulos/Students/store/students"
import {useAttendanceStore} from "../../../modulos/Attendance/store/attendance"
import {useTeachersStore} from "../../../modulos/Teachers/store/teachers"
import {useObservationsStore} from "../../../stores/observations"
// Importar el nuevo composable de datos de asistencia
import {useAttendanceData} from "../attendance/composables/useAttendanceData"
// Importar también la versión simplificada como alternativa
import {useAttendanceDataSimple} from "../attendance/composables/useAttendanceDataSimple"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns"
import {es} from "date-fns/locale"

/**
 * Composable principal para el informe de asistencia del profesor
 */
export function useAttendanceReport() {
  const route = useRoute()
  const authStore = useAuthStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()
  const attendanceStore = useAttendanceStore()
  const teachersStore = useTeachersStore()

  // Inicializar el nuevo composable de datos de asistencia
  const attendanceData = useAttendanceData()

  // =====================================
  // ESTADO REACTIVO
  // =====================================

  const loading = ref(false)
  const error = ref(null)

  // Configuración de período
  const selectedPeriod = ref("this_month") // 'today', 'this_week', 'this_month', 'last_week', 'last_month', 'custom'
  const customDateRange = reactive({
    start: null,
    end: null,
  })

  // Datos del informe
  const reportData = reactive({
    classes: [],
    totalStudents: 0,
    dateRange: {
      start: null,
      end: null,
    },
  })

  // Información del profesor
  const teacherInfo = reactive({
    id: null,
    name: "",
    email: "",
  })

  // =====================================
  // COMPUTED PROPERTIES
  // =====================================

  // ID del profesor actual (de props o URL)
  const currentTeacherId = computed(() => {
    return route.params.teacherId || authStore.currentUser?.uid
  })

  // Texto descriptivo del período seleccionado
  const selectedPeriodText = computed(() => {
    const periods = {
      today: "Hoy",
      this_week: "Esta semana",
      this_month: "Este mes",
      last_week: "Semana pasada",
      last_month: "Mes pasado",
      custom: "Período personalizado",
    }
    return periods[selectedPeriod.value] || "Período seleccionado"
  })

  // Rango de fechas actual basado en el período seleccionado
  const actualDateRange = computed(() => {
    const now = new Date()

    switch (selectedPeriod.value) {
      case "today":
        return {
          start: format(now, "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        }

      case "this_week":
        return {
          start: format(startOfWeek(now, {locale: es}), "yyyy-MM-dd"),
          end: format(endOfWeek(now, {locale: es}), "yyyy-MM-dd"),
        }

      case "this_month":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        }

      case "last_week":
        const lastWeek = subWeeks(now, 1)
        return {
          start: format(startOfWeek(lastWeek, {locale: es}), "yyyy-MM-dd"),
          end: format(endOfWeek(lastWeek, {locale: es}), "yyyy-MM-dd"),
        }

      case "last_month":
        const lastMonth = subMonths(now, 1)
        return {
          start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        }

      case "custom":
        return {
          start: customDateRange.start
            ? format(new Date(customDateRange.start), "yyyy-MM-dd")
            : null,
          end: customDateRange.end ? format(new Date(customDateRange.end), "yyyy-MM-dd") : null,
        }

      default:
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        }
    }
  })

  // Total de estudiantes
  const totalStudents = computed(() => {
    return reportData.classes.reduce((total, classData) => {
      return total + (classData.students?.length || 0)
    }, 0)
  })

  // Estadísticas generales
  const overviewStats = computed(() => {
    let totalPresent = 0
    let totalAbsent = 0
    let totalLate = 0
    let totalJustified = 0
    let totalSessions = 0

    reportData.classes.forEach((classData) => {
      classData.students.forEach((student) => {
        Object.values(student.attendance || {}).forEach((status) => {
          totalSessions++
          switch (status) {
            case "present":
              totalPresent++
              break
            case "absent":
              totalAbsent++
              break
            case "late":
              totalLate++
              break
            case "justified":
              totalJustified++
              break
          }
        })
      })
    })

    const attendanceRate =
      totalSessions > 0 ? Math.round(((totalPresent + totalLate) / totalSessions) * 100) : 0

    return {
      totalPresent,
      totalAbsent,
      totalLate,
      totalJustified,
      totalSessions,
      attendanceRate,
      absenceRate: 100 - attendanceRate,
    }
  })

  // Datos para gráficos
  const chartData = computed(() => {
    // Aquí procesaremos los datos para crear gráficos
    const dailyStats = {}
    const weeklyStats = {}

    reportData.classes.forEach((classData) => {
      classData.attendanceRecords.forEach((record) => {
        const date = record.date
        if (!dailyStats[date]) {
          dailyStats[date] = {present: 0, absent: 0, late: 0, total: 0}
        }

        // Procesar asistencias del día
        Object.values(record.attendance || {}).forEach((status) => {
          dailyStats[date].total++
          if (status === "present") dailyStats[date].present++
          else if (status === "absent") dailyStats[date].absent++
          else if (status === "late") dailyStats[date].late++
        })
      })
    })

    return {
      daily: dailyStats,
      weekly: weeklyStats,
    }
  })

  // =====================================
  // FUNCIONES DE UTILIDAD
  // =====================================

  /**
   * Procesar datos de asistencia de un documento
   */
  const processAttendanceData = (attendanceDoc) => {
    const result = {
      presentes: [],
      ausentes: [],
      tarde: [],
      justificados: [],
      observaciones: "",
    }

    if (!attendanceDoc || !attendanceDoc.data) {
      console.warn("Documento de asistencia inválido o vacío")
      return result
    }

    // Validar y procesar cada estado
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
      result.justificados = attendanceDoc.data.justificacion.map((j) => j.id)
    }

    result.observaciones = attendanceDoc.data.observations || ""

    return result
  }

  /**
   * Contar total de un estado específico en una clase
   */
  const countTotalStatus = (classData, status) => {
    let count = 0

    for (const student of classData.students) {
      for (const date in student.attendance) {
        if (student.attendance[date] === status.toLowerCase()) {
          count++
        }
      }
    }

    return count
  }

  /**
   * Calcular porcentaje de asistencia para una clase
   */
  const calculateAttendancePercentage = (classData) => {
    let total = 0
    let present = 0

    for (const student of classData.students) {
      for (const date in student.attendance) {
        total++
        const status = student.attendance[date]
        if (status === "present" || status === "late") {
          present++
        }
      }
    }

    return total > 0 ? Math.round((present / total) * 100) : 0
  }

  /**
   * Obtener justificación de un estudiante para una fecha específica
   */
  const getStudentJustification = (classId, date, studentId) => {
    // Buscar en los documentos de asistencia
    const document = attendanceStore.attendanceDocuments.find(
      (doc) => doc.classId === classId && (doc.fecha === date || doc.date === date)
    )

    if (document && document.data && document.data.justificacion) {
      const justification = document.data.justificacion.find((j) => j.id === studentId)
      if (justification) {
        return justification.reason || justification.razon || ""
      }
    }

    return null
  }

  /**
   * Validar y formatear rango de fechas
   */
  const validateDateRange = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Fechas inválidas")
    }

    if (start > end) {
      throw new Error("La fecha inicial debe ser anterior a la fecha final")
    }

    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    }
  }

  // =====================================
  // MÉTODOS PRINCIPALES
  // =====================================

  /**
   * Cargar información del profesor
   */
  const loadTeacherInfo = async () => {
    try {
      if (!currentTeacherId.value) return

      // Cargar datos del profesor desde el store
      if (teachersStore.teachers.length === 0) {
        await teachersStore.fetchTeachers()
      }

      const teacher = teachersStore.teachers.find((t) => t.id === currentTeacherId.value)
      if (teacher) {
        Object.assign(teacherInfo, {
          id: teacher.id,
          name: teacher.nombre || teacher.name || "Profesor",
          email: teacher.email || "",
        })
      }
    } catch (err) {
      console.error("Error loading teacher info:", err)
    }
  }

  /**
   * Cargar clases del profesor (incluyendo clases compartidas)
   */
  const loadTeacherClasses = async () => {
    try {
      if (!currentTeacherId.value) return []

      console.log(`🔍 Cargando clases para maestro: ${currentTeacherId.value}`)

      // Usar el método correcto del store
      const teacherClasses = await classesStore.fetchTeacherClasses(currentTeacherId.value)

      console.log(`📚 Clases del maestro cargadas: ${teacherClasses.length}`)

      if (teacherClasses.length > 0) {
        console.log(
          "📋 Clases encontradas:",
          teacherClasses.map((c) => ({
            id: c.id,
            nombre: c.nombre || c.name,
            instrumento: c.instrumento || c.instrument,
            nivel: c.nivel || c.level,
            alumnos: c.alumnos?.length || c.studentIds?.length || 0,
          }))
        )
      }

      return teacherClasses
    } catch (err) {
      console.error("❌ Error cargando clases del maestro:", err)
      throw err
    }
  }

  /**
   * Cargar estudiantes de las clases con sus datos de asistencia
   */
  const loadClassStudents = async (classes) => {
    try {
      // Asegurar que los estudiantes estén cargados
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents()
      }

      return classes.map((clase) => {
        // Obtener IDs de estudiantes (diferentes nombres de campo posibles)
        const studentIds = clase.alumnos || clase.studentIds || clase.students || []

        const students = studentIds
          .map((studentId) => {
            const student = studentsStore.students.find((s) => s.id === studentId)
            if (!student) {
              // Crear estudiante placeholder si no se encuentra
              return {
                id: studentId,
                name: "Estudiante Desconocido",
                email: "",
                attendance: {},
              }
            }

            return {
              id: student.id,
              name: `${student.nombre || "Estudiante"} ${student.apellido || ""}`.trim(),
              email: student.email || "",
              attendance: {}, // Se llenará con los datos de asistencia
            }
          })
          .filter(Boolean)

        // Determinar días de la semana de la clase
        const daySchedule = clase.schedule
          ? clase.schedule.slots?.map((slot) => {
              const dayMap = {
                domingo: 0,
                lunes: 1,
                martes: 2,
                miércoles: 3,
                jueves: 4,
                viernes: 5,
                sábado: 6,
              }
              return dayMap[slot.day?.toLowerCase()] || 0
            })
          : []

        return {
          id: clase.id,
          name: clase.nombre || clase.name || "Clase sin nombre",
          students,
          daySchedule,
          attendanceRecords: [], // Se llenará con los registros de asistencia
          observations: [], // Observaciones de la clase
        }
      })
    } catch (err) {
      console.error("Error loading class students:", err)
      return []
    }
  }

  /**
   * Cargar registros de asistencia para las clases
   */
  const loadAttendanceRecords = async (classesWithStudents) => {
    try {
      const {start, end} = actualDateRange.value
      if (!start || !end) return classesWithStudents

      // Cargar documentos de asistencia para el rango de fechas
      await attendanceStore.fetchAttendanceByDateRange(start, end, currentTeacherId.value)

      return classesWithStudents.map((classData) => {
        // Filtrar registros de asistencia para esta clase específica
        const classAttendanceRecords = attendanceStore.attendanceDocuments.filter((doc) => {
          const docDate = doc.fecha || doc.date || ""
          return doc.classId === classData.id && docDate >= start && docDate <= end
        })

        console.log(
          `📋 Clase ${classData.name}: ${classAttendanceRecords.length} registros de asistencia`
        )

        // Obtener fechas únicas con registros de asistencia
        const relevantDates = Array.from(
          new Set(classAttendanceRecords.map((doc) => doc.fecha || doc.date || ""))
        )
          .filter((date) => date)
          .sort()

        // Procesar asistencia para cada estudiante
        classData.students.forEach((student) => {
          // Inicializar attendance como objeto vacío
          student.attendance = {}

          // Procesar cada registro de asistencia
          classAttendanceRecords.forEach((doc) => {
            const date = doc.fecha || doc.date || ""
            if (!date) return

            // Determinar estado del estudiante para esta fecha
            let status = "absent" // Por defecto ausente

            const docData = doc.data || {}

            if (docData.presentes && docData.presentes.includes(student.id)) {
              status = "present"
            } else if (docData.tarde && docData.tarde.includes(student.id)) {
              status = "late"
            } else if (
              docData.justificacion &&
              docData.justificacion.some((j) => j.id === student.id)
            ) {
              status = "justified"
            } else if (docData.ausentes && docData.ausentes.includes(student.id)) {
              status = "absent"
            }

            student.attendance[date] = status
          })
        })

        // Procesar observaciones de la clase
        const observations = []
        classAttendanceRecords.forEach((doc) => {
          if (doc.data?.observations) {
            observations.push({
              date: doc.fecha || doc.date || "",
              text: doc.data.observations,
            })
          }
        })

        return {
          ...classData,
          attendanceRecords: classAttendanceRecords,
          observations,
          relevantDates,
        }
      })
    } catch (err) {
      console.error("Error loading attendance records:", err)
      return classesWithStudents
    }
  }

  /**
   * Actualizar datos del informe
   */
  const refreshData = async () => {
    try {
      loading.value = true
      error.value = null

      console.log("🔄 Iniciando carga de datos del informe...")

      // Validar ID del profesor
      if (!currentTeacherId.value) {
        throw new Error("ID de profesor no disponible")
      }

      // Validar rango de fechas
      const {start, end} = validateDateRange(actualDateRange.value.start, actualDateRange.value.end)
      console.log(`📆 Período: ${start} a ${end}`)

      // 1. Cargar información del profesor
      await loadTeacherInfo()

      // 2. Cargar clases del profesor
      const teacherClasses = await loadTeacherClasses()

      if (teacherClasses.length === 0) {
        console.warn("⚠️ No se encontraron clases para este profesor")
        reportData.classes = []
        reportData.dateRange = actualDateRange.value
        return
      }

      // 3. Cargar estudiantes de las clases
      const classesWithStudents = await loadClassStudents(teacherClasses)

      // 4. Cargar registros de asistencia
      const finalClassData = await loadAttendanceRecords(classesWithStudents)

      // 5. Actualizar datos del reporte
      reportData.classes = finalClassData
      reportData.dateRange = actualDateRange.value

      console.log("✅ Datos del informe cargados exitosamente")
      console.log("📊 Clases procesadas:", finalClassData.length)
      console.log("👥 Total estudiantes:", totalStudents.value)

      // Log detallado por clase
      finalClassData.forEach((classData) => {
        console.log(
          `📚 ${classData.name}: ${classData.students.length} estudiantes, ${classData.attendanceRecords.length} registros`
        )
      })
    } catch (err) {
      console.error("❌ Error al cargar datos del informe:", err)
      error.value = err.message || "Error al cargar los datos del informe"
    } finally {
      loading.value = false
    }
  }

  /**
   * Función alternativa usando el nuevo composable de datos de asistencia
   * Útil para casos más complejos o como fallback
   */
  const refreshDataAlternative = async () => {
    try {
      loading.value = true
      error.value = null

      console.log("🔄 Iniciando carga alternativa de datos del informe...")

      // Validar ID del profesor
      if (!currentTeacherId.value) {
        throw new Error("ID de profesor no disponible")
      }

      // Validar rango de fechas
      const {start, end} = validateDateRange(actualDateRange.value.start, actualDateRange.value.end)
      console.log(`📆 Período: ${start} a ${end}`)

      // 1. Cargar información del profesor
      await loadTeacherInfo()

      // 2. Usar el nuevo composable para cargar clases del profesor
      const teacherClasses = await attendanceData.loadTeacherClasses(currentTeacherId.value)

      if (teacherClasses.length === 0) {
        console.warn("⚠️ No se encontraron clases para este profesor")
        reportData.classes = []
        reportData.dateRange = actualDateRange.value
        return
      }

      // 3. Usar el nuevo composable para cargar datos de asistencia
      const attendanceRecords = await attendanceData.fetchAttendanceData(
        currentTeacherId.value,
        start,
        end
      )

      // 4. Procesar los datos usando ambos composables
      const processedClasses = await processClassesWithNewData(teacherClasses, attendanceRecords)

      // 5. Actualizar datos del reporte
      reportData.classes = processedClasses
      reportData.dateRange = actualDateRange.value

      console.log("✅ Datos del informe cargados exitosamente (método alternativo)")
      console.log("📊 Clases procesadas:", processedClasses.length)
      console.log("📄 Registros de asistencia:", attendanceRecords.length)
    } catch (err) {
      console.error("❌ Error cargando datos del informe (método alternativo):", err)
      error.value = err.message || "Error al cargar el informe"
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Procesar clases con los nuevos datos de asistencia
   */
  const processClassesWithNewData = async (teacherClasses, attendanceRecords) => {
    const {start, end} = actualDateRange.value

    return teacherClasses.map((classData) => {
      // Obtener estudiantes de la clase
      const classStudents = (classData.alumnos || []).map((studentData) => {
        const studentId = studentData.id || studentData.uid
        const studentInfo = studentsStore.students?.find(
          (s) => s.id === studentId || s.uid === studentId
        )

        return {
          id: studentId,
          name: studentInfo?.nombre || studentData.nombre || "Estudiante sin nombre",
          email: studentInfo?.email || studentData.email || "",
          attendance: {}, // Se llenará a continuación
        }
      })

      // Procesar asistencia usando el nuevo composable
      const attendanceByClass = attendanceData.attendanceByClass.value[classData.id] || []

      // Procesar cada documento de asistencia
      attendanceByClass.forEach((doc) => {
        const date = doc.fecha || doc.date
        if (!date || date < start || date > end) return

        const processedData = attendanceData.processAttendanceData(doc)

        // Asignar estados de asistencia a cada estudiante
        classStudents.forEach((student) => {
          if (!student.attendance[date]) {
            student.attendance[date] = "absent" // Por defecto
          }

          if (processedData.presentes.includes(student.id)) {
            student.attendance[date] = "present"
          } else if (processedData.tarde.includes(student.id)) {
            student.attendance[date] = "late"
          } else if (processedData.justificados.includes(student.id)) {
            student.attendance[date] = "justified"
          }
        })
      })

      return {
        ...classData,
        students: classStudents,
        observations: attendanceByClass
          .map((doc) => ({
            date: doc.fecha || doc.date,
            text: attendanceData.processAttendanceData(doc).observaciones,
          }))
          .filter((obs) => obs.text),
      }
    })
  }

  /**
   * Manejar cambio de período
   */
  const handlePeriodChange = async () => {
    await refreshData()
  }

  // =====================================
  // RETURN
  // =====================================

  return {
    // Estado
    loading,
    error,
    reportData,
    teacherInfo,

    // Filtros
    selectedPeriod,
    customDateRange,
    selectedPeriodText,
    actualDateRange,

    // Computed
    totalStudents,
    overviewStats,
    chartData,

    // Métodos principales
    refreshData,
    handlePeriodChange,

    // Funciones de utilidad
    processAttendanceData,
    countTotalStatus,
    calculateAttendancePercentage,
    getStudentJustification,
    validateDateRange,

    // Stores (para debugging)
    classesStore,
    studentsStore,
    attendanceStore,
    teachersStore,
  }
}
