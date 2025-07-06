<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
      Resumen Global de la Academia
    </h2>

    <!-- 1. Indicador de Salud General del Sistema -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Estado General del Sistema
      </h3>
      <div class="flex items-center space-x-3">
        <div
          :class="systemHealth.status === 'operational' ? 'bg-green-500' : 'bg-red-500'"
          class="w-4 h-4 rounded-full"
        />
        <p class="text-md font-medium text-gray-900 dark:text-white">{{ systemHealth.message }}</p>
      </div>
    </div>

    <ReporteAsistenciaDiaria />

    <!-- 4. Estudiantes en Riesgo -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Estudiantes en Riesgo (Top 5 Ausencias Injustificadas)
      </h3>
      <div
        v-if="studentsAtRisk.length === 0"
        class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center text-gray-500"
      >
        No hay estudiantes en riesgo actualmente.
      </div>
      <ul v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
        <li
          v-for="student in studentsAtRisk"
          :key="student.id"
          class="flex justify-between items-center"
        >
          <span class="text-gray-900 dark:text-white">{{ student.name }}</span>
          <span class="text-red-600 dark:text-red-400 font-semibold"
            >{{ student.absences }} ausencias</span
          >
        </li>
      </ul>
    </div>

    <!-- 5. Resumen Operacional (Métricas Adicionales) -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Resumen Operacional
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Nuevas Inscripciones (Último Mes)</p>
          <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {{ operationalSummary.newEnrollments }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Clases Activas</p>
          <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {{ operationalSummary.activeClasses }}
          </p>
        </div>
      </div>
    </div>

    <!-- Reporte Semanal -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Reporte Semanal</h3>
      <AdminReporteSemanal />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue"
import {httpsCallable} from "firebase/functions"
import {functions} from "@/firebase"
import {Timestamp} from "firebase/firestore"
import {whatsappService} from "../../../services/whatsappService"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
  BarElement,
} from "chart.js"
import {Line, Pie, Bar} from "vue-chartjs"

// Import Pinia Stores
import {useCommunicationStore} from "../../../stores/communication"
import {useAttendanceStore} from "../../../modulos/Attendance/store/attendance"
import {useStudentsStore} from "../../../modulos/Students/store/students"
import {useClassesStore} from "../../../modulos/Classes/store/classes"
import ReporteAsistenciaDiaria from "@/modulos/Attendance/views/ReporteAsistenciaDiaria.vue"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  BarElement
)

defineOptions({name: "GlobalOverview"})

const loading = ref(true)

// Data for System Health
const systemHealth = ref({
  status: "checking",
  message: "Verificando estado del sistema...",
})

// Data for Attendance Summary
const attendanceSummary = ref({
  overallPercentage: 0,
  unjustifiedAbsences: 0,
  lateArrivals: 0,
  averageAttendance: 0,
})

// Data for Communication Impact
const communicationImpact = ref({
  totalSent: 0,
  repliesReceived: 0,
})

// Data for Students at Risk
const studentsAtRisk = ref<Array<{id: string; name: string; absences: number}>>([])

// Data for Operational Summary
const operationalSummary = ref({
  newEnrollments: 0,
  activeClasses: 0,
})

// Chart Data - Initialize with safe defaults
const attendanceTrendChartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: "Asistencia %",
      data: [] as number[],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
    },
  ],
})

const attendanceDistributionChartData = ref({
  labels: ["Presentes", "Ausentes", "Tardanzas", "Justificados"],
  datasets: [
    {
      data: [0, 0, 0, 0],
      backgroundColor: ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"],
    },
  ],
})

const notificationCategoryChartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: "Notificaciones",
      data: [] as number[],
      backgroundColor: ["#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"],
    },
  ],
})

// Chart Options
const attendanceTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback(value: any) {
          return value + "%"
        },
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}

const attendanceDistributionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
  },
}

const notificationCategoryChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

const checkNotificationFunctions = httpsCallable(functions, "checkNotificationFunctionsHealth")

