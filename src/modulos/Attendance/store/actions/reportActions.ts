// Archivo para acciones relacionadas con la generación de reportes y cálculos analíticos
import {parseISO, isValid, format} from "date-fns"
import {useClassesStore} from "../../../Classes/store/classes" // Ajustar ruta
// import { useStudentsStore } from '../../../Students/store/students'; // Ajustar ruta, si se reactiva

import type {
  AttendanceDocument,
  AttendanceRecord,
  AttendanceAnalytics,
} from "../../types/attendance"
import type {ClassData as Class} from "../../../Classes/types/class" // Corrected import path and type
// import type { Student } from '../../../Students/types'; // Ajustar ruta y tipo

// Define un tipo para la instancia del store de Pinia (contexto de this)
// Esto ayuda con la seguridad de tipos al acceder a `this.property` o `this.action()`
export interface AttendanceStoreState {
  // Added export
  isLoading: boolean
  error: string | null
  attendanceDocuments: AttendanceDocument[]
  records: AttendanceRecord[] // Usado por calculateAbsentStudents
  analytics: AttendanceAnalytics | null
  // Acciones de otros grupos pueden ser necesarias si los reportes dependen de ellas
  fetchAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]>
  fetchAttendanceRecords(params: {
    classId?: string
    startDate: string | Date
    endDate?: string | Date
  }): Promise<Record<string, string>>
}

// Tipo para las entradas de detalles del reporte
interface ReportDetailEntry {
  date: string
  studentId: string
  studentName?: string // Opcional: si se integran los nombres de los estudiantes
  classId: string
  className?: string
  status: string // Tipo AttendanceStatus podría ser importado si se necesita más especificidad
  justification?: string
}

// Tipo para la estructura general del reporte
export interface AttendanceReport {
  // Added export
  parameters: {
    startDate: string
    endDate: string
    classId: string
    className: string
    studentId: string
  }
  summary: {
    totalClassInstancesInScope: number
    totalAttendanceRecords: number
    presentCount: number
    absentCount: number
    tardyCount: number
    justifiedCount: number // Conteo del estado Justificado
    overallAttendanceRate: number
  }
  details: ReportDetailEntry[]
}

export interface AbsentStudentInfo {
  // Added export
  studentId: string
  absences: number
  lastAttendance: string // Cadena de fecha
  totalClasses: number
  attendedClasses: number
  attendanceRate: number
}

