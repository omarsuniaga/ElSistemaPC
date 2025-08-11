import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceStateStore } from './attendanceState'
import { useAttendanceActionsStore } from './attendanceActions'

export interface StudentAttendanceReport {
  studentId: string
  studentName: string
  totalClasses: number
  presences: number
  absences: number
  tardiness: number
  justified: number
  attendanceRate: number
  observations: string[]
}

export interface ClassAttendanceReport {
  classId: string
  className: string
  totalSessions: number
  completedSessions: number
  averageAttendance: number
  studentsReport: StudentAttendanceReport[]
}

export interface PeriodReport {
  startDate: string
  endDate: string
  totalClasses: number
  totalSessions: number
  completionRate: number
  classesReport: ClassAttendanceReport[]
}

export interface AttendanceMetrics {
  totalStudents: number
  averageAttendanceRate: number
  mostAttendedClass: string
  leastAttendedClass: string
  studentsAtRisk: string[]
  perfectAttendance: string[]
}

/**
 * Store para reportes y métricas de asistencia
 * Maneja la generación de reportes y análisis de datos
 */
export const useAttendanceReportsStore = defineStore('attendanceReports', () => {
  const stateStore = useAttendanceStateStore()
  const actionsStore = useAttendanceActionsStore()

  // Estado para reportes
  const currentReport = ref<PeriodReport | null>(null)
  const reportLoading = ref(false)
  const reportError = ref<string | null>(null)
  const reportCache = ref<Record<string, PeriodReport>>({})

  // Computed properties para métricas
  const currentMetrics = computed((): AttendanceMetrics | null => {
    if (!currentReport.value) return null

    const report = currentReport.value
    const allStudents = new Set<string>()
    const studentRates: Record<string, number> = {}
    const classAttendanceRates: Record<string, number> = {}

    // Recopilar datos de estudiantes y clases
    report.classesReport.forEach(classReport => {
      classAttendanceRates[classReport.classId] = classReport.averageAttendance
      
      classReport.studentsReport.forEach(studentReport => {
        allStudents.add(studentReport.studentId)
        studentRates[studentReport.studentId] = studentReport.attendanceRate
      })
    })

    // Calcular métricas
    const rates = Object.values(studentRates)
    const averageAttendanceRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0

    // Encontrar clases con mejor y peor asistencia
    const classEntries = Object.entries(classAttendanceRates)
    const mostAttendedClass = classEntries.reduce((max, [classId, rate]) => 
      rate > (classAttendanceRates[max] || 0) ? classId : max, ''
    )
    const leastAttendedClass = classEntries.reduce((min, [classId, rate]) => 
      rate < (classAttendanceRates[min] || 100) ? classId : min, ''
    )

    // Estudiantes en riesgo (asistencia < 70%)
    const studentsAtRisk = Object.entries(studentRates)
      .filter(([_, rate]) => rate < 70)
      .map(([studentId]) => studentId)

    // Estudiantes con asistencia perfecta (100%)
    const perfectAttendance = Object.entries(studentRates)
      .filter(([_, rate]) => rate === 100)
      .map(([studentId]) => studentId)

    return {
      totalStudents: allStudents.size,
      averageAttendanceRate,
      mostAttendedClass,
      leastAttendedClass,
      studentsAtRisk,
      perfectAttendance
    }
  })

  /**
   * Generar reporte de asistencia para un período
   */
  const generatePeriodReport = async (startDate: string, endDate: string, classIds?: string[]) => {
    try {
      reportLoading.value = true
      reportError.value = null

      const cacheKey = `${startDate}_${endDate}_${classIds?.join(',') || 'all'}`
      
      // Verificar cache
      if (reportCache.value[cacheKey]) {
        currentReport.value = reportCache.value[cacheKey]
        return currentReport.value
      }

      // Obtener estadísticas del período
      const stats = await actionsStore.getAttendanceStats(startDate, endDate)
      const records = stats.records

      // Agrupar por clase
      const classesByClassId: Record<string, any[]> = {}
      records.forEach(record => {
        if (!classesByClassId[record.classId]) {
          classesByClassId[record.classId] = []
        }
        classesByClassId[record.classId].push(record)
      })

      // Generar reporte por clase
      const classesReport: ClassAttendanceReport[] = []
      
      for (const [classId, classRecords] of Object.entries(classesByClassId)) {
        if (classIds && !classIds.includes(classId)) continue

        const studentsData: Record<string, {
          presences: number
          absences: number
          tardiness: number
          justified: number
          observations: string[]
        }> = {}

        // Procesar registros de la clase
        classRecords.forEach(record => {
          // Procesar presentes
          record.data.presentes?.forEach(studentId => {
            if (!studentsData[studentId]) {
              studentsData[studentId] = { presences: 0, absences: 0, tardiness: 0, justified: 0, observations: [] }
            }
            studentsData[studentId].presences++
          })

          // Procesar ausentes
          record.data.ausentes?.forEach(studentId => {
            if (!studentsData[studentId]) {
              studentsData[studentId] = { presences: 0, absences: 0, tardiness: 0, justified: 0, observations: [] }
            }
            studentsData[studentId].absences++
          })

          // Procesar tardanzas
          record.data.tarde?.forEach(studentId => {
            if (!studentsData[studentId]) {
              studentsData[studentId] = { presences: 0, absences: 0, tardiness: 0, justified: 0, observations: [] }
            }
            studentsData[studentId].tardiness++
          })

          // Procesar justificaciones
          record.data.justificacion?.forEach(justification => {
            const studentId = justification.studentId
            if (!studentsData[studentId]) {
              studentsData[studentId] = { presences: 0, absences: 0, tardiness: 0, justified: 0, observations: [] }
            }
            studentsData[studentId].justified++
          })

          // Agregar observaciones
          if (record.observations) {
            Object.keys(studentsData).forEach(studentId => {
              studentsData[studentId].observations.push(record.observations!)
            })
          }
        })

        // Crear reporte de estudiantes
        const studentsReport: StudentAttendanceReport[] = Object.entries(studentsData).map(([studentId, data]) => {
          const totalClasses = data.presences + data.absences + data.tardiness + data.justified
          const attendanceRate = totalClasses > 0 ? (data.presences / totalClasses) * 100 : 0

          return {
            studentId,
            studentName: `Estudiante ${studentId}`, // TODO: Obtener nombre real
            totalClasses,
            presences: data.presences,
            absences: data.absences,
            tardiness: data.tardiness,
            justified: data.justified,
            attendanceRate,
            observations: data.observations
          }
        })

        // Calcular promedio de asistencia de la clase
        const averageAttendance = studentsReport.length > 0 
          ? studentsReport.reduce((sum, student) => sum + student.attendanceRate, 0) / studentsReport.length
          : 0

        classesReport.push({
          classId,
          className: `Clase ${classId}`, // TODO: Obtener nombre real
          totalSessions: classRecords.length,
          completedSessions: classRecords.filter(r => 
            r.data.presentes?.length || r.data.ausentes?.length || r.data.tarde?.length
          ).length,
          averageAttendance,
          studentsReport
        })
      }

      // Crear reporte final
      const report: PeriodReport = {
        startDate,
        endDate,
        totalClasses: Object.keys(classesByClassId).length,
        totalSessions: records.length,
        completionRate: stats.completionRate,
        classesReport
      }

      // Guardar en cache
      reportCache.value[cacheKey] = report
      currentReport.value = report

      return report
    } catch (error) {
      console.error('Error generating period report:', error)
      reportError.value = 'Error al generar el reporte del período'
      throw error
    } finally {
      reportLoading.value = false
    }
  }

  /**
   * Generar reporte semanal
   */
  const generateWeeklyReport = async (date: Date, classIds?: string[]) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    
    const startDate = format(weekStart, 'yyyy-MM-dd')
    const endDate = format(weekEnd, 'yyyy-MM-dd')
    
    return generatePeriodReport(startDate, endDate, classIds)
  }

  /**
   * Generar reporte mensual
   */
  const generateMonthlyReport = async (date: Date, classIds?: string[]) => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    
    const startDate = format(monthStart, 'yyyy-MM-dd')
    const endDate = format(monthEnd, 'yyyy-MM-dd')
    
    return generatePeriodReport(startDate, endDate, classIds)
  }

  /**
   * Exportar reporte a PDF
   */
  const exportReportToPDF = async (report: PeriodReport) => {
    try {
      // TODO: Implementar exportación a PDF
      console.log('Exportando reporte a PDF:', report)
      
      // Placeholder para la implementación real
      const pdfData = {
        title: `Reporte de Asistencia - ${report.startDate} a ${report.endDate}`,
        data: report,
        generatedAt: new Date().toISOString()
      }
      
      return pdfData
    } catch (error) {
      console.error('Error exporting report to PDF:', error)
      throw error
    }
  }

  /**
   * Enviar reporte por email
   */
  const sendReportByEmail = async (report: PeriodReport, recipients: string[]) => {
    try {
      // TODO: Implementar envío por email
      console.log('Enviando reporte por email:', { report, recipients })
      
      // Placeholder para la implementación real
      return {
        success: true,
        message: 'Reporte enviado exitosamente',
        recipients
      }
    } catch (error) {
      console.error('Error sending report by email:', error)
      throw error
    }
  }

  /**
   * Obtener tendencias de asistencia
   */
  const getAttendanceTrends = (report: PeriodReport) => {
    const trends = {
      byClass: {} as Record<string, number[]>,
      byStudent: {} as Record<string, number[]>,
      overall: [] as number[]
    }

    // TODO: Implementar análisis de tendencias
    
    return trends
  }

  /**
   * Limpiar cache de reportes
   */
  const clearReportCache = () => {
    reportCache.value = {}
  }

  return {
    // Estado
    currentReport,
    reportLoading,
    reportError,
    reportCache,

    // Computed
    currentMetrics,

    // Acciones
    generatePeriodReport,
    generateWeeklyReport,
    generateMonthlyReport,
    exportReportToPDF,
    sendReportByEmail,
    getAttendanceTrends,
    clearReportCache
  }
})