const fetchGlobalOverviewData = async () => {
  loading.value = true
  try {
    const communicationStore = useCommunicationStore()
    const attendanceStore = useAttendanceStore()
    const studentsStore = useStudentsStore()
    const classesStore = useClassesStore()

    // --- System Health ---
    let allOperational = true

    // Check Firestore Connection (via studentsStore fetch)
    try {
      await studentsStore.fetchStudents() // This will attempt to connect to Firestore
    } catch (e) {
      allOperational = false
      console.error("GlobalOverview: Firestore check failed:", e)
    }

    // Check WhatsApp API (handle CORS gracefully in development)
    try {
      const whatsappStatus = await whatsappService.checkStatus()
      if (whatsappStatus.status !== "connected") {
        allOperational = false
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("GlobalOverview: WhatsApp API check failed (expected in dev):", e)
        // Don't mark as failed in development due to CORS
      } else {
        allOperational = false
        console.error("GlobalOverview: WhatsApp API check failed:", e)
      }
    }

    // Check Notification Functions (skip in development due to CORS)
    if (import.meta.env.PROD) {
      try {
        const notifStatus = await checkNotificationFunctions()
        if ((notifStatus.data as any).status !== "operational") {
          allOperational = false
        }
      } catch (e) {
        allOperational = false
        console.warn("GlobalOverview: Notification Functions check failed (expected in dev):", e)
      }
    } else {
      console.log("GlobalOverview: Skipping notification functions check in development mode")
    }

    systemHealth.value.status = allOperational ? "operational" : "failed"
    systemHealth.value.message = allOperational
      ? "Todos los servicios principales están operativos."
      : import.meta.env.DEV
        ? "Algunos servicios no están disponibles en modo desarrollo (normal)."
        : "Se detectaron problemas en uno o más servicios clave."

    // --- Attendance Summary ---
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Fetch attendance data using the store
    await attendanceStore.fetchAttendanceDocuments(
      thirtyDaysAgo.toISOString().split("T")[0],
      today.toISOString().split("T")[0]
    )
    await attendanceStore.updateAnalytics() // Ensure analytics are updated in the store

    attendanceSummary.value.overallPercentage = attendanceStore.analytics?.averageAttendance || 0
    attendanceSummary.value.unjustifiedAbsences =
      attendanceStore.analytics?.absentStudents.length || 0
    attendanceSummary.value.lateArrivals = attendanceStore.analytics?.byClass
      ? Object.values(attendanceStore.analytics.byClass).reduce((sum, c) => sum + c.delayed, 0)
      : 0
    attendanceSummary.value.averageAttendance = attendanceStore.analytics?.averageAttendance || 0

    // Prepare data for Attendance Trend Chart (last 30 days)
    const dailyAttendanceMap = new Map<
      string,
      {present: number; absent: number; late: number; justified: number}
    >()
    attendanceStore.attendanceDocuments.forEach((doc) => {
      const dateKey = doc.fecha // Assuming date is stored as YYYY-MM-DD string
      const presentes = doc.data.presentes?.length || 0
      const ausentes = doc.data.ausentes?.length || 0
      const tardes = doc.data.tarde?.length || 0
      const justificados = doc.data.justificacion?.length || 0

      if (!dailyAttendanceMap.has(dateKey)) {
        dailyAttendanceMap.set(dateKey, {present: 0, absent: 0, late: 0, justified: 0})
      }
      const dailyData = dailyAttendanceMap.get(dateKey)!
      dailyData.present += presentes
      dailyData.absent += ausentes
      dailyData.late += tardes
      dailyData.justified += justificados
    })

    const trendLabels: string[] = []
    const trendData: number[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - (29 - i)) // Go from 29 days ago to today
      const dateKey = d.toISOString().split("T")[0]
      trendLabels.push(d.toLocaleDateString("es-ES", {day: "numeric", month: "short"}))

      const dailyStats = dailyAttendanceMap.get(dateKey)
      if (dailyStats) {
        const dailyTotal =
          dailyStats.present + dailyStats.absent + dailyStats.late + dailyStats.justified
        trendData.push(dailyTotal > 0 ? Math.round((dailyStats.present / dailyTotal) * 100) : 0)
      } else {
        trendData.push(0) // No data for this day
      }
    }
    attendanceTrendChartData.value.labels = trendLabels
    attendanceTrendChartData.value.datasets[0].data = trendData

    // Prepare data for Attendance Distribution Chart (last 7 days for simplicity, can be adjusted)
    let distPresent = 0
    let distAbsent = 0
    let distLate = 0
    let distJustified = 0

    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateKey = d.toISOString().split("T")[0]
      const dailyStats = dailyAttendanceMap.get(dateKey)
      if (dailyStats) {
        distPresent += dailyStats.present
        distAbsent += dailyStats.absent
        distLate += dailyStats.late
        distJustified += dailyStats.justified
      }
    }
    attendanceDistributionChartData.value.datasets[0].data = [
      distPresent,
      distAbsent,
      distLate,
      distJustified,
    ]

    // --- Communication Impact (handle CORS gracefully) ---
    try {
      await communicationStore.fetchCommunicationData(30) // Fetch data for last 30 days
      communicationImpact.value.totalSent = communicationStore.totalSentNotifications
      communicationImpact.value.repliesReceived = communicationStore.totalRepliesReceived

      // Prepare data for Notification Category Chart
      const categories = communicationStore.getNotificationCategories
      notificationCategoryChartData.value.labels = categories.map((c) => c.name)
      notificationCategoryChartData.value.datasets[0].data = categories.map((c) => c.count)
    } catch (e) {
      console.warn("GlobalOverview: Communication data fetch failed (possibly due to CORS):", e)
      // Set default values
      communicationImpact.value.totalSent = 0
      communicationImpact.value.repliesReceived = 0
      notificationCategoryChartData.value.labels = ["Sin datos"]
      notificationCategoryChartData.value.datasets[0].data = [0]
    }

    // --- Students at Risk (handle potential API failures) ---
    try {
      const studentsAtRiskData = await attendanceStore.fetchTopAbsentStudentsByRange(
        thirtyDaysAgo.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
        5
      )
      studentsAtRisk.value = studentsAtRiskData.map((s) => ({
        id: s.studentId,
        name: s.studentName,
        absences: s.absences,
      }))
    } catch (e) {
      console.warn("GlobalOverview: Students at risk fetch failed:", e)
      studentsAtRisk.value = []
    }

    // --- Operational Summary ---
    await studentsStore.fetchStudents() // Ensure students are loaded
    operationalSummary.value.newEnrollments = studentsStore.students.filter((s) => {
      if (!s.createdAt) return false
      const studentCreatedAt =
        s.createdAt instanceof Timestamp ? s.createdAt.toDate() : new Date(s.createdAt)
      return studentCreatedAt >= thirtyDaysAgo
    }).length

    await classesStore.fetchClasses() // Ensure classes are loaded
    operationalSummary.value.activeClasses = classesStore.activeClasses
  } catch (error) {
    console.error("Error fetching global overview data:", error)
    systemHealth.value.status = "failed"
    systemHealth.value.message = "Error al cargar algunos datos del sistema."
  } finally {
    loading.value = false
  }
}

// Initialize on mount
onMounted(() => {
  fetchGlobalOverviewData()
})
import AdminReporteSemanal from "../../../modulos/Teachers/view/admin/AdminReporteSemanal.vue"
</script>

<style scoped>
/* Add specific styles for GlobalOverview if needed */
</style>