async function generateReport(
  this: AttendanceStoreState,
  params: {classId?: string; studentId?: string; startDate: string; endDate: string}
): Promise<AttendanceReport> {
  this.isLoading = true
  this.error = null

  try {
    const {classId, studentId, startDate, endDate} = params

    if (!isValid(parseISO(startDate)) || !isValid(parseISO(endDate))) {
      throw new Error("Fechas de inicio o fin inválidas.")
    }

    // 1. Obtener datos de asistencia relevantes y información relacionada
    const classesStore = useClassesStore()
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses() // Asegurarse de que las clases estén cargadas
    }
    const classNameMap = new Map(classesStore.classes.map((c: Class) => [c.id, c.name]))

    // 2. Filtrar documentos según los parámetros
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    const filteredDocs = this.attendanceDocuments.filter((doc) => {
      const docDate = parseISO(doc.fecha)
      if (!isValid(docDate) || docDate < start || docDate > end) {
        return false
      }
      if (classId && doc.classId !== classId) {
        return false
      }
      return true
    })

    // 3. Procesar datos filtrados para construir los detalles del reporte
    const reportDetails: ReportDetailEntry[] = []
    let presentCount = 0
    let absentCount = 0
    let tardyCount = 0
    let justifiedCount = 0
    const uniqueClassDays = new Set<string>() // Para contar días de clase únicos en el alcance

    filteredDocs.forEach((doc) => {
      uniqueClassDays.add(`${doc.fecha}_${doc.classId}`)
      const docData = doc.data || {presentes: [], ausentes: [], tarde: [], justificacion: []}
      const justificationsMap = new Map((docData.justificacion || []).map((j) => [j.id, j.reason]))

      const processStudentList = (studentIds: string[], status: string) => {
        studentIds.forEach((sId) => {
          if (studentId && sId !== studentId) return // Filtrar por estudiante específico si se proporciona

          let currentStatus = status
          const justificationText = justificationsMap.get(sId)

          if (justificationText && (status === "Ausente" || status === "Tardanza")) {
            currentStatus = "Justificado"
          }

          reportDetails.push({
            date: doc.fecha,
            studentId: sId,
            // studentName: studentNameMap.get(sId) || 'N/A', // Descomentar si se usan los nombres de los estudiantes
            classId: doc.classId,
            className: classNameMap.get(doc.classId) || doc.classId,
            status: currentStatus,
            justification: justificationText,
          })

          if (currentStatus === "Presente") presentCount++
          else if (currentStatus === "Ausente") absentCount++
          else if (currentStatus === "Tardanza") tardyCount++
          else if (currentStatus === "Justificado") justifiedCount++
        })
      }

      processStudentList(docData.presentes || [], "Presente")
      processStudentList(docData.ausentes || [], "Ausente")
      processStudentList(docData.tarde || [], "Tardanza")
    })

    // 4. Calcular estadísticas resumidas
    const totalRecordsProcessed = reportDetails.length
    const attendedCount = presentCount + justifiedCount // 'Presente' + 'Justificado' se consideran asistidos para la tasa
    const attendanceRate =
      totalRecordsProcessed > 0 ? (attendedCount / totalRecordsProcessed) * 100 : 0

    // 5. Estructurar el objeto de reporte final
    const report: AttendanceReport = {
      parameters: {
        startDate,
        endDate,
        classId: classId || "Todas",
        className: classId ? classNameMap.get(classId) || classId : "Todas las Clases",
        studentId: studentId || "Todos",
      },
      summary: {
        totalClassInstancesInScope: uniqueClassDays.size,
        totalAttendanceRecords: totalRecordsProcessed,
        presentCount,
        absentCount,
        tardyCount,
        justifiedCount,
        overallAttendanceRate: parseFloat(attendanceRate.toFixed(2)),
      },
      details: reportDetails.sort((a, b) => {
        if (a.date < b.date) return -1
        if (a.date > b.date) return 1
        if (a.className && b.className && a.className < b.className) return -1
        if (a.className && b.className && a.className > b.className) return 1
        return 0
      }),
    }

    return report
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error = `Error al generar el reporte: ${errorMessage}`
    console.error("Error generating attendance report:", error)
    throw error
  } finally {
    this.isLoading = false
  }
}

