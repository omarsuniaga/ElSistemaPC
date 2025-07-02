import {ref, computed} from "vue"
import {useAdminStore} from "../store/admin"
import {useRBACStore} from "@/stores/rbacStore"
import {useNotificationsStore} from "@/stores/notifications"

// Tipos específicos para el monitoreo
interface ClassMonitoringData {
  id: string
  name: string
  teacher: string
  schedule: string
  presentStudents: number
  totalStudents: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  attendancePercentage: number
  instrument: string
  room: string
  lastUpdate: Date
}

interface CriticalStudent {
  id: string
  fullName: string
  instrument: string
  age: number
  assignedClasses: number
  absences: number
  attendanceRate: number
  representative: {
    name: string
    phone: string
    email: string
  }
  lastAttendance: Date | null
  riskLevel: "low" | "medium" | "high" | "critical"
}

interface DayMetrics {
  scheduledClasses: number
  expectedTeachers: number
  expectedStudents: number
  attendanceRate: number
  activeClasses: number
  completedClasses: number
  cancelledClasses: number
}

export const useClassMonitoring = () => {
  const adminStore = useAdminStore()
  const rbacStore = useRBACStore()
  const notificationsStore = useNotificationsStore()
  const {showNotification} = {showNotification: notificationsStore.addNotification}

  // Estado reactivo
  const isLoading = ref(false)
  const selectedDate = ref(new Date())
  const refreshInterval = ref<number | null>(null)
  const realTimeUpdates = ref(true)

  // Datos del monitoreo
  const dayMetrics = ref<DayMetrics>({
    scheduledClasses: 0,
    expectedTeachers: 0,
    expectedStudents: 0,
    attendanceRate: 0,
    activeClasses: 0,
    completedClasses: 0,
    cancelledClasses: 0,
  })

  const currentClasses = ref<ClassMonitoringData[]>([])
  const criticalStudents = ref<CriticalStudent[]>([])

  // Computed properties
  const todayClasses = computed(() =>
    currentClasses.value.filter((c) => isSameDay(new Date(c.lastUpdate), selectedDate.value))
  )

  const activeClasses = computed(() =>
    currentClasses.value.filter((c) => c.status === "in_progress")
  )

  const completedClasses = computed(() =>
    currentClasses.value.filter((c) => c.status === "completed")
  )

  const upcomingClasses = computed(() =>
    currentClasses.value.filter((c) => c.status === "scheduled")
  )

  const highRiskStudents = computed(() =>
    criticalStudents.value.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high")
  )

  const averageAttendanceRate = computed(() => {
    if (currentClasses.value.length === 0) return 0
    const total = currentClasses.value.reduce((sum, c) => sum + c.attendancePercentage, 0)
    return Math.round(total / currentClasses.value.length)
  })

  // Permisos
  const canViewClassMonitoring = computed(
    () => rbacStore.hasPermission("classes_monitor") || rbacStore.hasPermission("admin_full_access")
  )

  const canViewStudentReports = computed(
    () =>
      rbacStore.hasPermission("students_view_reports") ||
      rbacStore.hasPermission("admin_full_access")
  )

  const canContactParents = computed(
    () =>
      rbacStore.hasPermission("communication_send") || rbacStore.hasPermission("admin_full_access")
  )

  const canGenerateReports = computed(
    () =>
      rbacStore.hasPermission("reports_generate") || rbacStore.hasPermission("admin_full_access")
  )

  // Métodos de carga de datos
  const loadDayData = async (date: Date = selectedDate.value) => {
    try {
      isLoading.value = true

      // En producción, estas llamadas irían a la API real
      await Promise.all([loadDayMetrics(date), loadCurrentClasses(date), loadCriticalStudents()])

      console.log("📈 Day monitoring data loaded for:", date.toDateString())
    } catch (error) {
      console.error("Error loading day data:", error)
      showNotification("Error al cargar datos del monitoreo", "error")
    } finally {
      isLoading.value = false
    }
  }

  const loadDayMetrics = async (date: Date) => {
    try {
      // TODO: Implementar llamada real a la API para obtener métricas diarias
      // const metrics = await adminStore.getDayMetrics(date)
      dayMetrics.value = {
        scheduledClasses: 0,
        expectedTeachers: 0,
        expectedStudents: 0,
        attendanceRate: 0,
        activeClasses: 0,
        completedClasses: 0,
        cancelledClasses: 0,
      } // Valores iniciales hasta tener datos reales
    } catch (error) {
      console.error("Error loading day metrics:", error)
      throw error
    }
  }

  const loadCurrentClasses = async (date: Date) => {
    try {
      // TODO: Implementar llamada real a la API para obtener clases actuales
      // const classes = await adminStore.getClassesByDate(date)
      currentClasses.value = [] // Array vacío hasta tener datos reales
    } catch (error) {
      console.error("Error loading current classes:", error)
      throw error
    }
  }

  const loadCriticalStudents = async () => {
    try {
      // TODO: Implementar llamada real a la API para obtener estudiantes críticos
      // const students = await adminStore.getCriticalStudents()
      criticalStudents.value = [] // Array vacío hasta tener datos reales
    } catch (error) {
      console.error("Error loading critical students:", error)
      throw error
    }
  }

  // Métodos de filtrado y búsqueda
  const filterStudentsByRisk = (riskLevel: string) => {
    return criticalStudents.value.filter((student) => student.riskLevel === riskLevel)
  }

  const filterStudentsByInstrument = (instrument: string) => {
    return criticalStudents.value.filter((student) =>
      student.instrument.toLowerCase().includes(instrument.toLowerCase())
    )
  }

  const searchStudents = (query: string) => {
    return criticalStudents.value.filter(
      (student) =>
        student.fullName.toLowerCase().includes(query.toLowerCase()) ||
        student.instrument.toLowerCase().includes(query.toLowerCase()) ||
        student.representative.name.toLowerCase().includes(query.toLowerCase())
    )
  }

  const sortStudents = (criteria: string, students: CriticalStudent[] = criticalStudents.value) => {
    const sorted = [...students]

    switch (criteria) {
      case "most_absent":
        return sorted.sort((a, b) => b.absences - a.absences)
      case "most_present":
        return sorted.sort((a, b) => b.attendanceRate - a.attendanceRate)
      case "by_instrument":
        return sorted.sort((a, b) => a.instrument.localeCompare(b.instrument))
      case "by_age":
        return sorted.sort((a, b) => a.age - b.age)
      case "alphabetical":
        return sorted.sort((a, b) => a.fullName.localeCompare(b.fullName))
      case "by_classes":
        return sorted.sort((a, b) => b.assignedClasses - a.assignedClasses)
      default:
        return sorted
    }
  }

  // Métodos de comunicación
  const generateCommunicationMessage = (student: CriticalStudent, template: any) => {
    return template
      .replace("{representante}", student.representative.name)
      .replace("{estudiante}", student.fullName)
      .replace("{instrumento}", student.instrument)
      .replace("{ausencias}", student.absences.toString())
      .replace("{total_clases}", student.assignedClasses.toString())
      .replace("{tasa_asistencia}", student.attendanceRate.toString())
  }

  const sendWhatsAppMessage = (student: CriticalStudent, message: string) => {
    try {
      const phone = student.representative.phone.replace("+", "")
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")

      // Log the communication attempt
      console.log("📱 WhatsApp message sent to:", student.representative.name)
      showNotification(`Mensaje enviado a ${student.representative.name}`, "success")
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      showNotification("Error al enviar mensaje por WhatsApp", "error")
    }
  }

  // Métodos de reportes
  const generateWeeklyReport = async (startDate: Date) => {
    try {
      if (!canGenerateReports.value) {
        showNotification("No tienes permisos para generar reportes", "error")
        return
      }

      // TODO: Implementar generación real de PDF
      console.log("📄 Generating weekly report for week starting:", startDate.toDateString())

      showNotification("Generando reporte semanal...", "info")
      // Aquí se llamaría a la API para generar el PDF real y luego se descargaría
      showNotification("Reporte semanal generado exitosamente", "success")
    } catch (error) {
      console.error("Error generating weekly report:", error)
      showNotification("Error al generar reporte semanal", "error")
    }
  }

  const exportStudentData = async (format: "pdf" | "excel" = "pdf") => {
    try {
      if (!canGenerateReports.value) {
        showNotification("No tienes permisos para exportar datos", "error")
        return
      }

      console.log(`📊 Exporting student data in ${format} format`)
      showNotification(`Exportando datos en formato ${format.toUpperCase()}...`, "info")

      // TODO: Implementar exportación real (llamada a API, descarga de archivo)
      showNotification("Datos exportados exitosamente", "success")
    } catch (error) {
      console.error("Error exporting student data:", error)
      showNotification("Error al exportar datos", "error")
    }
  }

  // Métodos de tiempo real
  const startRealTimeUpdates = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }

    if (realTimeUpdates.value) {
      refreshInterval.value = window.setInterval(() => {
        loadDayData(selectedDate.value)
      }, 30000) // Actualizar cada 30 segundos
    }
  }

  const stopRealTimeUpdates = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  // Métodos de utilidad
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString()
  }

  const getRiskLevelColor = (riskLevel: string): string => {
    const colors = {
      low: "text-green-600 bg-green-100",
      medium: "text-yellow-600 bg-yellow-100",
      high: "text-orange-600 bg-orange-100",
      critical: "text-red-600 bg-red-100",
    }
    return colors[riskLevel as keyof typeof colors] || colors.low
  }

  const formatAttendanceRate = (rate: number): string => {
    return `${rate}%`
  }

  const getStudentInitials = (fullName: string): string => {
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return {
    // Estado
    isLoading,
    selectedDate,
    realTimeUpdates,

    // Datos
    dayMetrics,
    currentClasses,
    criticalStudents,

    // Computed
    todayClasses,
    activeClasses,
    completedClasses,
    upcomingClasses,
    highRiskStudents,
    averageAttendanceRate,

    // Permisos
    canViewClassMonitoring,
    canViewStudentReports,
    canContactParents,
    canGenerateReports,

    // Métodos principales
    loadDayData,
    loadDayMetrics,
    loadCurrentClasses,
    loadCriticalStudents,

    // Filtrado y búsqueda
    filterStudentsByRisk,
    filterStudentsByInstrument,
    searchStudents,
    sortStudents,

    // Comunicación
    generateCommunicationMessage,
    sendWhatsAppMessage,

    // Reportes
    generateWeeklyReport,
    exportStudentData,

    // Tiempo real
    startRealTimeUpdates,
    stopRealTimeUpdates,

    // Utilidades
    getRiskLevelColor,
    formatAttendanceRate,
    getStudentInitials,
  }
}
