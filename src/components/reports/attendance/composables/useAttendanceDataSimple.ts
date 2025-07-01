import {ref} from "vue"
import {useAttendanceStore} from "../../../../modulos/Attendance/store/attendance"
import {useClassesStore} from "../../../../modulos/Classes/store/classes"
import {useStudentsStore} from "../../../../modulos/Students/store/students"

/**
 * Composable SIMPLIFICADO para reportes de asistencia
 * Lógica simple: Maestro -> Clases -> Asistencias -> Estadísticas
 */
export function useAttendanceDataSimple() {
  const attendanceStore = useAttendanceStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()

  // Estado reactivo
  const loading = ref(false)
  const error = ref<string | null>(null)
  const teacherClasses = ref<any[]>([])
  const attendanceData = ref<any[]>([])

  /**
   * PASO 1: Obtener clases del maestro
   */
  const getTeacherClasses = async (teacherId: string) => {
    console.log(`🔍 Obteniendo clases del maestro: ${teacherId}`)

    // Cargar clases si no están cargadas
    if (!classesStore.classes || classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }

    // Filtrar clases del maestro (titular + compartidas)
    const allClasses = (classesStore.classes || []).filter((cls: any) => {
      // Es titular
      if (cls.teacherId === teacherId) return true

      // Es compartida
      if (cls.teachers && Array.isArray(cls.teachers)) {
        return cls.teachers.some((teacher: any) => {
          const tId = teacher.teacherId || teacher.id || teacher.uid
          return tId === teacherId
        })
      }

      return false
    })

    teacherClasses.value = allClasses
    console.log(`📚 Clases encontradas: ${allClasses.length}`)

    return allClasses
  }

  /**
   * PASO 2: Obtener asistencias del maestro en un rango de fechas
   */
  const getAttendanceRecords = async (teacherId: string, startDate: string, endDate: string) => {
    console.log(`📄 Obteniendo asistencias del ${startDate} al ${endDate}`)

    const records = await attendanceStore.fetchAttendanceDocumentsByTeacher(
      teacherId,
      startDate,
      endDate
    )
    attendanceData.value = records

    console.log(`📊 Registros de asistencia: ${records.length}`)
    return records
  }

  /**
   * PASO 3: Procesar estadísticas por clase
   */
  const getClassStatistics = (classId: string, attendanceRecords: any[]) => {
    const classRecords = attendanceRecords.filter((record) => record.classId === classId)

    let totalPresent = 0
    let totalAbsent = 0
    let totalLate = 0
    let totalJustified = 0
    const totalSessions = classRecords.length

    classRecords.forEach((record) => {
      const data = record.data || {}

      if (data.presentes) totalPresent += data.presentes.length
      if (data.ausentes) totalAbsent += data.ausentes.length
      if (data.tarde) totalLate += data.tarde.length
      if (data.justificacion) totalJustified += data.justificacion.length
    })

    return {
      classId,
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalJustified,
      attendanceRate:
        totalSessions > 0
          ? Math.round((totalPresent / (totalPresent + totalAbsent + totalLate)) * 100)
          : 0,
    }
  }

  /**
   * FUNCIÓN PRINCIPAL: Generar reporte completo
   */
  const generateReport = async (teacherId: string, startDate: string, endDate: string) => {
    try {
      loading.value = true
      error.value = null

      console.log(`📋 Generando reporte para maestro: ${teacherId}`)
      console.log(`📅 Período: ${startDate} a ${endDate}`)

      // 1. Obtener clases del maestro
      const classes = await getTeacherClasses(teacherId)

      if (classes.length === 0) {
        console.warn("⚠️ No se encontraron clases para este maestro")
        return {classes: [], statistics: []}
      }

      // 2. Obtener asistencias
      const attendance = await getAttendanceRecords(teacherId, startDate, endDate)

      // 3. Procesar estadísticas por clase
      const statistics = classes.map((cls) => {
        const stats = getClassStatistics(cls.id, attendance)
        return {
          ...cls,
          statistics: stats,
        }
      })

      console.log("✅ Reporte generado exitosamente")

      return {
        classes: statistics,
        totalClasses: classes.length,
        totalSessions: attendance.length,
      }
    } catch (err) {
      console.error("❌ Error generando reporte:", err)
      error.value = err instanceof Error ? err.message : "Error generando reporte"
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    loading,
    error,
    teacherClasses,
    attendanceData,

    // Métodos
    generateReport,
    getTeacherClasses,
    getAttendanceRecords,
    getClassStatistics,

    // Stores
    attendanceStore,
    classesStore,
    studentsStore,
  }
}