async function calculateAbsentStudents(
  this: AttendanceStoreState,
  params: {startDate: string; endDate: string; classId?: string; limit?: number}
): Promise<AbsentStudentInfo[]> {
  this.isLoading = true
  this.error = null
  try {
    const {startDate, endDate, classId, limit = 15} = params

    if (!startDate || !endDate) {
      throw new Error("Se requieren fechas de inicio y fin para calcular ausencias.")
    }
    if (!isValid(parseISO(startDate)) || !isValid(parseISO(endDate))) {
      throw new Error("Fechas inválidas.")
    }

    // Asegurarse de que los registros para el rango de fechas estén cargados.
    await this.fetchAttendanceByDateRange(startDate, endDate)

    const filteredRecords = classId
      ? this.records.filter(
          (record) =>
            record.classId === classId && record.Fecha >= startDate && record.Fecha <= endDate
        )
      : this.records.filter((record) => record.Fecha >= startDate && record.Fecha <= endDate)

    const absencesByStudent: Record<
      string,
      {count: number; lastDate: string; totalClasses: number; attendedClasses: number}
    > = {}

    filteredRecords.forEach((record) => {
      if (!absencesByStudent[record.studentId]) {
        absencesByStudent[record.studentId] = {
          count: 0,
          lastDate: "",
          totalClasses: 0,
          attendedClasses: 0,
        }
      }
      absencesByStudent[record.studentId].totalClasses++

      if (record.status === "Ausente") {
        // Estrictamente 'Ausente', no 'Justificado'
        absencesByStudent[record.studentId].count++
        // Actualizar lastDate si esta ausencia es más reciente que la última fecha registrada
      } else if (record.status === "Presente" || record.status === "Tardanza") {
        absencesByStudent[record.studentId].attendedClasses++
        if (
          !absencesByStudent[record.studentId].lastDate ||
          record.Fecha > absencesByStudent[record.studentId].lastDate
        ) {
          absencesByStudent[record.studentId].lastDate = record.Fecha
        }
      }
      // 'Justificado' cuenta como una clase asistida para la tasa, pero no para el conteo de ausencias aquí.
      else if (record.status === "Justificado") {
        absencesByStudent[record.studentId].attendedClasses++
        if (
          !absencesByStudent[record.studentId].lastDate ||
          record.Fecha > absencesByStudent[record.studentId].lastDate
        ) {
          absencesByStudent[record.studentId].lastDate = record.Fecha
        }
      }
    })

    const result = Object.entries(absencesByStudent)
      .map(([studentId, data]) => ({
        studentId,
        absences: data.count,
        lastAttendance: data.lastDate, // Esta es la última fecha de presencia/tardanza/justificación
        totalClasses: data.totalClasses,
        attendedClasses: data.attendedClasses,
        attendanceRate:
          data.totalClasses > 0 ? (data.attendedClasses / data.totalClasses) * 100 : 0,
      }))
      .sort((a, b) => b.absences - a.absences || a.attendanceRate - b.attendanceRate) // Ordenar por ausencias, luego por tasa

    return result.slice(0, limit)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error = `Error al calcular estudiantes ausentes: ${errorMessage}`
    console.error("Error al calcular estudiantes ausentes:", error)
    return []
  } finally {
    this.isLoading = false
  }
}

async function generateProfessionalReport(
  this: AttendanceStoreState,
  params: {classId?: string; studentId?: string; startDate: string; endDate: string}
): Promise<any[]> {
  // El tipo de retorno coincide con el original, aunque es mejor una interfaz específica
  this.isLoading = true
  this.error = null
  try {
    const {classId, studentId, startDate, endDate} = params

    if (!isValid(parseISO(startDate)) || (endDate && !isValid(parseISO(endDate)))) {
      throw new Error("Fechas inválidas proporcionadas para el reporte.")
    }

    // Esta acción en el store original usó `fetchAttendanceRecords` que a su vez usó `fetchAttendanceByClassAndDate`.
    // `fetchAttendanceByClassAndDate` pobla `this.attendanceRecords` (un mapa para la visualización de UI para un solo día).
    // Para un reporte profesional sobre un rango, es mejor usar `fetchAttendanceByDateRange` para obtener todos los elementos `AttendanceRecord`.

    await this.fetchAttendanceByDateRange(startDate, endDate) // Asegurarse de que `this.records` esté poblado para el rango.

    let filteredRecords = this.records.filter((r) => r.Fecha >= startDate && r.Fecha <= endDate)

    if (classId) {
      filteredRecords = filteredRecords.filter((record) => record.classId === classId)
    }
    if (studentId) {
      filteredRecords = filteredRecords.filter((record) => record.studentId === studentId)
    }

    const reportData = filteredRecords.map((record: AttendanceRecord) => {
      let justificationText = ""
      if (record.justification) {
        justificationText =
          typeof record.justification === "string" // No debería ocurrir con el tipo JustificationData
            ? record.justification
            : record.justification.reason || ""
      }
      return {
        studentId: record.studentId,
        status: record.status,
        date: record.Fecha,
        classId: record.classId,
        justification: justificationText,
        // Potencialmente agregar className, studentName aquí si se integran los stores
      }
    })

    return reportData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error = `Error al generar el reporte profesional: ${errorMessage}`
    console.error("Error generating professional report:", error)
    throw error
  } finally {
    this.isLoading = false
  }
}

async function updateAnalytics(this: AttendanceStoreState): Promise<void> {
  this.isLoading = true
  this.error = null
  try {
    // Definir un rango de fechas predeterminado para las analíticas si no se proporciona (por ejemplo, últimos 30 días)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)

    const formattedStartDate = format(startDate, "yyyy-MM-dd")
    const formattedEndDate = format(endDate, "yyyy-MM-dd")

    // Asegurarse de que los registros estén cargados para el período de analíticas
    await this.fetchAttendanceByDateRange(formattedStartDate, formattedEndDate)

    const recordsForAnalytics = this.records.filter(
      (r) => r.Fecha >= formattedStartDate && r.Fecha <= formattedEndDate
    )

    if (recordsForAnalytics.length === 0) {
      this.analytics = {
        dateRange: `${formattedStartDate} to ${formattedEndDate}`,
        totalClasses: 0,
        averageAttendance: 0,
        trends: [],
        studentPerformance: [],
      }
      return
    }

    const dailyStats: Record<
      string,
      {present: number; absent: number; tardy: number; justified: number; total: number}
    > = {}
    const studentAttendance: Record<
      string,
      {present: number; absent: number; tardy: number; justified: number; totalClasses: number}
    > = {}
    const uniqueClassInstances = new Set<string>() // Para contar pares únicos de classId-fecha

    recordsForAnalytics.forEach((record) => {
      const dayKey = record.Fecha
      uniqueClassInstances.add(`${record.Fecha}_${record.classId}`)

      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = {present: 0, absent: 0, tardy: 0, justified: 0, total: 0}
      }
      dailyStats[dayKey].total++

      if (!studentAttendance[record.studentId]) {
        studentAttendance[record.studentId] = {
          present: 0,
          absent: 0,
          tardy: 0,
          justified: 0,
          totalClasses: 0,
        }
      }
      studentAttendance[record.studentId].totalClasses++

      switch (record.status) {
        case "Presente":
          dailyStats[dayKey].present++
          studentAttendance[record.studentId].present++
          break
        case "Ausente":
          dailyStats[dayKey].absent++
          studentAttendance[record.studentId].absent++
          break
        case "Tardanza":
          dailyStats[dayKey].tardy++
          studentAttendance[record.studentId].tardy++
          break
        case "Justificado":
          dailyStats[dayKey].justified++
          studentAttendance[record.studentId].justified++
          // Para el promedio de asistencia, Justificado a menudo cuenta como presente
          dailyStats[dayKey].present++ // O manejar esto en el cálculo de promedio
          studentAttendance[record.studentId].present++ // O manejar esto en el cálculo de promedio
          break
      }
    })

    const trends = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        present: stats.present + stats.justified, // Combinar para la línea de tendencia si se desea
        absent: stats.absent, // Estrictamente ausente
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    let totalPresentOrJustified = 0
    let totalStudentsTrackedForAvg = 0
    Object.values(dailyStats).forEach((stats) => {
      totalPresentOrJustified += stats.present + stats.justified
      totalStudentsTrackedForAvg += stats.total
    })
    const averageAttendance =
      totalStudentsTrackedForAvg > 0
        ? (totalPresentOrJustified / totalStudentsTrackedForAvg) * 100
        : 0

    const studentPerformance = Object.entries(studentAttendance).map(([studentId, stats]) => {
      const attended = stats.present + stats.justified + stats.tardy // O definir 'asistido' según los requisitos
      const rate = stats.totalClasses > 0 ? (attended / stats.totalClasses) * 100 : 0
      return {
        studentId,
        attendanceRate: parseFloat(rate.toFixed(2)),
      }
    })

    this.analytics = {
      dateRange: `${formattedStartDate} to ${formattedEndDate}`,
      totalClasses: uniqueClassInstances.size, // Total de sesiones de clase únicas
      averageAttendance: parseFloat(averageAttendance.toFixed(2)),
      trends,
      studentPerformance: studentPerformance as any, // Casting necesario si falta lastObservation y el tipo lo espera
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error = `Error al actualizar analíticas: ${errorMessage}`
    console.error("Error updating analytics:", error)
    this.analytics = null
  } finally {
    this.isLoading = false
  }
}

export const reportActions = {
  generateReport,
  calculateAbsentStudents,
  generateProfessionalReport,
  updateAnalytics,
}
